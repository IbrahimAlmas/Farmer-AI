import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OurTeam() {
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
            <CardTitle>Our Team</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              We are a small, focused group of builders and growers working on practical AI for agriculture.
            </p>
            <p>
              Our backgrounds span agronomy, software engineering, and product design — unified by a farmer‑first mindset.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
