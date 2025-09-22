import { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Camera as CameraIcon, Play, RefreshCw, Upload } from "lucide-react";

export function SoilCapture({
  cameraOn,
  cameraReady,
  cameraError,
  loading,
  videoRef,
  canvasRef,
  startCamera,
  stopCamera,
  capturePhoto,
  fileInputRef,
}: {
  cameraOn: boolean;
  cameraReady: boolean;
  cameraError: string | null;
  loading: boolean;
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => Promise<void>;
  fileInputRef: RefObject<HTMLInputElement>;
}) {
  return (
    <div className="">
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-[1fr_380px]">
        <div className="">
          <Card className="overflow-hidden backdrop-blur supports-[backdrop-filter]:bg-card/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl sm:text-2xl font-semibold">Soil Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cameraOn ? (
                <div className="relative rounded-xl border overflow-hidden bg-muted">
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                  <div className="aspect-[4/3] w-full">
                    <video ref={videoRef} className="h-full w-full object-cover" playsInline muted autoPlay />
                  </div>

                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-[55%] w-[70%] max-w-[520px] rounded-2xl border border-white/30 shadow-[0_0_0_9999px_rgba(0,0,0,0.08)]" />
                  </div>
                  <div className="pointer-events-none absolute top-3 left-3 text-[11px] font-medium px-2 py-0.5 rounded-full bg-black/40 text-white">
                    Aim at bare soil, avoid leaves/tools
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center">
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={capturePhoto} disabled={!cameraReady || loading} className="gap-2">
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Processing…
                          </>
                        ) : (
                          <>
                            <CameraIcon className="h-4 w-4" />
                            Click Photo
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={stopCamera} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Stop
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-xl border overflow-hidden bg-muted">
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/5 via-transparent to-transparent" />
                  <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <img
                      src="https://images.unsplash.com/photo-1525824236856-8b420b9bb75b?q=80&w=1600&auto=format&fit=crop"
                      alt="Soil guide"
                      className="w-full max-w-2xl h-44 object-cover rounded-lg border"
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement;
                        if (t.src !== "/logo_bg.png") t.src = "/logo_bg.png";
                        t.onerror = null;
                      }}
                    />
                    <div className="grid gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Badge variant="outline">Tip</Badge>
                        Use natural light • Focus on bare soil • Keep phone steady
                      </div>
                      <div>Or upload a clear close-up if your camera isn't available.</div>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <Button
                        variant="default"
                        onClick={startCamera}
                        className="gap-2 px-6 py-6 text-base sm:text-lg rounded-xl w-full sm:w-auto min-w-[200px] bg-amber-600 hover:bg-amber-500 text-white shadow-md"
                      >
                        <Play className="h-5 w-5" />
                        Enable Camera
                      </Button>
                      <Button
                        variant="default"
                        className="gap-2 px-6 py-6 text-base sm:text-lg rounded-xl w-full sm:w-auto min-w-[200px] bg-amber-600 hover:bg-amber-500 text-white shadow-md"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-5 w-5" />
                        Upload Photo
                      </Button>
                    </div>

                    <details className="w-full max-w-xl mx-auto text-left mt-1">
                      <summary className="text-xs text-muted-foreground cursor-pointer">Having trouble enabling camera?</summary>
                      <div className="text-xs text-muted-foreground mt-2 space-y-1">
                        <p>1) Allow camera permission in your browser settings.</p>
                        <p>2) Switch to a browser like Chrome, Safari, or Edge.</p>
                        <p>3) If still blocked, use Upload Photo.</p>
                      </div>
                    </details>
                  </div>
                </div>
              )}

              {cameraError && !cameraReady && (
                <div className="text-xs text-red-600 text-center">{cameraError} — You can still upload a photo.</div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="overflow-hidden backdrop-blur supports-[backdrop-filter]:bg-card/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pro tips</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li>Frame only the soil surface</li>
                <li>Avoid shadows; use daylight</li>
                <li>Hold steady for sharp focus</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="overflow-hidden backdrop-blur supports-[backdrop-filter]:bg-card/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sample result preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border p-3 bg-muted/30">
                <div className="text-[11px] text-muted-foreground mb-1">pH</div>
                <Progress value={68} className="h-3" />
              </div>
              <div className="rounded-lg border p-3 bg-muted/30">
                <div className="text-[11px] text-muted-foreground mb-1">Moisture</div>
                <Progress value={35} className="h-3" />
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-[11px] text-muted-foreground mb-1">Organic Matter</div>
                <Progress value={50} className="h-3" />
              </div>
              <div className="text-[11px] text-muted-foreground">Upload a photo of soil to get your actual analysis.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
