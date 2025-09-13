import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import { useState } from "react";

type Analysis = {
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  moisture: number;
  organicMatter: number;
  recommendations: string[];
};

export default function SoilTest() {
  const analyzeMock = useAction(api.soil.analyzeMock);
  const getUploadUrl = useMutation(api.soil_upload.getUploadUrl);
  const analyzeImage = useAction(api.soil.analyzeImage);

  const [result, setResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const runCameraAnalysis = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const uploadUrl = await getUploadUrl({});
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      const json = (await res.json()) as { storageId: string };
      const analysis = await analyzeImage({ imageId: json.storageId as any });
      setResult(analysis as any);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const run = async () => {
    setLoading(true);
    try {
      const res = await analyzeMock({});
      setResult(res as any);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Soil Test">
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader><CardTitle>Camera Analysis (AI)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onSelectFile}
            />
            {preview && (
              <img
                src={preview}
                alt="Soil preview"
                className="w-full rounded-md border"
              />
            )}
            <div className="flex gap-2">
              <Button onClick={runCameraAnalysis} disabled={loading || !file}>
                {loading ? "Analyzing..." : "Analyze Photo"}
              </Button>
              <Button variant="outline" onClick={() => { setFile(null); setPreview(null); setResult(null); }}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Mock Analysis</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={run} disabled={loading}>{loading ? "Analyzing..." : "Run Analysis"}</Button>
            {result && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">pH:</span> {result.ph}</div>
                <div><span className="text-muted-foreground">Moisture:</span> {result.moisture}%</div>
                <div><span className="text-muted-foreground">Nitrogen:</span> {result.nitrogen} mg/kg</div>
                <div><span className="text-muted-foreground">Phosphorus:</span> {result.phosphorus} mg/kg</div>
                <div><span className="text-muted-foreground">Potassium:</span> {result.potassium} mg/kg</div>
                <div><span className="text-muted-foreground">Organic Matter:</span> {result.organicMatter}%</div>
                <div className="col-span-2">
                  <div className="text-muted-foreground">Recommendations:</div>
                  <ul className="list-disc pl-5">
                    {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}