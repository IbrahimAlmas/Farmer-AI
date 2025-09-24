import { Button } from "@/components/ui/button";
import { Mic, Sprout, CheckCircle, FlaskConical } from "lucide-react";
import { useNavigate } from "react-router";
import GlobalAssistant from "@/components/GlobalAssistant";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ui, type LangKey } from "@/lib/i18n";

export default function Landing() {
  const navigate = useNavigate();
  const profile = useQuery(api.profiles.get);
  const lang = (profile?.preferredLang || "en") as LangKey;

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.01_120)] text-[oklch(0.22_0.02_120)]">
      {/* Top Header */}
      <header className="sticky top-4 z-30">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="flex items-center justify-between rounded-2xl bg-white shadow-sm ring-1 ring-black/5 px-3 py-2">
            {/* Left: Logo */}
            <a href="/" className="flex items-center gap-2">
              <img
                src="/assets/Logo_.png"
                alt="Root Assistant"
                className="h-7 w-7 rounded-lg object-cover ring-1 ring-black/5"
                onError={(e) => {
                  const t = e.currentTarget as HTMLImageElement;
                  if (t.src !== '/logo.svg') t.src = '/logo.svg';
                  t.onerror = null;
                }}
              />
              <span className="font-semibold">Root Assistant</span>
            </a>

            {/* Center: Nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="#features" className="text-[oklch(0.4_0.02_120)] hover:text-[oklch(0.3_0.03_120)]">
                {ui(lang, "Features")}
              </a>
              <a href="#stack" className="text-[oklch(0.4_0.02_120)] hover:text-[oklch(0.3_0.03_120)]">
                {ui(lang, "Tech Stack")}
              </a>
              <a href="/reviews" className="text-[oklch(0.4_0.02_120)] hover:text-[oklch(0.3_0.03_120)]">
                {ui(lang, "Reviews")}
              </a>
            </nav>

            {/* Right: Lang + CTA */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 rounded-xl bg-[oklch(0.97_0.01_120)] px-3 py-1.5 text-xs text-[oklch(0.45_0.03_120)] ring-1 ring-black/5">
                {lang.toUpperCase()}
              </div>
              <Button
                className="rounded-xl bg-[oklch(0.69_0.17_145)] text-white hover:bg-[oklch(0.64_0.17_145)]"
                onClick={() => navigate("/dashboard")}
              >
                {ui(lang, "Open App")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mt-6">
        <div className="relative h-screen min-h-[640px] w-full">
          <img
            src="/assets/Farm_2.webp"
            alt="Farm field"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.25),rgba(0,0,0,0.35))]" />
          <div className="relative z-10 mx-auto max-w-6xl h-full px-4 flex flex-col items-center justify-center text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-white/80 px-4 py-1.5 text-xs font-medium text-[oklch(0.35_0.03_120)] shadow">
              {ui(lang, "Welcome Message")}
            </div>
            <h1 className="text-white text-4xl md:text-6xl font-extrabold leading-tight">
              {ui(lang, "AppTitle")}
            </h1>
            <p className="mt-3 max-w-3xl text-white/90">
              {ui(lang, "AppTagline")}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Button
                className="rounded-xl bg-[oklch(0.69_0.17_145)] text-white hover:bg-[oklch(0.64_0.17_145)]"
                onClick={() => navigate("/dashboard")}
              >
                {ui(lang, "Open App")}
              </Button>
              <Button
                variant="secondary"
                className="rounded-xl bg-white/90 text-[oklch(0.3_0.03_120)] hover:bg-white"
                onClick={() => navigate("/language")}
              >
                {ui(lang, "Change Language")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Tools Hub */}
      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold">{ui(lang, "Core Tools Hub")}</h2>
          <p className="mt-2 text-[oklch(0.45_0.03_120)]">
            Easy, fast, and simple for everyone.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Voice Commands */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="inline-flex items-center justify-center rounded-xl bg-[oklch(0.97_0.01_120)] p-3 ring-1 ring-black/5">
              <Mic className="h-5 w-5 text-[oklch(0.69_0.17_145)]" />
            </div>
            <div className="mt-4 font-semibold">{ui(lang, "Voice Commands")}</div>
            <p className="mt-1 text-sm text-[oklch(0.45_0.03_120)]">
              {ui(lang, "Voice Commands Desc")}
            </p>
            <a href="/dashboard" className="mt-3 inline-block text-sm font-medium text-[oklch(0.56_0.14_145)] hover:underline">
              Try Now →
            </a>
          </div>

          {/* Soil Test */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="inline-flex items-center justify-center rounded-xl bg-[oklch(0.97_0.01_120)] p-3 ring-1 ring-black/5">
              <FlaskConical className="h-5 w-5 text-[oklch(0.69_0.17_145)]" />
            </div>
            <div className="mt-4 font-semibold">{ui(lang, "Soil Test")}</div>
            <p className="mt-1 text-sm text-[oklch(0.45_0.03_120)]">
              {ui(lang, "Soil Test Desc")}
            </p>
            <a href="/soil-test" className="mt-3 inline-block text-sm font-medium text-[oklch(0.56_0.14_145)] hover:underline">
              Test Your Soil →
            </a>
          </div>

          {/* My Farm */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="inline-flex items-center justify-center rounded-xl bg-[oklch(0.97_0.01_120)] p-3 ring-1 ring-black/5">
              <Sprout className="h-5 w-5 text-[oklch(0.69_0.17_145)]" />
            </div>
            <div className="mt-4 font-semibold">{ui(lang, "My Farm")}</div>
            <p className="mt-1 text-sm text-[oklch(0.45_0.03_120)]">
              {ui(lang, "My Farm Desc")}
            </p>
            <a href="/my-farm" className="mt-3 inline-block text-sm font-medium text-[oklch(0.56_0.14_145)] hover:underline">
              Go to My Farm →
            </a>
          </div>
        </div>
      </section>

      {/* Under the Hood */}
      <section id="stack" className="bg-[oklch(0.97_0.01_120)] py-20">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left copy */}
            <div className="space-y-4">
              <h3 className="text-3xl font-extrabold">{ui(lang, "Under the Hood")}</h3>
              <p className="text-[oklch(0.45_0.03_120)]">
                We use modern, scalable technologies to deliver a seamless experience.
                Our stack is built for performance, reliability, and continuous innovation.
              </p>
              <div className="rounded-xl bg-white text-[oklch(0.3_0.03_120)] px-4 py-3 shadow-sm ring-1 ring-black/5 text-sm">
                {ui(lang, "Voice CTA")}
              </div>
            </div>

            {/* Frontend */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="font-bold text-lg">{ui(lang, "Frontend")}</div>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  "TypeScript + React",
                  "Vite + React-Router",
                  "TailwindCSS",
                  "Framer Motion",
                  "OpenAI TTS",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[oklch(0.69_0.17_145)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Backend */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="font-bold text-lg">{ui(lang, "Backend")}</div>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  "Convex",
                  "Clerk Auth",
                  "Replicate/HuggingFace",
                  "OpenAI GPT-4o",
                  "Open-Meteo",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[oklch(0.69_0.17_145)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="text-center">
          <h3 className="text-3xl md:text-4xl font-extrabold">{ui(lang, "What Farmers Say")}</h3>
          <p className="mt-2 text-[oklch(0.45_0.03_120)]">
            Real stories from farmers transforming their operations with Root Assistant.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote:
                "Root Assistant has completely changed how I manage my crops. The voice commands are a game-changer, especially when my hands are dirty.",
              author: "Maria S., Corn Farmer",
              loc: "California, USA",
            },
            {
              quote:
                "The soil testing feature is incredibly accurate. It saved me a fortune on fertilizers this season by giving me precise data.",
              author: "John D., Wheat Farmer",
              loc: "Kansas, USA",
            },
            {
              quote:
                "As a small-scale organic farmer, 'My Farm' simulations are invaluable for planning. Root Assistant is an essential tool for modern agriculture.",
              author: "Aisha K., Organic Farmer",
              loc: "Punjab, India",
            },
          ].map((t, i) => (
            <div key={i} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="text-[oklch(0.69_0.17_145)]">★★★★★</div>
              <p className="mt-3 text-[oklch(0.3_0.03_120)]">"{t.quote}"</p>
              <div className="mt-4 text-sm font-medium">{t.author}</div>
              <div className="text-xs text-[oklch(0.45_0.03_120)]">{t.loc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[oklch(0.97_0.01_120)]">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Brand + subscribe */}
          <div>
            <div className="flex items-center gap-2">
              <img
                src="/assets/Logo_.png"
                alt="Root Assistant"
                className="h-8 w-8 rounded-lg ring-1 ring-black/5"
                onError={(e) => {
                  const t = e.currentTarget as HTMLImageElement;
                  if (t.src !== '/logo.svg') t.src = '/logo.svg';
                  t.onerror = null;
                }}
              />
              <span className="font-extrabold">Root Assistant</span>
            </div>
            <p className="mt-3 text-sm text-[oklch(0.45_0.03_120)]">
              Farming, simplified. Grow smarter with our intuitive tools, AI-driven experience, and real-time data.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full max-w-[220px] rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
              />
              <Button className="rounded-xl bg-[oklch(0.69_0.17_145)] text-white hover:bg-[oklch(0.64_0.17_145)]">
                {ui(lang, "Subscribe")}
              </Button>
            </div>
          </div>

          {/* Columns */}
          {[
            {
              title: ui(lang, "Product"),
              links: [
                { label: ui(lang, "Dashboard"), href: "/dashboard" },
                { label: ui(lang, "My Farm"), href: "/my-farm" },
                { label: ui(lang, "Soil Test"), href: "/soil-test" },
                { label: ui(lang, "Market"), href: "/market" },
              ],
            },
            {
              title: ui(lang, "Company"),
              links: [
                { label: ui(lang, "Our Mission"), href: "/our-mission" },
                { label: ui(lang, "Our Team"), href: "/our-team" },
                { label: ui(lang, "Careers"), href: "/future-plan" },
                { label: ui(lang, "Contact Us"), href: "/settings" },
              ],
            },
            {
              title: ui(lang, "Resources"),
              links: [
                { label: ui(lang, "Blog"), href: "/learn" },
                { label: ui(lang, "FAQs"), href: "/#faq" },
                { label: ui(lang, "Community"), href: "/community" },
                { label: ui(lang, "Support"), href: "/settings" },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <div className="font-semibold mb-3">{col.title}</div>
              <ul className="space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-[oklch(0.45_0.03_120)] hover:text-[oklch(0.35_0.03_120)] hover:underline">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-black/10">
          <div className="mx-auto w-full max-w-6xl px-4 py-4 text-xs flex flex-col md:flex-row items-center justify-between gap-2 text-[oklch(0.45_0.03_120)]">
            <div>© {new Date().getFullYear()} Root Assistant. {ui(lang, "All rights reserved")}.</div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:underline">{ui(lang, "Privacy Policy")}</a>
              <a href="#" className="hover:underline">{ui(lang, "Terms of Service")}</a>
            </div>
          </div>
        </div>
      </footer>

      <GlobalAssistant />
    </div>
  );
}