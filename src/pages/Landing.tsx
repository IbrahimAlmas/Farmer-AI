import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Mic, Sprout, Camera, ShoppingCart, Languages, ShieldCheck, Loader2, Cloud, Sparkles, MapPin, Leaf, BarChart3, Shield, Users2, Zap, Droplets, Sun, Cpu, Globe, TrendingUp, CheckCircle, FlaskConical } from "lucide-react";
import { useNavigate } from "react-router";
import { useMemo, useEffect, useState, useRef } from "react";
import { api } from "@/convex/_generated/api";
import LanguageSelect from "@/components/LanguageSelect";
import { useAction, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { ui, type LangKey } from "@/lib/i18n";
import GlobalAssistant from "@/components/GlobalAssistant";

export default function Landing() {
  const navigate = useNavigate();

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
                alt="Root AI"
                className="h-7 w-7 rounded-lg object-cover ring-1 ring-black/5"
                onError={(e) => {
                  const t = e.currentTarget as HTMLImageElement;
                  if (t.src !== '/logo.svg') t.src = '/logo.svg';
                  t.onerror = null;
                }}
              />
              <span className="font-semibold">Root AI</span>
            </a>

            {/* Center: Nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="#features" className="text-[oklch(0.4_0.02_120)] hover:text-[oklch(0.3_0.03_120)]">Features</a>
              <a href="#stack" className="text-[oklch(0.4_0.02_120)] hover:text-[oklch(0.3_0.03_120)]">Tech Stack</a>
              <a href="/reviews" className="text-[oklch(0.4_0.02_120)] hover:text-[oklch(0.3_0.03_120)]">Reviews</a>
            </nav>

            {/* Right: Lang + CTA */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 rounded-xl bg-[oklch(0.97_0.01_120)] px-3 py-1.5 text-xs text-[oklch(0.45_0.03_120)] ring-1 ring-black/5">
                EN
              </div>
              <Button
                className="rounded-xl bg-[oklch(0.69_0.17_145)] text-white hover:bg-[oklch(0.64_0.17_145)]"
                onClick={() => navigate("/dashboard")}
              >
                Open App
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mt-6">
        <div className="relative h-screen min-h-[640px] w-full">
          <img
            src="/assets/Fild.jpeg"
            alt="Farm field"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.25),rgba(0,0,0,0.35))]" />
          <div className="relative z-10 mx-auto max-w-6xl h-full px-4 flex flex-col items-center justify-center text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-white/80 px-4 py-1.5 text-xs font-medium text-[oklch(0.35_0.03_120)] shadow">
              Welcome to the future of farming!
            </div>
            <h1 className="text-white text-4xl md:text-6xl font-extrabold leading-tight">
              Root AI — Farming, <br className="hidden md:block" />
              Simplified.
            </h1>
            <p className="mt-3 max-w-3xl text-white/90">
              Speak in your language, manage farms, test soil with your camera,
              and track market prices — all in a simple, fast experience.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Button
                className="rounded-xl bg-[oklch(0.69_0.17_145)] text-white hover:bg-[oklch(0.64_0.17_145)]"
                onClick={() => navigate("/dashboard")}
              >
                Open App
              </Button>
              <Button
                variant="secondary"
                className="rounded-xl bg-white/90 text-[oklch(0.3_0.03_120)] hover:bg-white"
                onClick={() => navigate("/settings")}
              >
                Change Language
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Tools Hub */}
      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold">Core Tools Hub</h2>
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
            <div className="mt-4 font-semibold">Voice Commands</div>
            <p className="mt-1 text-sm text-[oklch(0.45_0.03_120)]">
              Get answers to commands in your language. Works in over 20 languages seamlessly.
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
            <div className="mt-4 font-semibold">Soil Test</div>
            <p className="mt-1 text-sm text-[oklch(0.45_0.03_120)]">
              Simply use your camera to capture soil photos for instant insights.
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
            <div className="mt-4 font-semibold">My Farm</div>
            <p className="mt-1 text-sm text-[oklch(0.45_0.03_120)]">
              Manage your farm and run simulations with real-time weather data.
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
              <h3 className="text-3xl font-extrabold">Under the Hood</h3>
              <p className="text-[oklch(0.45_0.03_120)]">
                We use modern, scalable technologies to deliver a seamless experience.
                Our stack is built for performance, reliability, and continuous innovation.
              </p>
              <div className="rounded-xl bg-white text-[oklch(0.3_0.03_120)] px-4 py-3 shadow-sm ring-1 ring-black/5 text-sm">
                Say "Open Market", "Add Task", or "Test Soil" — it's that simple.
              </div>
            </div>

            {/* Frontend */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="font-bold text-lg">Frontend</div>
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
              <div className="font-bold text-lg">Backend</div>
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
          <h3 className="text-3xl md:text-4xl font-extrabold">What Farmers Say</h3>
          <p className="mt-2 text-[oklch(0.45_0.03_120)]">
            Real stories from farmers transforming their operations with Root AI.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote:
                "Root AI has completely changed how I manage my crops. The voice commands are a game-changer, especially when my hands are dirty.",
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
                "As a small-scale organic farmer, 'My Farm' simulations are invaluable for planning. Root AI is an essential tool for modern agriculture.",
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
                alt="Root AI"
                className="h-8 w-8 rounded-lg ring-1 ring-black/5"
                onError={(e) => {
                  const t = e.currentTarget as HTMLImageElement;
                  if (t.src !== '/logo.svg') t.src = '/logo.svg';
                  t.onerror = null;
                }}
              />
              <span className="font-extrabold">Root AI</span>
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
                Subscribe
              </Button>
            </div>
          </div>

          {/* Columns */}
          {[
            {
              title: "Product",
              links: [
                { label: "Dashboard", href: "/dashboard" },
                { label: "My Farm", href: "/my-farm" },
                { label: "Soil Test", href: "/soil-test" },
                { label: "Market Prices", href: "/market" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "Our Mission", href: "/our-mission" },
                { label: "Our Team", href: "/our-team" },
                { label: "Careers", href: "/future-plan" },
                { label: "Contact Us", href: "/settings" },
              ],
            },
            {
              title: "Resources",
              links: [
                { label: "Blog", href: "/learn" },
                { label: "FAQs", href: "/#faq" },
                { label: "Community", href: "/community" },
                { label: "Support", href: "/settings" },
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
            <div>© {new Date().getFullYear()} Root AI. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      <GlobalAssistant />
    </div>
  );
}