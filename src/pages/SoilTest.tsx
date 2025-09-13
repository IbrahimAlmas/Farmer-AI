import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
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
  const [result, setResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);

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
