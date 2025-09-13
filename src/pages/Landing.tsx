import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Mic, Sprout, Camera, ShoppingCart, Languages, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import LanguageSelect from "@/components/LanguageSelect";

export default function Landing() {
  const navigate = useNavigate();
  const profile = useQuery(api.profiles.get);
  const currentLang = String(profile?.preferredLang || "en");

  const tr = (s: string) => {
    if (currentLang.startsWith("te")) {
      const te: Record<string, string> = {
        "KrishiMitra — Your Voice‑First Farming Companion": "కృషిమిత్ర — మీ వాయిస్‑ఫస్ట్ వ్యవసాయ సహాయకుడు",
        "Speak in your language, manage farms, test soil with camera, and track market prices — all in a simple, mobile‑first app.":
          "మీ భాషలో మాట్లాడండి, ఫార్మ్‌లను నిర్వహించండి, కెమెరాతో మట్టి పరీక్ష చేయండి, మరియు మార్కెట్ ధరలను ట్రాక్ చేయండి — ఇవన్నీ ఒక సాధారణ, మొబైల్‑ఫస్ట్ యాప్‌లో.",
        "Open App": "యాప్ ఓపెన్ చేయండి",
        "See Market Prices": "మార్కెట్ ధరలు చూడండి",
        "Private & secure. You control your data.": "గోప్యత & భద్రత. మీ డేటా మీదే నియంత్రణ.",
        "Voice‑First & Multilingual": "వాయిస్‑ఫస్ట్ & బహుభాషా",
        "Navigate, add tasks, and get answers with your voice in Telugu, Hindi, English, and more.":
          "తెలుగు, హిందీ, ఇంగ్లీష్ తదితర భాషల్లో మీ వాయిస్‌తో నావిగేట్ చేయండి, టాస్క్‌లు జోడించండి, సమాధానాలు పొందండి.",
        "Camera‑Powered Soil Test": "కెమెరా ఆధారిత మట్టి పరీక్ష",
        "Click or upload soil photos for instant AI insights and actionable recommendations.":
          "తక్షణ AI విశ్లేషణలు మరియు సూచనల కోసం మట్టి ఫోటోలు క్లిక్ చేయండి లేదా అప్‌లోడ్ చేయండి.",
        "Region‑Aware Market Prices": "ప్రాంతానికి అనుగుణమైన మార్కెట్ ధరలు",
        "See indicative local retail prices (₹/kg) for vegetables in your state.":
          "మీ రాష్ట్రంలో కూరగాయల సూచకీయ స్థానిక రిటైల్ ధరలు (₹/kg) చూడండి.",
        "Manage Farms & Simulate Growth": "ఫార్మ్‌లను నిర్వహించండి & పంట పెరుగుదల సిమ్యులేట్ చేయండి",
        "Add farms, capture 3D context (corner photos + GPS walk), and run simple per‑farm simulations: plant, water, advance, harvest.":
          "ఫార్మ్‌లు జోడించండి, 3D కాంటెక్స్ట్ (కోన ఫొటోలు + GPS వాక్) క్యాప్చర్ చేయండి, మరియు ప్రతీ ఫార్మ్‌కు సింపుల్ సిమ్యులేషన్లు నడపండి: నాటడం, నీరు పెట్టడం, ముందుకు తీసుకెళ్లడం, కోత.",
        "Go to My Farm": "నా ఫార్మ్‌కి వెళ్ళండి",
        "Local Language Experience": "స్థానిక భాషా అనుభవం",
        "Choose your preferred language from Settings. The app adapts navigation and key screens automatically.":
          "సెట్టింగ్స్‌లో మీకు నచ్చిన భాషను ఎంచుకోండి. యాప్ ఆటోమేటిక్‌గా నావిగేషన్ మరియు ముఖ్య స్క్రీన్‌లను మార్చుతుంది.",
        "Set Language": "భాష సెట్ చేయండి",
        "Start with your voice": "మీ వాయిస్‌తో ప్రారంభించండి",
        "Say \"Open Market\", \"Add Task\", or \"Test Soil\" — it's that simple.":
          "\"మార్కెట్ ఓపెన్ చేయి\", \"టాస్క్ జోడించు\", లేదా \"మట్టి పరీక్ష\" అని చెప్పండి — అంతే చాలు.",
        "Get Started": "ప్రారంభించండి",
        "Try Soil Test": "మట్టి పరీక్ష ప్రయత్నించండి",
      };
      return te[s] ?? s;
    }
    return s;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src="/logo_bg.png"
            alt="Hero background"
            className="h-full w-full object-cover opacity-70"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
        </div>

        <div className="mx-auto w-full max-w-5xl px-4 pt-24 pb-16">
          {/* Top-right language selector for landing */}
          <div className="flex justify-end">
            <LanguageSelect size="sm" />
          </div>
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
              {tr("KrishiMitra — Your Voice‑First Farming Companion")}
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {tr("Speak in your language, manage farms, test soil with camera, and track market prices — all in a simple, mobile‑first app.")}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button className="rounded-2xl px-5 py-5 text-base" onClick={() => navigate("/dashboard")}>
                {tr("Open App")} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="secondary" className="rounded-2xl px-5 py-5 text-base" onClick={() => navigate("/market")}>
                {tr("See Market Prices")}
              </Button>
            </div>
            <div className="mt-8 inline-flex items-center gap-2 rounded-2xl border bg-card/70 backdrop-blur px-3 py-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {tr("Private & secure. You control your data.")}
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
              <div className="font-semibold">{tr("Voice‑First & Multilingual")}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {tr("Navigate, add tasks, and get answers with your voice in Telugu, Hindi, English, and more.")}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border bg-card/70 backdrop-blur">
            <CardContent className="p-5">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Camera className="h-6 w-6" />
              </div>
              <div className="font-semibold">{tr("Camera‑Powered Soil Test")}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {tr("Click or upload soil photos for instant AI insights and actionable recommendations.")}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border bg-card/70 backdrop-blur">
            <CardContent className="p-5">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div className="font-semibold">{tr("Region‑Aware Market Prices")}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {tr("See indicative local retail prices (₹/kg) for vegetables in your state.")}
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
                <div className="font-semibold">{tr("Manage Farms & Simulate Growth")}</div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {tr("Add farms, capture 3D context (corner photos + GPS walk), and run simple per‑farm simulations: plant, water, advance, harvest.")}
              </p>
              <div className="mt-4">
                <Button variant="outline" className="rounded-2xl" onClick={() => navigate("/my-farm")}>
                  {tr("Go to My Farm")}
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
                <div className="font-semibold">{tr("Local Language Experience")}</div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {tr("Choose your preferred language from Settings. The app adapts navigation and key screens automatically.")}
              </p>
              <div className="mt-4">
                <Button variant="outline" className="rounded-2xl" onClick={() => navigate("/settings")}>
                  {tr("Set Language")}
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
          <h2 className="text-2xl md:text-3xl font-bold">{tr("Start with your voice")}</h2>
          <p className="text-muted-foreground mt-2">
            {tr("Say \"Open Market\", \"Add Task\", or \"Test Soil\" — it's that simple.")}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button className="rounded-2xl px-5 py-5 text-base" onClick={() => navigate("/dashboard")}>
              {tr("Get Started")} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="secondary" className="rounded-2xl px-5 py-5 text-base" onClick={() => navigate("/soil-test")}>
              {tr("Try Soil Test")}
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}