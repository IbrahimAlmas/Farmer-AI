import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type StepKey = "basic" | "location" | "details";
const steps: Array<{ key: StepKey; label: string }> = [
  { key: "basic", label: "Basic Info" },
  { key: "location", label: "Location & Size" },
  { key: "details", label: "Details" },
];

export default function FarmNew() {
  const navigate = useNavigate();
  const create = useMutation(api.farms.create);

  // Form state
  const [step, setStep] = useState<StepKey>("basic");
  const [name, setName] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [previousCrops, setPreviousCrops] = useState<string>("");

  const canNext = useMemo(() => {
    if (step === "basic") return name.trim().length > 0;
    if (step === "location") return true; // optional fields
    return true;
  }, [step, name]);

  const goNext = () => {
    if (!canNext) return;
    if (step === "basic") setStep("location");
    else if (step === "location") setStep("details");
  };

  const goPrev = () => {
    if (step === "details") setStep("location");
    else if (step === "location") setStep("basic");
  };

  const submit = async () => {
    try {
      const numericSize = size.trim() ? Number(size) : undefined;
      if (numericSize !== undefined && (isNaN(numericSize) || numericSize <= 0)) {
        toast.error("Please enter a valid size (> 0)");
        return;
      }

      const loc =
        lat.trim() && lng.trim()
          ? { lat: Number(lat), lng: Number(lng) }
          : undefined;

      const prev = previousCrops
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await create({
        name,
        crops: [],
        location: loc as any,
        size: numericSize as any,
        previousCrops: prev as any,
      });

      toast.success("Farm created");
      navigate("/my-farm");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create farm");
    }
  };

  return (
    <AppShell title="Add New Farm">
      <div className="mx-auto w-full max-w-5xl p-4 md:p-6 space-y-6">
        {/* Page Title */}
        <h1 className="text-2xl md:text-3xl font-bold">Add New Farm</h1>

        {/* Stepper */}
        <div className="flex items-center gap-6">
          {steps.map((s, i) => {
            const active = step === s.key;
            const passed =
              steps.findIndex((x) => x.key === step) > i;
            return (
              <div key={s.key} className="flex items-center gap-3">
                <div
                  className={[
                    "size-8 grid place-items-center rounded-full border ring-1",
                    active
                      ? "bg-yellow-400 text-black ring-yellow-500/40 border-yellow-300"
                      : passed
                      ? "bg-black/5 text-black/70 ring-black/10 border-black/10"
                      : "bg-black/5 text-black/40 ring-black/10 border-black/10",
                  ].join(" ")}
                >
                  {i + 1}
                </div>
                <div className="text-sm font-medium">
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Card */}
        <Card className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="p-4 md:p-6">
            {/* Hero image */}
            <div className="rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5">
              <img
                src="/assets/Fild.jpeg"
                alt="Farm preview"
                className="w-full h-[280px] md:h-[420px] object-cover"
                onError={(e) => {
                  const t = e.currentTarget as HTMLImageElement;
                  if (t.src !== "/logo_bg.png") t.src = "/logo_bg.png";
                  t.onerror = null;
                }}
              />
            </div>

            {/* Section title */}
            <div className="mt-6 mb-2 font-bold text-lg">Basic Information</div>

            {/* Step content */}
            {step === "basic" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm mb-1">Farm Name</div>
                  <Input
                    placeholder="Enter farm name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-[oklch(0.98_0.01_120)]"
                  />
                </div>
                <div>
                  <div className="text-sm mb-1">Farm ID</div>
                  <Input
                    value="Auto-generated"
                    disabled
                    className="bg-[oklch(0.98_0.01_120)]"
                  />
                </div>
              </div>
            )}

            {step === "location" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm mb-1">Latitude</div>
                  <Input
                    placeholder="e.g., 37.7749"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="bg-[oklch(0.98_0.01_120)]"
                  />
                </div>
                <div>
                  <div className="text-sm mb-1">Longitude</div>
                  <Input
                    placeholder="e.g., -122.4194"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="bg-[oklch(0.98_0.01_120)]"
                  />
                </div>
                <div>
                  <div className="text-sm mb-1">Size (acres)</div>
                  <Input
                    placeholder="e.g., 2.5"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="bg-[oklch(0.98_0.01_120)]"
                  />
                </div>
              </div>
            )}

            {step === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm mb-1">Previous Crops</div>
                  <Input
                    placeholder="Comma separated (e.g., wheat, rice)"
                    value={previousCrops}
                    onChange={(e) => setPreviousCrops(e.target.value)}
                    className="bg-[oklch(0.98_0.01_120)]"
                  />
                </div>
                <div>
                  <div className="text-sm mb-1">Notes</div>
                  <Input
                    placeholder="Optional notes"
                    className="bg-[oklch(0.98_0.01_120)]"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center gap-3">
              {step !== "basic" && (
                <Button
                  variant="outline"
                  onClick={goPrev}
                  className="rounded-xl"
                >
                  Back
                </Button>
              )}
              {step !== "details" ? (
                <Button
                  onClick={goNext}
                  disabled={!canNext}
                  className="rounded-xl bg-yellow-400 hover:bg-yellow-400/90 text-black w-full md:w-56"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={submit}
                  className="rounded-xl bg-yellow-400 hover:bg-yellow-400/90 text-black w-full md:w-56"
                >
                  Create Farm
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
