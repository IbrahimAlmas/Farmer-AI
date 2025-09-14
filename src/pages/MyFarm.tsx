import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router";

export default function MyFarm() {
  const farms = useQuery(api.farms.list);
  const create = useMutation(api.farms.create);
  const setCornerPhotos = useMutation(api.farms.setCornerPhotos);
  const finalizeModel = useMutation(api.farms.finalizeModel);

  const ensureSim = useMutation(api.sims.ensure);
  const getUploadUrl = useMutation(api.soil_upload.getUploadUrl);

  const advance = useMutation(api.sims.advanceTick);
  const plant = useMutation(api.sims.plantCrop);
  const water = useMutation(api.sims.water);
  const harvest = useMutation(api.sims.harvest);

  const generate3D = useAction((api as any).meshy.generateFromFarmPhoto as any);
  const checkStatus = useAction((api as any).meshy.checkStatus as any);

  const [name, setName] = useState("");
  const [size, setSize] = useState<string>("");
  const [prevCropsInput, setPrevCropsInput] = useState<string>("");

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
            {/* Enable Add without auth */}
            <Button onClick={add} disabled={!name.trim()}>Add</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Your Farms</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {farms?.length ? farms.map((f) => {
              return (
                <div key={f._id} className="border rounded-md p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{f.name}</div>
                      {f.modelStatus && (
                        <div className="text-xs text-muted-foreground">
                          Model: {f.modelStatus}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = async () => {
                            try {
                              // @ts-ignore
                              const files = input.files as FileList | null;
                              await uploadCornerPhotos(f._id as any, files);
                            } catch (e: any) {
                              toast.error(e?.message ?? "Upload failed");
                            }
                          };
                          input.click();
                        }}
                      >
                        Upload Photo
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          try {
                            toast.info("Starting 3D generation...");
                            const res = await generate3D({ id: f._id as any });
                            if ((res as any)?.pending) {
                              toast.success("Model is being processed. This may take a couple of minutes.");
                            } else {
                              toast.success("3D model ready!");
                            }
                          } catch (e: any) {
                            toast.error(e?.message ?? "Failed to generate 3D model");
                          }
                        }}
                      >
                        Generate 3D Model (AI)
                      </Button>

                      {f.modelStatus === "processing" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const res = await checkStatus({ id: f._id as any });
                              const status = (res as any)?.status;
                              if ((res as any)?.success && status === "ready") {
                                toast.success("3D model is ready!");
                              } else if ((res as any)?.success) {
                                toast.info(`Model status: ${status ?? "processing"}`);
                              } else {
                                toast.error((res as any)?.error ?? "Failed to check status");
                              }
                            } catch (e: any) {
                              toast.error(e?.message ?? "Failed to check status");
                            }
                          }}
                        >
                          Check Status
                        </Button>
                      )}

                      {f.modelStatus === "failed" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            try {
                              toast.info("Retrying 3D generation...");
                              const res = await generate3D({ id: f._id as any });
                              if ((res as any)?.pending) {
                                toast.success("Model retry started. It may take a couple of minutes.");
                              } else {
                                toast.success("3D model ready!");
                              }
                            } catch (e: any) {
                              toast.error(e?.message ?? "Retry failed");
                            }
                          }}
                        >
                          Retry
                        </Button>
                      )}

                      {f.modelStatus === "ready" && f.modelPreviewUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            try {
                              window.open(f.modelPreviewUrl as string, "_blank");
                            } catch {
                              /* noop */
                            }
                          }}
                        >
                          Preview
                        </Button>
                      )}

                      <Button size="sm" onClick={() => openSim(f._id as any)}>
                        Enter Simulation
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }) : <div className="text-sm text-muted-foreground">No farms yet.</div>}
          </CardContent>
        </Card>

        {/* Full-screen Simulation Window */}
        {simFarmId && (
          <div className="fixed inset-0 z-50 bg-background text-foreground">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b p-3">
              <div className="font-semibold">
                Simulation{activeFarm ? ` — ${activeFarm.name}` : ""}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setAngle({ x: 25, y: -30 })}>
                  Reset View
                </Button>
                <Button variant="secondary" onClick={() => setSimFarmId(null)}>
                  Back to App
                </Button>
              </div>
            </div>

            {/* Content area */}
            <div className="h-[calc(100vh-56px)] overflow-auto">
              <div className="max-w-5xl mx-auto p-4 space-y-4">
                {/* Optional hint while initializing */}
                {!sim && (
                  <div className="text-sm text-muted-foreground">
                    Initializing simulation...
                  </div>
                )}

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
                                    : "linear-gradient(135deg, #8bc34a, #4caf50)",
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  border: "1px solid rgba(0,0,0,0.1)",
                                  boxShadow: "inset 0 0 40px rgba(0,0,0,0.12)",
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

                {/* Stats */}
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
                    <div className="text-lg font-semibold">
                      {typeof sim?.soilMoisture === "number" ? `${sim.soilMoisture}%` : "—"}
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground mb-1">Balance</div>
                    <div className="text-lg font-semibold">
                      {typeof sim?.balance === "number" ? `₹${sim.balance}` : "—"}
                    </div>
                  </div>
                  <div className="rounded-md border p-3 sm:col-span-2">
                    <div className="text-xs text-muted-foreground mb-1">Current Crop</div>
                    <div className="text-lg font-semibold">{sim?.crop ?? "—"}</div>
                  </div>
                </div>

                {/* Controls */}
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
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}