import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState, useRef } from "react";
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
                      <div className="text-xs text-muted-foreground">
                        {(f.crops ?? []).join(", ") || "No crops yet"}
                      </div>
                      {/* Show size and previous crops */}
                      <div className="text-xs text-muted-foreground mt-1">
                        {typeof (f as any).size === "number" ? `Size: ${(f as any).size} acres • ` : ""}
                        {Array.isArray((f as any).previousCrops) && (f as any).previousCrops.length > 0
                          ? `Previous: ${(f as any).previousCrops.join(", ")}`
                          : "Previous: —"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs">
                        {f.modelReady ? (
                          <span className="text-green-600">3D model ready</span>
                        ) : (
                          <span className="text-amber-600">3D model not ready</span>
                        )}
                      </div>
                      <Button size="sm" onClick={() => openSim(f._id as any)} disabled={!auth?.authenticated}>
                        Enter Simulation
                      </Button>
                    </div>
                  </div>

                  {/* 3D Capture Section */}
                  <div className="rounded-md border p-3">
                    <div className="text-sm font-medium mb-2">3D Capture</div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs text-muted-foreground">
                        {/* Simplified test mode stat */}
                        Field photo: {(f.cornerPhotos?.length ?? 0)}/1
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {/* Replace label-wrapper with Button asChild + htmlFor for reliable file picker */}
                        <input
                          id={uploadId}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => uploadCornerPhotos(f._id as any, e.target.files)}
                        />
                        <Button asChild variant="outline" size="sm">
                          <label htmlFor={uploadId}>Upload Field Photo</label>
                        </Button>
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              await finalizeModel({ id: f._id as any });
                              toast.success("3D model generated");
                              navigate(`/farm/${f._id as any}/model`);
                            } catch (e: any) {
                              toast.error(e?.message ?? "Failed to generate model");
                            }
                          }}
                          disabled={(f.cornerPhotos?.length ?? 0) < 1}
                        >
                          Generate 3D Model
                        </Button>
                      </div>
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
              {!sim ? (
                <div className="text-sm text-muted-foreground">Loading simulation…</div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground mb-1">Stage</div>
                      <div className="text-lg font-semibold">{sim.stage}</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground mb-1">Weather</div>
                      <div className="text-lg font-semibold">{sim.weather}</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground mb-1">Soil Moisture</div>
                      <div className="text-lg font-semibold">{sim.soilMoisture}%</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground mb-1">Balance</div>
                      <div className="text-lg font-semibold">₹{sim.balance}</div>
                    </div>
                    <div className="rounded-md border p-3 sm:col-span-2">
                      <div className="text-xs text-muted-foreground mb-1">Current Crop</div>
                      <div className="text-lg font-semibold">{sim.crop ?? "—"}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => advance({ farmId: simFarmId as any })}>Advance Day</Button>
                    <Button variant="outline" onClick={() => water({ farmId: simFarmId as any })}>Water Field</Button>
                    <Button variant="secondary" onClick={() => plant({ crop: "rice", farmId: simFarmId as any })}>Plant Rice (₹200)</Button>
                    <Button variant="secondary" onClick={() => plant({ crop: "wheat", farmId: simFarmId as any })}>Plant Wheat (₹200)</Button>
                    <Button
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
                </>
              )}
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