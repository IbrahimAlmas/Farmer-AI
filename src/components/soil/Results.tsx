import type React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Image as ImageIcon, RefreshCw, Upload, Wand2 } from "lucide-react";
import type { Analysis } from "@/types/soil";

export function SoilResults({
  preview,
  loading,
  file,
  result,
  errorMsg,
  runCameraAnalysis,
  onRetake,
  fileInputRef,
}: {
  preview: string | null;
  loading: boolean;
  file: File | null;
  result: Analysis | null;
  errorMsg: string | null;
  runCameraAnalysis: () => Promise<void>;
  onRetake: () => void;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <ImageIcon className="h-4 w-4" />
              Photo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative rounded-xl border overflow-hidden bg-background">
              {preview && <img src={preview} alt="Soil preview" className="w-full object-cover max-h-[480px]" />}
              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 justify-center">
                <Button onClick={runCameraAnalysis} disabled={loading || !file} className="gap-2">
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Re-Analyzing…
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Analyze Again
                    </>
                  )}
                </Button>
                <Button variant="secondary" onClick={onRetake}>
                  Retake
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  Add More
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="overflow-hidden border-emerald-200 bg-emerald-50/70 dark:bg-emerald-900/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-emerald-900 dark:text-emerald-100">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMsg && (
              <Alert variant="destructive" className="rounded-lg">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            {!result && <div className="text-sm text-muted-foreground">No results available. Analyze the photo to see results here.</div>}

            {result && (
              <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-emerald-200 p-4 bg-emerald-50/60 dark:bg-emerald-900/20">
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 mb-1 font-medium">pH</div>
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl font-semibold text-emerald-900 dark:text-emerald-100">{result.ph}</div>
                      <Badge variant="outline" className="border-emerald-400 text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-800">
                        Ideal: 6.0–7.5
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <Progress value={((result.ph - 4) / (9 - 4)) * 100} className="h-3 bg-emerald-100 [&>div]:bg-emerald-500" />
                    </div>
                  </div>

                  <div className="rounded-lg border border-emerald-200 p-4 bg-emerald-50/60 dark:bg-emerald-900/20">
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 mb-1 font-medium">Moisture</div>
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl font-semibold text-emerald-900 dark:text-emerald-100">{result.moisture}%</div>
                      <Badge variant="outline" className="border-emerald-400 text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-800">
                        Target: 20–40%
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <Progress value={Math.min(100, Math.max(0, result.moisture))} className="h-3 bg-emerald-100 [&>div]:bg-emerald-500" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-emerald-200 p-4 bg-white dark:bg-emerald-900/10">
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 mb-1 font-medium">Nitrogen</div>
                    <div className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">{result.nitrogen} mg/kg</div>
                  </div>
                  <div className="rounded-lg border border-emerald-200 p-4 bg-white dark:bg-emerald-900/10">
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 mb-1 font-medium">Phosphorus</div>
                    <div className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">{result.phosphorus} mg/kg</div>
                  </div>
                  <div className="rounded-lg border border-emerald-200 p-4 bg-white dark:bg-emerald-900/10">
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 mb-1 font-medium">Potassium</div>
                    <div className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">{result.potassium} mg/kg</div>
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-200 p-4 bg-emerald-50/60 dark:bg-emerald-900/20">
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 mb-2 font-medium">Organic Matter</div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-semibold text-emerald-900 dark:text-emerald-100">{result.organicMatter}%</div>
                    <Badge variant="outline" className="border-emerald-400 text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-800">
                      Healthy: 3–6%
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <Progress value={Math.min(100, (result.organicMatter / 6) * 100)} className="h-3 bg-emerald-100 [&>div]:bg-emerald-500" />
                  </div>
                </div>

                <div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 mb-2 font-medium">Recommendations</div>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-emerald-800 dark:text-emerald-200">
                    {result.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}