import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OurMission() {
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
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Make farm decisions simpler, faster, and more accessible in local languages with voice‑first AI.
            </p>
            <p>
              We focus on clarity, privacy, and real‑world usefulness for everyday farm operations.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
