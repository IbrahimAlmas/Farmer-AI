import { AppShell } from "@/components/AppShell";

export default function OurMission() {
  return (
    <AppShell>
      {/* Hero: dark, bold serif statement (Template 1) */}
      <section className="relative overflow-hidden rounded-b-3xl bg-black text-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
          <div className="uppercase tracking-widest text-sm font-semibold text-[oklch(0.752_0.146_86.4)]">
            Our Purpose
          </div>
          <h1 className="mt-4 font-serif text-3xl sm:text-4xl md:text-5xl leading-tight [word-spacing:0.1em]">
            Tell the client what the team is all about—who you are at your core, and what you aim to achieve.
          </h1>
        </div>
      </section>

      {/* Mission card: tan panel with left perforations (Template 2) */}
      <section className="p-4">
        <div className="relative mx-auto max-w-4xl">
          {/* Perforation notches (left side) */}
          <div className="absolute -left-4 top-6 h-8 w-8 rounded-lg bg-background" />
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-background" />
          <div className="absolute -left-4 bottom-6 h-8 w-8 rounded-lg bg-background" />

          <div
            className="relative rounded-3xl p-8 sm:p-12 shadow-sm"
            style={{ background: "oklch(0.68 0.09 70)" }}
          >
            <div className="text-center">
              <div className="font-serif uppercase tracking-[0.3em] text-sm text-foreground/80">
                Our Mission
              </div>
              <p className="mt-4 text-base sm:text-xl text-foreground/90">
                Tell the client what the team is all about—who you are at your core, and what you aim to achieve.
              </p>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
