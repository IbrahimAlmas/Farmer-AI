import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function MyFarm() {
  const farms = useQuery(api.farms.list);
  const auth = useQuery(api.farms.authStatus);
  const create = useMutation(api.farms.create);
  const setCornerPhotos = useMutation(api.farms.setCornerPhotos);
  const finalizeModel = useMutation(api.farms.finalizeModel);

  const ensureSim = useMutation(api.sims.ensure);
  const getUploadUrl = useMutation(api.soil_upload.getUploadUrl);

  const advance = useMutation(api.sims.advanceTick);
  const plant = useMutation(api.sims.plantCrop);
  const water = useMutation(api.sims.water);
  const harvest = useMutation(api.sims.harvest);

  const [name, setName] = useState("");
  const [size, setSize] = useState<string>("");
  const [prevCropsInput, setPrevCropsInput] = useState<string>("");

  const navigate = useNavigate();

  const [recordingFarmId, setRecordingFarmId] = useState<string | null>(null);
  const [path, setPath] = useState<Record<string, Array<{ lat: number; lng: number; ts: number }>>>({}); 
  const watchIdRef = useRef<number | null>(null);

  const [simFarmId, setSimFarmId] = useState<string | null>(null); // Window: which farm is open in sim

  // Derived: active farm + sim state
  const activeFarm = (farms ?? []).find((ff: any) => (ff._id as any) === simFarmId) as any | undefined;
  const sim = useQuery(api.sims.get, simFarmId ? ({ farmId: simFarmId as any } as any) : "skip") as any;

  const [angle, setAngle] = useState<{ x: number; y: number }>({ x: 25, y: -30 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      lastRef.current = { x: e.clientX, y: e.clientY };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !lastRef.current) return;
      const dx = e.clientX - lastRef.current.x;
      const dy = e.clientY - lastRef.current.y;
      lastRef.current = { x: e.clientX, y: e.clientY };
      setAngle((prev) => ({
        x: Math.max(-85, Math.min(85, prev.x - dy * 0.4)),
        y: prev.y + dx * 0.5,
      }));
    };
    const onPointerUp = () => {
      isDraggingRef.current = false;
      lastRef.current = null;
    };
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  const photoId = (activeFarm?.cornerPhotos?.[0] as any) ?? null;
  const photoUrl = useQuery(
    api.soil_upload.getFileUrl,
    photoId ? ({ fileId: photoId as any } as any) : "skip"
  ) as string | null;

  const add = async () => {
    if (!name.trim()) return;
    try {
      // Parse previous crops from comma-separated input
      const previousCrops = prevCropsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      // Parse numeric size if provided
      const numericSize = size.trim() ? Number(size) : undefined;
      if (numericSize !== undefined && (isNaN(numericSize) || numericSize <= 0)) {
        toast.error("Please enter a valid farm size (number > 0)");
        return;
      }

      await create({
        name,
        crops: [],
        location: undefined,
        // pass new optional fields
        size: numericSize as any,
        previousCrops: previousCrops as any,
      });
      setName("");
      setSize("");
      setPrevCropsInput("");
      toast.success("Farm added");
    } catch (e: any) {
      // Improve error messaging for auth
      const msg = e?.message ?? "";
      if (typeof msg === "string" && msg.toLowerCase().includes("not authenticated")) {
        toast.error("Please sign in to add a farm.");
      } else {
        toast.error("Failed to add farm");
      }
    }
  };

  // Helper: upload images and save as corner photos
  const uploadCornerPhotos = async (farmId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const ids: string[] = [];
      const max = Math.min(1, files.length); // limit to 1
      for (let i = 0; i < max; i++) {
        const f = files[i];
        const url = await getUploadUrl({});
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": f.type || "application/octet-stream" },
          body: f,
        });
        const { storageId } = (await res.json()) as { storageId: string };
        ids.push(storageId);
      }
      await setCornerPhotos({ id: farmId as any, photoIds: ids as any });
      toast.success("Photo uploaded. Click 'Generate 3D Model' to continue.");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to upload photo");
    }
  };

  const openSim = async (farmId: string) => {
    try {
      setSimFarmId(farmId); // open the in-app window
      await ensureSim({ farmId: farmId as any });
      toast.success("Simulation ready");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to open simulation");
    }
  };

  return (
    <AppShell title="My Farm">
      <div className="p-4 space-y-4">
        {/* Show sign-in prompt if not authenticated */}
        {auth?.authenticated === false && (
          <Card className="border-amber-300">
            <CardHeader>
              <CardTitle>Sign in required</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Please sign in to create and manage your farms.
              </div>
              <Button asChild className="bg-amber-600 hover:bg-amber-500 text-white">
                <Link to="/auth">Go to Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Add Farm</CardTitle></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-[1fr_140px_1fr_auto]">
            <Input placeholder="Farm name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              placeholder="Size (acres)"
              inputMode="decimal"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            />
            <Input
              placeholder="Previous crops (comma separated)"
              value={prevCropsInput}
              onChange={(e) => setPrevCropsInput(e.target.value)}
            />
            {/* Disable Add if not authenticated */}
            <Button onClick={add} disabled={!auth?.authenticated || !name.trim()}>Add</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Your Farms</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {farms?.length ? farms.map((f) => {
              const isRec = recordingFarmId === (f._id as any);
              const points = path[f._id as any]?.length ?? 0;
              // Add crops to visualize in the 3D preview (prefer previousCrops for variety)
              const cropsList: Array<string> =
                (Array.isArray((f as any).previousCrops) && (f as any).previousCrops.length > 0
                  ? (f as any).previousCrops
                  : Array.isArray(f.crops)
                  ? f.crops
                  : []) as any;
              const palette: Array<string> = ["#8BC34A", "#4CAF50", "#FFC107", "#FF9800", "#9C27B0"];
              // Add: unique input id for label->input pairing
              const uploadId = `farm-photo-${f._id as any}`;
              return (
                <div key={f._id} className="border rounded-md p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{f.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => openSim(f._id as any)} disabled={!auth?.authenticated}>
                        Enter Simulation
                      </Button>
                    </div>
                  </div>

                  {/* 3D Capture Section — removed per request */}

                  {/* Inline Simulation Section — removed per request */}

                  {/* Embedded 3D mini-viewer */}
                  <div className="rounded-md border p-3">
                    <div className="text-sm font-medium mb-2">Field 3D View</div>
                    <div className="w-full grid place-items-center">
                      <div
                        ref={containerRef}
                        className="relative"
                        style={{
                          width: 520,
                          height: 360,
                          perspective: "1000px",
                          cursor: "grab",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            transformStyle: "preserve-3d",
                            transform: `rotateX(${angle.x}deg) rotateY(${angle.y}deg) translateZ(-60px)`,
                            transition: isDraggingRef.current ? "none" : "transform 0.08s ease-out",
                          }}
                        >
                          {(() => {
                            const size = 260;
                            return (
                              <>
                                <div
                                  style={{
                                    position: "absolute",
                                    width: size,
                                    height: size,
                                    left: "50%",
                                    top: "50%",
                                    transform: `translate(-50%, -50%) rotateX(90deg) translateZ(${size / 2}px)`,
                                    backgroundImage: photoUrl
                                      ? `url(${photoUrl})`
                                      : "linear-gradient(135deg, #dcedc8, #a5d6a7)",
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    border: "1px solid rgba(0,0,0,0.1)",
                                    boxShadow: "inset 0 0 80px rgba(0,0,0,0.15)",
                                  }}
                                />
                                <div
                                  style={{
                                    position: "absolute",
                                    width: size,
                                    height: size,
                                    left: "50%",
                                    top: "50%",
                                    transform: `translate(-50%, -50%) rotateX(-90deg) translateZ(${size / 2}px)`,
                                    background: "#795548",
                                  }}
                                />
                                <div
                                  style={{
                                    position: "absolute",
                                    width: size,
                                    height: size / 3,
                                    left: "50%",
                                    top: "50%",
                                    transform: `translate(-50%, -50%) translateZ(${size / 2}px)`,
                                    background: "linear-gradient(to bottom, #795548, #5d4037)",
                                    border: "1px solid rgba(0,0,0,0.08)",
                                  }}
                                />
                                <div
                                  style={{
                                    position: "absolute",
                                    width: size,
                                    height: size / 3,
                                    left: "50%",
                                    top: "50%",
                                    transform: `translate(-50%, -50%) rotateY(180deg) translateZ(${size / 2}px)`,
                                    background: "linear-gradient(to bottom, #795548, #5d4037)",
                                    border: "1px solid rgba(0,0,0,0.08)",
                                  }}
                                />
                                <div
                                  style={{
                                    position: "absolute",
                                    width: size,
                                    height: size / 3,
                                    left: "50%",
                                    top: "50%",
                                    transform: `translate(-50%, -50%) rotateY(-90deg) translateZ(${size / 2}px)`,
                                    background: "linear-gradient(to bottom, #795548, #5d4037)",
                                    border: "1px solid rgba(0,0,0,0.08)",
                                  }}
                                />
                                <div
                                  style={{
                                    position: "absolute",
                                    width: size,
                                    height: size / 3,
                                    left: "50%",
                                    top: "50%",
                                    transform: `translate(-50%, -50%) rotateY(90deg) translateZ(${size / 2}px)`,
                                    background: "linear-gradient(to bottom, #795548, #5d4037)",
                                    border: "1px solid rgba(0,0,0,0.08)",
                                  }}
                                />
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      {!photoUrl && (
                        <div className="text-xs text-muted-foreground mt-2 text-center">
                          Upload a field photo on My Farm to texture the model.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Simulation Section */}
                  {f.modelReady && (
                    <div className="rounded-md border p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Simulation</div>
                        <Button size="sm" onClick={() => openSim(f._id as any)}>Enter Simulation</Button>
                      </div>

                      {/* 3D-like Field Preview derived from crops */}
                      <div className="rounded-lg border bg-gradient-to-br from-emerald-50 to-emerald-100 p-3">
                        <div className="aspect-[4/3] w-full rounded-md bg-white grid place-items-center overflow-hidden relative">
                          <div className="absolute inset-0 bg-[linear-gradient(45deg,#e2f7e2_12%,transparent_12%,transparent_50%,#e2f7e2_50%,#e2f7e2_62%,transparent_62%,transparent_100%)] bg-[length:24px_24px] opacity-50" />
                          <div className="relative w-full h-full grid place-items-center">
                            <div
                              className="w-[80%] h-[65%] mx-auto rounded-md shadow"
                              style={{
                                transform: "perspective(900px) rotateX(55deg) rotateZ(-12deg)",
                                transformOrigin: "center",
                                background: "#d4f7d9",
                                border: "1px solid rgba(0,0,0,0.08)",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                                overflow: "hidden",
                              }}
                            >
                              {(cropsList?.length ?? 0) > 0 ? (
                                cropsList.slice(0, 5).map((crop, i) => (
                                  <div
                                    key={i}
                                    className="relative"
                                    style={{
                                      height: `${100 / Math.min(5, cropsList.length)}%`,
                                      background: `linear-gradient(135deg, ${palette[i % palette.length]}66, ${palette[i % palette.length]})`,
                                      borderBottom: "1px solid rgba(0,0,0,0.12)",
                                      boxShadow: "inset 0 2px 6px rgba(0,0,0,0.12)",
                                    }}
                                  >
                                    <div
                                      className="absolute left-2 top-1 text-[10px] font-medium text-black/80"
                                      style={{ transform: "rotateX(-55deg) rotateZ(12deg)" }}
                                    >
                                      {crop}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div
                                  className="absolute inset-0 grid place-items-center text-xs text-muted-foreground"
                                  style={{ transform: "rotateX(-55deg) rotateZ(12deg)" }}
                                >
                                  Add crops to visualize plots
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-[11px] text-muted-foreground">
                          Simple 3D field sketch derived from your photo and crops.
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button onClick={() => advance({ farmId: f._id as any })}>Advance Day</Button>
                        <Button variant="outline" onClick={() => water({ farmId: f._id as any })}>Water Field</Button>
                        <Button variant="secondary" onClick={() => plant({ crop: "rice", farmId: f._id as any })}>
                          Plant Rice (₹200)
                        </Button>
                        <Button variant="secondary" onClick={() => plant({ crop: "wheat", farmId: f._id as any })}>
                          Plant Wheat (₹200)
                        </Button>
                        <Button className="col-span-2" onClick={async () => {
                          try {
                            const res = await harvest({ farmId: f._id as any });
                            const gained = (res as any)?.payout ?? 0;
                            toast.success(`Harvested! Earned ₹${gained}`);
                          } catch (e: any) {
                            toast.error(e?.message ?? "Failed to harvest");
                          }
                        }}>
                          Harvest
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }) : <div className="text-sm text-muted-foreground">No farms yet.</div>}
          </CardContent>
        </Card>

        {/* Simulation Window (in-app) */}
        <Dialog open={!!simFarmId} onOpenChange={(o) => { if (!o) setSimFarmId(null); }}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Simulation{activeFarm ? ` — ${activeFarm.name}` : ""}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Embedded 3D mini-viewer */}
              <div className="rounded-md border p-3">
                <div className="text-sm font-medium mb-2">Field 3D View</div>
                <div className="w-full grid place-items-center">
                  <div
                    ref={containerRef}
                    className="relative"
                    style={{
                      width: 520,
                      height: 360,
                      perspective: "1000px",
                      cursor: "grab",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        transformStyle: "preserve-3d",
                        transform: `rotateX(${angle.x}deg) rotateY(${angle.y}deg) translateZ(-60px)`,
                        transition: isDraggingRef.current ? "none" : "transform 0.08s ease-out",
                      }}
                    >
                      {(() => {
                        const size = 260;
                        return (
                          <>
                            <div
                              style={{
                                position: "absolute",
                                width: size,
                                height: size,
                                left: "50%",
                                top: "50%",
                                transform: `translate(-50%, -50%) rotateX(90deg) translateZ(${size / 2}px)`,
                                backgroundImage: photoUrl
                                  ? `url(${photoUrl})`
                                  : "linear-gradient(135deg, #dcedc8, #a5d6a7)",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                border: "1px solid rgba(0,0,0,0.1)",
                                boxShadow: "inset 0 0 80px rgba(0,0,0,0.15)",
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                width: size,
                                height: size,
                                left: "50%",
                                top: "50%",
                                transform: `translate(-50%, -50%) rotateX(-90deg) translateZ(${size / 2}px)`,
                                background: "#795548",
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                width: size,
                                height: size / 3,
                                left: "50%",
                                top: "50%",
                                transform: `translate(-50%, -50%) translateZ(${size / 2}px)`,
                                background: "linear-gradient(to bottom, #795548, #5d4037)",
                                border: "1px solid rgba(0,0,0,0.08)",
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                width: size,
                                height: size / 3,
                                left: "50%",
                                top: "50%",
                                transform: `translate(-50%, -50%) rotateY(180deg) translateZ(${size / 2}px)`,
                                background: "linear-gradient(to bottom, #795548, #5d4037)",
                                border: "1px solid rgba(0,0,0,0.08)",
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                width: size,
                                height: size / 3,
                                left: "50%",
                                top: "50%",
                                transform: `translate(-50%, -50%) rotateY(-90deg) translateZ(${size / 2}px)`,
                                background: "linear-gradient(to bottom, #795548, #5d4037)",
                                border: "1px solid rgba(0,0,0,0.08)",
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                width: size,
                                height: size / 3,
                                left: "50%",
                                top: "50%",
                                transform: `translate(-50%, -50%) rotateY(90deg) translateZ(${size / 2}px)`,
                                background: "linear-gradient(to bottom, #795548, #5d4037)",
                                border: "1px solid rgba(0,0,0,0.08)",
                              }}
                            />
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                {!photoUrl && (
                  <div className="text-xs text-muted-foreground mt-2 text-center">
                    Upload a field photo on My Farm to texture the model.
                  </div>
                )}
              </div>

              {/* Add: show preparing message while sim initializes */}
              {!sim && (
                <div className="text-sm text-muted-foreground">
                  Preparing simulation...
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground mb-1">Stage</div>
                  <div className="text-lg font-semibold">{sim?.stage ?? "—"}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground mb-1">Weather</div>
                  <div className="text-lg font-semibold">{sim?.weather ?? "—"}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground mb-1">Soil Moisture</div>
                  <div className="text-lg font-semibold">{sim ? `${sim.soilMoisture}%` : "—"}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground mb-1">Balance</div>
                  <div className="text-lg font-semibold">{sim ? `₹${sim.balance}` : "—"}</div>
                </div>
                <div className="rounded-md border p-3 sm:col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Current Crop</div>
                  <div className="text-lg font-semibold">{sim?.crop ?? "—"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button disabled={!sim} onClick={() => advance({ farmId: simFarmId as any })}>Advance Day</Button>
                <Button disabled={!sim} variant="outline" onClick={() => water({ farmId: simFarmId as any })}>Water Field</Button>
                <Button disabled={!sim} variant="secondary" onClick={() => plant({ crop: "rice", farmId: simFarmId as any })}>Plant Rice (₹200)</Button>
                <Button disabled={!sim} variant="secondary" onClick={() => plant({ crop: "wheat", farmId: simFarmId as any })}>Plant Wheat (₹200)</Button>
                <Button
                  disabled={!sim}
                  className="col-span-2"
                  onClick={async () => {
                    try {
                      const res = await harvest({ farmId: simFarmId as any });
                      const gained = (res as any)?.payout ?? 0;
                      toast.success(`Harvested! Earned ₹${gained}`);
                    } catch (e: any) {
                      toast.error(e?.message ?? "Failed to harvest");
                    }
                  }}
                >
                  Harvest
                </Button>
              </div>
            </div>

            <DialogFooter className="justify-between sm:justify-end">
              <Button variant="outline" onClick={() => setSimFarmId(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}