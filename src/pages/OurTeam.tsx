import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";

type Member = {
  name: string;
  role: string;
  img: string;
  bio: string;
};

const members: Array<Member> = [
  {
    name: "Lokesh",
    role: "FullStack",
    img: "https://harmless-tapir-303.convex.cloud/api/storage/6e63d252-0e0f-4f17-8ed8-aa0aa8f3754e",
    bio: "Full‑stack contributor building reliable, farmer‑first features.",
  },
  {
    name: "Venkat Sai",
    role: "Debugger",
    img: "https://harmless-tapir-303.convex.cloud/api/storage/04a4d9bb-1782-485d-83c7-c00498b8e2a2",
    bio: "Debugging specialist focused on stability and performance.",
  },
  {
    name: "Aarush",
    role: "BackEnd",
    img: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=800&auto=format&fit=crop",
    bio: "Back‑end engineer crafting scalable APIs and data pipelines.",
  },
  {
    name: "Ananya",
    role: "FrontEnd",
    img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop",
    bio: "Frontend engineer designing clear, fast, multilingual UI.",
  },
  {
    name: "Rishi",
    role: "Researcher",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
    bio: "Research lead exploring practical AI for soil and crop insights.",
  },
  {
    name: "Almas",
    role: "Team Lead",
    img: "/assets/Logo_.png",
    bio: "Team lead aligning vision, execution, and farmer value.",
  },
];

export default function OurTeam() {
  return (
    <AppShell>
      <div className="pb-24">
        {/* Hero banner aligned to site theme */}
        <div className="relative">
          <div className="h-56 sm:h-72 w-full overflow-hidden rounded-b-3xl">
            {/* Replace background crest with brand logo and make it super big */}
            <img
              src="/assets/Logo_.png"
              alt="FarmHes"
              className="w-full h-full object-contain bg-card/60 scale-150"
              loading="eager"
              onError={(e) => {
                const t = e.currentTarget as HTMLImageElement;
                if (t.src !== "/logo.svg") t.src = "/logo.svg";
                t.onerror = null;
              }}
            />
          </div>
          <div className="absolute inset-x-0 top-0 h-56 sm:h-72 bg-gradient-to-b from-black/25 to-transparent rounded-b-3xl" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between">
              <div className="text-white drop-shadow">
                <div className="text-4xl font-extrabold tracking-tight">FarmHes</div>
                <div className="text-xs opacity-90">Our Team</div>
              </div>
            </div>
          </div>
        </div>

        {/* Team grid */}
        <div className="px-4">
          <div className="mt-6 mb-2 text-xs font-semibold tracking-[0.25em] text-muted-foreground">
            MEET THE TEAM
          </div>
          <h2 className="text-2xl font-extrabold">FarmHes</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Builders and growers working on practical, voice‑first AI for agriculture —
            matching Root AI's clean, minimal aesthetic.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {members.map((m) => (
              <Card key={m.name} className="rounded-2xl border bg-card/80 backdrop-blur">
                <CardContent className="p-4">
                  <div className="mb-3 aspect-[4/3] w-full overflow-hidden rounded-2xl">
                    <img
                      src={m.img}
                      alt={m.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement;
                        if (t.src !== "/logo_bg.png") t.src = "/logo_bg.png";
                        t.onerror = null;
                      }}
                    />
                  </div>
                  <div className="text-xs font-semibold tracking-[0.2em]">
                    {m.role.toUpperCase()}
                  </div>
                  <div className="mt-1 text-lg font-bold">{m.name}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{m.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-8 text-center text-xs text-muted-foreground">
            Aligned with our values: privacy, clarity, and farmer‑first usefulness.
          </div>
        </div>
      </div>
    </AppShell>
  );
}