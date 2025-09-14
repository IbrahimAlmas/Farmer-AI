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
    name: "Aarav Verma",
    role: "Agronomy Lead",
    img: "https://images.unsplash.com/photo-1519751138087-5a3c9c3c7683?q=80&w=800&auto=format&fit=crop",
    bio: "Field trials, crop advisories, and on‑ground validation with smallholder farmers.",
  },
  {
    name: "Neha Singh",
    role: "Product & UX",
    img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop",
    bio: "Designs simple, local‑language experiences focused on clarity and trust.",
  },
  {
    name: "Rohit Sharma",
    role: "ML & Sims",
    img: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=800&auto=format&fit=crop",
    bio: "Soil/photo inference and lightweight on‑device models for guidance.",
  },
  {
    name: "Priya Iyer",
    role: "Full‑Stack Engineer",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
    bio: "Delivers fast, reliable app flows — offline friendly and secure.",
  },
  {
    name: "Abdul Rahman",
    role: "Data & Platforms",
    img: "https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=800&auto=format&fit=crop",
    bio: "Pipelines, market data, and integrations tuned for rural networks.",
  },
  {
    name: "Kavya Rao",
    role: "Community & Ops",
    img: "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=800&auto=format&fit=crop",
    bio: "Farmer onboarding, feedback loops, and language coverage expansion.",
  },
];

export default function OurTeam() {
  return (
    <AppShell>
      <div className="pb-24">
        {/* Hero banner aligned to site theme */}
        <div className="relative">
          <div className="h-40 sm:h-52 w-full overflow-hidden rounded-b-3xl">
            <img
              src="/logo_bg.svg"
              alt="FarmHes"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
          <div className="absolute inset-x-0 top-0 h-40 sm:h-52 bg-gradient-to-b from-black/25 to-transparent rounded-b-3xl" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between">
              <div className="text-white drop-shadow">
                <div className="text-xl font-bold tracking-tight">FarmHes</div>
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
          <h2 className="text-2xl font-extrabold">FarmHes — Team of 6</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Builders and growers working on practical, voice‑first AI for agriculture —
            matching Root AI’s clean, minimal aesthetic.
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
