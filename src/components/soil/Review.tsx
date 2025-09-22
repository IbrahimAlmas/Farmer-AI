import type React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Image as ImageIcon, RefreshCw, Upload, Wand2 } from "lucide-react";

export function SoilReview({
  preview,
  loading,
  file,
  runCameraAnalysis,
  onRetake,
  fileInputRef,
  errorMsg,
}: {
  preview: string | null;
  loading: boolean;
  file: File | null;
  runCameraAnalysis: () => Promise<void>;
  onRetake: () => void;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  errorMsg: string | null;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4" />
            Review Photo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative group rounded-xl border overflow-hidden bg-background">
            {preview ? (
              <>
                <img src={preview} alt="Soil preview" className="w-full object-cover max-h-[520px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 justify-center">
                  <Button onClick={runCameraAnalysis} disabled={loading || !file} className="gap-2">
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Analyze Photo
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
              </>
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-sm text-muted-foreground">No image selected</div>
              </div>
            )}
          </div>
          {errorMsg && (
            <Alert variant="destructive" className="rounded-lg">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}