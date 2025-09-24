import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera as CameraIcon, Upload, Wand2, CheckCircle2 } from "lucide-react";

export function SoilIntro({ onStart }: { onStart: () => void }) {
  return (
    <div className="">
      <div className="text-center max-w-4xl mx-auto mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
          Revolutionize Your Farming with AI‑Powered Soil Analysis
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[oklch(0.4_0.03_120)]">
          Get instant, accurate soil health insights from a single photo. No expensive lab tests, no waiting. Just smarter farming decisions.
        </p>
      </div>

      <div className="grid items-stretch gap-4 lg:gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg sm:text-xl font-semibold">Ready to Grow Smarter?</CardTitle>
            <p className="text-sm text-muted-foreground">
              Join thousands of farmers who are boosting yields and sustainability. Start your first soil analysis now.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="rounded-xl border p-4 bg-muted/30 text-center">
                <div className="mx-auto mb-2 grid place-items-center size-10 rounded-full bg-emerald-100 text-emerald-700">
                  <CameraIcon className="h-5 w-5" />
                </div>
                <div className="font-medium text-sm">1. Snap a Photo</div>
                <div className="text-xs text-[oklch(0.4_0.03_120)]">Take a clear picture of your soil.</div>
              </div>
              <div className="rounded-xl border p-4 bg-muted/30 text-center">
                <div className="mx-auto mb-2 grid place-items-center size-10 rounded-full bg-emerald-100 text-emerald-700">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="font-medium text-sm">2. Upload & Analyze</div>
                <div className="text-xs text-[oklch(0.4_0.03_120)]">Our AI will analyze it in seconds.</div>
              </div>
              <div className="rounded-xl border p-4 bg-muted/30 text-center">
                <div className="mx-auto mb-2 grid place-items-center size-10 rounded-full bg-emerald-100 text-emerald-700">
                  <Wand2 className="h-5 w-5" />
                </div>
                <div className="font-medium text-sm">3. Get Insights</div>
                <div className="text-xs text-[oklch(0.4_0.03_120)]">Receive a detailed report.</div>
              </div>
            </div>

            <div className="flex justify-start">
              <Button
                className="gap-2 px-6 py-6 text-base sm:text-lg rounded-full w-full sm:w-auto min-w-[220px] bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                onClick={onStart}
              >
                <Upload className="h-5 w-5" />
                Start Soil Test
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg sm:text-xl">Sample Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border overflow-hidden bg-muted">
              <img
                src="/assets/Soil.webp"
                alt="Soil sample"
                className="w-full h-44 sm:h-56 object-cover"
                onError={(e) => {
                  const t = e.currentTarget as HTMLImageElement;
                  if (t.src !== "/logo_bg.png") t.src = "/logo_bg.png";
                  t.onerror = null;
                }}
              />
            </div>
            <div className="text-[11px] text-[oklch(0.45_0.03_120)]">
              *Estimates from photo analysis. Confirm with lab tests if needed.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="overflow-hidden bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg text-emerald-700">Why Test Soil?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <div>
                  <div className="font-semibold text-emerald-700">Boost Yields</div>
                  <div className="text-[oklch(0.4_0.03_120)]">Optimize conditions for maximum crop production.</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <div>
                  <div className="font-semibold text-emerald-700">Save Money</div>
                  <div className="text-[oklch(0.4_0.03_120)]">Apply only the necessary nutrients and fertilizers.</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <div>
                  <div className="font-semibold text-emerald-700">Enhance Sustainability</div>
                  <div className="text-[oklch(0.4_0.03_120)]">Prevent nutrient runoff and improve water retention.</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <div>
                  <div className="font-semibold text-emerald-700">Detect Problems Early</div>
                  <div className="text-[oklch(0.4_0.03_120)]">Identify pH imbalances and other issues.</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}