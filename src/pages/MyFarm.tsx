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
  // Router navigation hook for buttons
  const navigate = useNavigate();
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
            {/* Simplify actions to replicate provided design exactly */}
            <Button variant="outline" onClick={handleGenerate} className="w-full">
              Generate 3D Model (AI)
            </Button>
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
            onClick={() => navigate("/farms/new")}
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

        {/* Hide Add Farm form to keep only header + farm cards per requested design */}
        <Card id="add-farm-form" className="hidden" />

        {/* Hide Simulation Window to keep page minimal per requested card-only design */}
        {false && simFarmId && (<div />)}
      </div>
    </AppShell>
  );
}