import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FuturePlan() {
  return (
    <AppShell>
      <div className="p-4 space-y-4">
        <div className="rounded-3xl overflow-hidden">
          <img
            src="/logo_bg.svg"
            alt="Root AI"
            className="w-full h-40 sm:h-52 object-cover"
            loading="eager"
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Future Plan</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Next up: richer soil analysis, crop‑wise playbooks, and deeper market insights — all offline‑friendly.
            </p>
            <p>
              We’ll continue to expand languages and improve accuracy with farmer feedback.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
