import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Link } from "react-router";

export default function MyFarm() {
  const farms = useQuery(api.farms.list);
  const auth = useQuery(api.farms.authStatus);
  const create = useMutation(api.farms.create);
  const setCornerPhotos = useMutation(api.farms.setCornerPhotos);
  const setWalkPath = useMutation(api.farms.setWalkPath);
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

  const [recordingFarmId, setRecordingFarmId] = useState<string | null>(null);
  const [path, setPath] = useState<Record<string, Array<{ lat: number; lng: number; ts: number }>>>({});
  const watchIdRef = useRef<number | null>(null);

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
      const max = Math.min(4, files.length);
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
      toast.success("Corner photos saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to upload photos");
    }
  };

  // GPS recording controls
  const startRecording = (farmId: string) => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setRecordingFarmId(farmId);
    const local: Array<{ lat: number; lng: number; ts: number }> = [];
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        local.push({ lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() });
        setPath((prev) => ({ ...prev, [farmId]: [...local] }));
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
    watchIdRef.current = watchId as any;
  };

  const stopRecording = async (farmId: string) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setRecordingFarmId(null);
    try {
      const p = path[farmId] ?? [];
      if (p.length < 10) {
        toast.error("Walk a bit more around the field to capture shape");
        return;
      }
      await setWalkPath({ id: farmId as any, path: p });
      toast.success("Walk path saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save path");
    }
  };

  // Simulation helpers (per farm)
  const openSim = async (farmId: string) => {
    try {
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
                    <div className="text-xs">
                      {f.modelReady ? (
                        <span className="text-green-600">3D model ready</span>
                      ) : (
                        <span className="text-amber-600">3D model not ready</span>
                      )}
                    </div>
                  </div>

                  {/* 3D Capture Section */}
                  <div className="rounded-md border p-3">
                    <div className="text-sm font-medium mb-2">3D Capture</div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs text-muted-foreground">
                        Corner photos: {(f.cornerPhotos?.length ?? 0)}/4 • Walk points: {points || (f.walkPath?.length ?? 0)}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <label>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            className="hidden"
                            onChange={(e) => uploadCornerPhotos(f._id as any, e.target.files)}
                          />
                          <Button variant="outline" size="sm">Add Corner Photos</Button>
                        </label>
                        {!isRec ? (
                          <Button variant="secondary" size="sm" onClick={() => startRecording(f._id as any)}>
                            Start GPS Walk
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => stopRecording(f._id as any)}>
                            Stop & Save Walk
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              await finalizeModel({ id: f._id as any });
                              toast.success("3D model finalized");
                            } catch (e: any) {
                              toast.error(e?.message ?? "Finalize failed");
                            }
                          }}
                        >
                          Finalize 3D Model
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

                      {/* Minimal 3D Preview placeholder */}
                      <div className="rounded-lg border bg-gradient-to-br from-emerald-50 to-emerald-100 p-3">
                        <div className="aspect-[4/3] w-full rounded-md bg-white grid place-items-center overflow-hidden relative">
                          <div className="absolute inset-0 bg-[linear-gradient(45deg,#e2f7e2_12%,transparent_12%,transparent_50%,#e2f7e2_50%,#e2f7e2_62%,transparent_62%,transparent_100%)] bg-[length:24px_24px] opacity-50" />
                          <div className="relative">
                            <div className="h-24 w-24 bg-emerald-500/80 rounded-md shadow-lg animate-[spin_8s_linear_infinite]" />
                          </div>
                        </div>
                        <div className="mt-2 text-[11px] text-muted-foreground">
                          3D preview generated from your corner photos and walk path.
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
      </div>
    </AppShell>
  );
}