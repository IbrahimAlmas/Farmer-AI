import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

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
  const sowSeed = useMutation(api.sims.sowSeed);
  const setIrrigationMethodMutation = useMutation(api.sims.setIrrigationMethod);
  const irrigateField = useMutation(api.sims.irrigate);

  const generate3D = useAction((api as any).meshy.generateFromFarmPhoto as any);
  const checkStatus = useAction((api as any).meshy.checkStatus as any);

  const updateFarm = useMutation(api.farms.update);
  const getIrrigation = useAction(api.agro.getIrrigationRecommendation);

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

  const [selectedCrop, setSelectedCrop] = useState<string>("wheat");
  const [advisor, setAdvisor] = useState<any | null>(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);

  const [selectedSeed, setSelectedSeed] = useState<string>("wheat");
  const [irrigationMethod, setIrrigationMethod] = useState<string>("sprinkler");
  const [irrigationAmount, setIrrigationAmount] = useState<string>("10");
  const [showAnimation, setShowAnimation] = useState<string | null>(null);

  useEffect(() => {
    if (sim?.crop) setSelectedCrop(sim.crop);
  }, [sim?.crop]);

  const requestGeo = () =>
    new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      }),
    );

  const saveMyLocation = async () => {
    try {
      if (!activeFarm) return;
      const pos = await requestGeo();
      await updateFarm({
        id: activeFarm._id as any,
        location: {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        } as any,
      });
      toast.success("Location saved to farm");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save location");
    }
  };

  const runAdvisor = async () => {
    try {
      setAdvisorLoading(true);
      let lat = activeFarm?.location?.lat ?? null;
      let lng = activeFarm?.location?.lng ?? null;
      if (lat == null || lng == null) {
        const pos = await requestGeo();
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }
      const res = await getIrrigation({
        lat: lat as number,
        lng: lng as number,
        crop: selectedCrop || "wheat",
        stage: sim?.stage || "vegetative",
        areaAcres: (activeFarm?.size as any) ?? undefined,
      });
      setAdvisor(res as any);
      toast.success("Irrigation plan updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not fetch recommendation");
    } finally {
      setAdvisorLoading(false);
    }
  };

  const handleSowSeed = async () => {
    try {
      const res = await sowSeed({ seedKey: selectedSeed, farmId: simFarmId as any });
      toast.success(`Sowed ${(res as any).seedName} successfully!`);
      setShowAnimation("sowing");
      setTimeout(() => setShowAnimation(null), 2000);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to sow seeds");
    }
  };

  const handleSetIrrigation = async () => {
    try {
      await setIrrigationMethodMutation({ method: irrigationMethod, farmId: simFarmId as any });
      toast.success(`Irrigation method set to ${irrigationMethod}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to set irrigation method");
    }
  };

  const handleIrrigate = async () => {
    const mm = parseFloat(irrigationAmount);
    if (isNaN(mm) || mm <= 0 || mm > 100) {
      toast.error("Please enter a valid irrigation amount (1-100mm)");
      return;
    }
    
    try {
      const res = await irrigateField({ mm, farmId: simFarmId as any });
      toast.success(`Applied ${(res as any).effectiveMm}mm effective water via ${(res as any).method}`);
      setShowAnimation("irrigating");
      setTimeout(() => setShowAnimation(null), 2000);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to irrigate field");
    }
  };

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

  function FarmCard({ farm, onEnterSim }: { farm: any; onEnterSim: (id: string) => void }) {
    // Resolve a preview image for the farm (first corner photo if present)
    const photoId = (farm?.cornerPhotos?.[0] as any) ?? null;
    const photoUrl = useQuery(
      api.soil_upload.getFileUrl,
      photoId ? ({ fileId: photoId as any } as any) : "skip"
    ) as string | null;

    // Local hooks used by card actions
    const { _id: farmId, name, modelStatus, modelPreviewUrl } = farm;
    const getUploadUrl = useMutation(api.soil_upload.getUploadUrl);
    const setCornerPhotos = useMutation(api.farms.setCornerPhotos);
    const generate3D = useAction((api as any).meshy.generateFromFarmPhoto as any);
    const checkStatus = useAction((api as any).meshy.checkStatus as any);

    // Add: pull latest sim to show "Last Simulation"
    const sim = useQuery(api.sims.get, { farmId: farmId as any } as any) as any;
    const lastSim = sim
      ? (() => {
          const ms = Date.now() - ((sim as any)?._creationTime as number);
          const days = Math.floor(ms / 86400000);
          return days <= 0 ? "Today" : `${days} day${days > 1 ? "s" : ""} ago`;
        })()
      : null;

    // Upload handler
    const handleUpload = async () => {
      try {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
          const files = (input.files as FileList | null) ?? null;
          if (!files || files.length === 0) return;
          const ids: Array<string> = [];
          const f = files[0];
          const url = await getUploadUrl({});
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": f.type || "application/octet-stream" },
            body: f,
          });
          const { storageId } = (await res.json()) as { storageId: string };
          ids.push(storageId);
          await setCornerPhotos({ id: farmId as any, photoIds: ids as any });
          toast.success("Photo uploaded. Click 'Generate 3D Model' to continue.");
        };
        input.click();
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to upload photo");
      }
    };

    // Generate + status handlers
    const handleGenerate = async () => {
      try {
        toast.info("Starting 3D generation...");
        const res = await generate3D({ id: farmId as any });
        if ((res as any)?.pending) {
          toast.success("Model is being processed. This may take a couple of minutes.");
        } else {
          toast.success("3D model ready!");
        }
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to generate 3D model");
      }
    };

    const handleCheckStatus = async () => {
      try {
        const res = await checkStatus({ id: farmId as any });
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
    };

    return (
      <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-md overflow-hidden flex flex-col">
        <div className="h-44 w-full overflow-hidden rounded-t-2xl">
          <img
            src={photoUrl || "/assets/Fild.jpeg"}
            alt={name}
            className="h-full w-full object-cover"
            onError={(e) => {
              const t = e.currentTarget as HTMLImageElement;
              if (t.src !== "/assets/Fild.jpeg") t.src = "/assets/Fild.jpeg";
              t.onerror = null;
            }}
          />
        </div>

        <div className="p-4 flex flex-col gap-3">
          <div>
            <div className="text-base font-semibold">{name}</div>
            <div className="text-xs text-muted-foreground">
              Last Simulation: {lastSim ?? "—"}
            </div>
          </div>

          <div className="grid gap-2">
            <Button variant="outline" onClick={handleUpload} className="justify-center">
              Upload Photo
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleGenerate} className="flex-1">
                Generate 3D Model (AI)
              </Button>
              {modelStatus === "processing" && (
                <Button variant="outline" onClick={handleCheckStatus}>
                  Check
                </Button>
              )}
              {modelStatus === "ready" && modelPreviewUrl && (
                <Button
                  variant="outline"
                  onClick={() => {
                    try {
                      window.open(modelPreviewUrl as string, "_blank");
                    } catch {
                      /* noop */
                    }
                  }}
                >
                  Preview
                </Button>
              )}
            </div>
            <Button onClick={() => onEnterSim(farmId as any)} className="justify-center">
              Enter Simulation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell title="My Farm">
      <div className="p-4 space-y-4">
        {/* New page header + CTA */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold">My Farms</h2>
          <Button
            variant="secondary"
            onClick={() => {
              const el = document.querySelector("#add-farm-form");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            + Add New Farm
          </Button>
        </div>

        {/* New grid displaying farms in card style */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(farms ?? []).map((f: any) => (
            <FarmCard key={(f as any)._id} farm={f} onEnterSim={(id) => openSim(id)} />
          ))}
        </div>

        <Card id="add-farm-form">
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

                {/* Embedded 3D mini-viewer with animation overlay */}
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
                  {/* Animation overlay */}
                  {showAnimation && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      {showAnimation === "sowing" && (
                        <div className="text-2xl animate-bounce">🌱 Sowing Seeds...</div>
                      )}
                      {showAnimation === "irrigating" && (
                        <div className="text-2xl animate-pulse">💧 Irrigating Field...</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Seeds Section */}
                <div className="rounded-md border p-3 space-y-3">
                  <div className="text-sm font-medium">Seeds & Planting</div>
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                    <div className="w-full sm:w-48">
                      <div className="text-xs text-muted-foreground mb-1">Seed Type</div>
                      <Select value={selectedSeed} onValueChange={setSelectedSeed}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wheat">Winter Wheat</SelectItem>
                          <SelectItem value="rice">Basmati Rice</SelectItem>
                          <SelectItem value="maize">Sweet Corn</SelectItem>
                          <SelectItem value="soybean">Soybean</SelectItem>
                          <SelectItem value="canola">Canola</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleSowSeed} disabled={!sim}>
                      Sow Seeds (₹200)
                    </Button>
                  </div>
                </div>

                {/* Irrigation Techniques Section */}
                <div className="rounded-md border p-3 space-y-3">
                  <div className="text-sm font-medium">Irrigation System</div>
                  <div className="grid gap-2 sm:grid-cols-3 items-end">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Method</div>
                      <Select value={irrigationMethod} onValueChange={setIrrigationMethod}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="drip">Drip (90% efficient)</SelectItem>
                          <SelectItem value="sprinkler">Sprinkler (75% efficient)</SelectItem>
                          <SelectItem value="flood">Flood (55% efficient)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Amount (mm)</div>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={irrigationAmount}
                        onChange={(e) => setIrrigationAmount(e.target.value)}
                        placeholder="10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleSetIrrigation} disabled={!sim}>
                        Set Method
                      </Button>
                      <Button onClick={handleIrrigate} disabled={!sim}>
                        Irrigate (₹{Math.ceil(parseFloat(irrigationAmount || "0") * 2)})
                      </Button>
                    </div>
                  </div>
                  {sim?.lastIrrigation && (
                    <div className="text-xs text-muted-foreground">
                      Last: {sim.lastIrrigation.effectiveMm}mm via {sim.lastIrrigation.method} 
                      ({new Date(sim.lastIrrigation.at).toLocaleString()})
                    </div>
                  )}
                </div>

                {/* Irrigation Advisor (Real Weather) */}
                <div className="rounded-md border p-3 space-y-3">
                  <div className="text-sm font-medium">Irrigation Advisor (Real Weather)</div>
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                    <div className="w-full sm:w-48">
                      <div className="text-xs text-muted-foreground mb-1">Crop</div>
                      <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                        <SelectTrigger><SelectValue placeholder="Select crop" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wheat">Wheat</SelectItem>
                          <SelectItem value="rice">Rice</SelectItem>
                          <SelectItem value="maize">Maize</SelectItem>
                          <SelectItem value="corn">Corn</SelectItem>
                          <SelectItem value="soybean">Soybean</SelectItem>
                          <SelectItem value="cotton">Cotton</SelectItem>
                          <SelectItem value="canola">Canola</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={saveMyLocation} disabled={!activeFarm || advisorLoading}>
                        Use My Location
                      </Button>
                      <Button onClick={runAdvisor} disabled={advisorLoading}>
                        {advisorLoading ? "Fetching..." : "Get Recommendation"}
                      </Button>
                    </div>
                  </div>
                  {activeFarm?.location ? (
                    <div className="text-xs text-muted-foreground">
                      Using location: {activeFarm.location.lat.toFixed(3)}, {activeFarm.location.lng.toFixed(3)}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Location not saved yet. Use "Use My Location" to save precise GPS.
                    </div>
                  )}
                  {advisor && (
                    <div className="grid gap-2 sm:grid-cols-3">
                      {advisor.days?.map((d: any, i: number) => (
                        <div key={i} className="rounded-md border p-2">
                          <div className="text-xs text-muted-foreground">{new Date(d.date).toLocaleDateString()}</div>
                          <div className="text-sm">Water need: {Math.round(d.water_mm)} mm</div>
                          {"liters" in d && d.liters != null ? (
                            <div className="text-sm">≈ {Math.round(d.liters).toLocaleString()} L</div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Enhanced Stats with Growth & Health */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground mb-1">Growth Progress</div>
                    {sim?.growth !== undefined ? (
                      <div className="space-y-2">
                        <Progress value={sim.growth} className="h-2" />
                        <div className="text-sm font-semibold">{Math.round(sim.growth)}%</div>
                      </div>
                    ) : (
                      <div className="text-lg font-semibold">—</div>
                    )}
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground mb-1">Plant Health</div>
                    <div className={`text-lg font-semibold ${
                      sim?.health >= 80 ? 'text-green-600' : 
                      sim?.health >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {sim?.health ? `${Math.round(sim.health)}%` : "—"}
                    </div>
                  </div>
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
                  {sim?.seed && (
                    <div className="rounded-md border p-3 sm:col-span-2 lg:col-span-3">
                      <div className="text-xs text-muted-foreground mb-1">Current Crop</div>
                      <div className="text-lg font-semibold">{sim.seed.name}</div>
                    </div>
                  )}
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