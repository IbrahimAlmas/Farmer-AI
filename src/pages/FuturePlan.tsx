import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FuturePlan() {
  return (
    <AppShell>
      {/* OUR PROCESS - pill steps + details */}
      <div className="p-4 space-y-6">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Our Process</h1>

        {/* Colored pill steps bar */}
        <div className="rounded-3xl overflow-hidden border bg-card/70">
          <div className="grid grid-cols-4 text-[11px] sm:text-sm font-semibold">
            <div className="flex items-center gap-2 px-4 py-3 text-white bg-[oklch(0.75_0.18_65)]">
              <span className="opacity-90">01</span>
              <span className="uppercase tracking-widest">Phase of Process</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 text-white bg-[oklch(0.62_0.18_265)]">
              <span className="opacity-90">02</span>
              <span className="uppercase tracking-widest">Phase of Process</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 text-white bg-[oklch(0.62_0.22_345)]">
              <span className="opacity-90">03</span>
              <span className="uppercase tracking-widest">Phase of Process</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 text-white bg-[oklch(0.65_0.15_180)]">
              <span className="opacity-90">04</span>
              <span className="uppercase tracking-widest">Phase of Process</span>
            </div>
          </div>
        </div>

        {/* Step descriptions */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-sm text-muted-foreground">
          <div>
            <p>
              Break down the phases of your process for your client, so they grok how you do your work.
            </p>
          </div>
          <div>
            <p>
              Provide details for each step, like what's involved, how long it takes, and any other critical bits.
            </p>
          </div>
          <div>
            <p>
              You can change the width of each step above, and the rest will adjust automatically.
            </p>
          </div>
          <div>
            <p>
              You can use multiple copies of this section if you have more steps.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}