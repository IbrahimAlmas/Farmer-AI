import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Mic, Sprout, Camera, ShoppingCart, Languages, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2000&auto=format&fit=crop"
            alt="Fields"
            className="h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
        </div>

        <div className="mx-auto w-full max-w-5xl px-4 pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="flex justify-center">
              <img src="/logo.svg" alt="KrishiMitra" className="h-14 w-14 rounded-xl shadow" />
            </div>
            <h1 className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
              KrishiMitra — Your Voice‑First Farming Companion
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Speak in your language, manage farms, test soil with camera, and track market prices — all in a simple, mobile‑first app.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button className="rounded-2xl px-5 py-5 text-base" onClick={() => navigate("/dashboard")}>
                Open App <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="secondary" className="rounded-2xl px-5 py-5 text-base" onClick={() => navigate("/market")}>
                See Market Prices
              </Button>
            </div>
            <div className="mt-8 inline-flex items-center gap-2 rounded-2xl border bg-card/70 backdrop-blur px-3 py-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Private & secure. You control your data.
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="mx-auto w-full max-w-5xl px-4 -mt-12 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-3xl border bg-card/70 backdrop-blur">
            <CardContent className="p-5">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Mic className="h-6 w-6" />
              </div>
              <div className="font-semibold">Voice‑First & Multilingual</div>
              <p className="text-sm text-muted-foreground mt-1">
                Navigate, add tasks, and get answers with your voice in Telugu, Hindi, English, and more.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border bg-card/70 backdrop-blur">
            <CardContent className="p-5">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Camera className="h-6 w-6" />
              </div>
              <div className="font-semibold">Camera‑Powered Soil Test</div>
              <p className="text-sm text-muted-foreground mt-1">
                Click or upload soil photos for instant AI insights and actionable recommendations.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border bg-card/70 backdrop-blur">
            <CardContent className="p-5">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div className="font-semibold">Region‑Aware Market Prices</div>
              <p className="text-sm text-muted-foreground mt-1">
                See indicative local retail prices (₹/kg) for vegetables in your state.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Split Section */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="rounded-3xl border bg-card/70 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Sprout className="h-5 w-5" />
                </div>
                <div className="font-semibold">Manage Farms & Simulate Growth</div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Add farms, capture 3D context (corner photos + GPS walk), and run simple per‑farm simulations: plant, water, advance, harvest.
              </p>
              <div className="mt-4">
                <Button variant="outline" className="rounded-2xl" onClick={() => navigate("/my-farm")}>
                  Go to My Farm
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border bg-card/70 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Languages className="h-5 w-5" />
                </div>
                <div className="font-semibold">Local Language Experience</div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Choose your preferred language from Settings. The app adapts navigation and key screens automatically.
              </p>
              <div className="mt-4">
                <Button variant="outline" className="rounded-2xl" onClick={() => navigate("/settings")}>
                  Set Language
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border bg-card/70 backdrop-blur p-8 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold">Start with your voice</h2>
          <p className="text-muted-foreground mt-2">
            Say “Open Market”, “Add Task”, or “Test Soil” — it’s that simple.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button className="rounded-2xl px-5 py-5 text-base" onClick={() => navigate("/dashboard")}>
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="secondary" className="rounded-2xl px-5 py-5 text-base" onClick={() => navigate("/soil-test")}>
              Try Soil Test
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
