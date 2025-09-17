import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Mic, Sprout, Camera, ShoppingCart, Languages, ShieldCheck, Loader2, Cloud, Sparkles, MapPin, Leaf, BarChart3, Shield, Users2, Zap } from "lucide-react";
import { useNavigate } from "react-router";
import { useMemo, useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import LanguageSelect from "@/components/LanguageSelect";
import { useAction, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { ui, type LangKey } from "@/lib/i18n";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Landing() {
  const navigate = useNavigate();
  const updateProfile = useMutation(api.profiles.update);
  const tts = useAction(api.voice.tts);
  const reverseGeocode = useAction(api.location.reverseGeocode);

  // Setup progress UI
  const [setupLoading, setSetupLoading] = useState(false);

  // Add: Language gate state for first screen selection
  const [gateOpen, setGateOpen] = useState<boolean>(false);
  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [guestLang, setGuestLang] = useState<string | null>(null);
  // Add: show minimal CTA page right after language selection
  const [postGate, setPostGate] = useState<boolean>(false);
  // New: simple two-step slider for gate (0 = welcome, 1 = language select)
  const [gateSlide, setGateSlide] = useState<number>(0);

  // Live background images for the gate (rotating, mobile-first)
  const bgImages: Array<string> = [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?q=80&w=1600&auto=format&fit=crop",
  ];
  const [bgIndex, setBgIndex] = useState<number>(0);
  useEffect(() => {
    if (!gateOpen) return;
    const id = setInterval(() => {
      setBgIndex((i) => (i + 1) % bgImages.length);
    }, 5000);
    return () => clearInterval(id);
  }, [gateOpen]);

  // Map Indian states to regional language codes (fallbacks to Hindi for some)
  const stateToLang = (state?: string): string | null => {
    if (!state) return null;
    const s = state.toLowerCase();
    const map: Record<string, string> = {
      "tamil nadu": "ta",
      "andhra pradesh": "te",
      "telangana": "te",
      "kerala": "ml",
      "karnataka": "kn",
      "delhi": "hi",
      "nct of delhi": "hi",
      "uttar pradesh": "hi",
      "uttarakhand": "hi",
      "haryana": "hi",
      "punjab": "pa",
      "west bengal": "bn",
      "maharashtra": "mr",
      "gujarat": "gu",
      "odisha": "or",
      "assam": "as",
      "bihar": "hi", // Bhojpuri optional; keep Hindi for stability
      "madhya pradesh": "hi",
      "rajasthan": "hi",
      "chandigarh": "hi",
      "goa": "mr",
    };
    return map[s] ?? null;
  };

  // Normalize browser locale to our short code
  const localeToLang = (loc: string | undefined | null): string => {
    const l = String(loc || "").toLowerCase();
    const known = ["te","ta","ml","kn","hi","bn","mr","gu","pa","or","as","bho","en"];
    const found = known.find((k) => l.startsWith(k));
    return found || "en";
  };

  // Auto-localize: if user is logged in and prefers English, set to regional language based on saved state or browser locale
  // Do NOT run for unauthenticated users (profile === null) to avoid errors
  // Do NOT override if user already picked a non-English language
  // Runs once when profile is loaded
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const profile = useQuery(api.profiles.get);
  const currentLang = String(profile?.preferredLang || "en");

  // Initialize language gate for guests and set selected language source
  useEffect(() => {
    try {
      const stored = localStorage.getItem("km.lang");
      if (stored) {
        setGuestLang(stored);
        setSelectedLang(stored);
        setGateOpen(false);
        // Show the post-gate CTA when a guest language is already saved
        if (!profile) {
          setPostGate(true);
        }
      } else {
        // Do NOT auto-open the language gate; landing remains the main page
        setGateOpen(false);
        if (!profile) {
          setPostGate(false);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, [profile]);

  // When profile is available, prefer its language
  useEffect(() => {
    if (profile?.preferredLang) {
      setSelectedLang(String(profile.preferredLang));
      setGateOpen(false);
    }
  }, [profile?.preferredLang]);

  // Auto-set preferred language once based on profile state or browser locale
  // Only if profile exists (authenticated) and currently "en"
  // This avoids surprise changes for users who already chose a language.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useMemo(() => {
    (async () => {
      if (!profile) return; // not authenticated
      const current = String(profile.preferredLang || "en");
      if (current !== "en") return;

      const fromState = stateToLang(profile.location?.state);
      const nextLang = fromState || localeToLang(navigator.language);
      if (nextLang && nextLang !== current) {
        try {
          await updateProfile({ preferredLang: nextLang });
          toast.success("Language set based on your region");
        } catch (e: any) {
          // non-blocking
        }
      }
    })();
  }, [profile, updateProfile]);

  // Detect location via GPS and set profile.location with state; auto-set language if still "en"
  useEffect(() => {
    (async () => {
      // Only for authenticated users with no saved location state
      if (!profile) return; // not authenticated
      const hasState = !!profile.location?.state;
      if (hasState) return;

      // Avoid double-running if already in progress
      if (setupLoading) return;
      setSetupLoading(true);
      try {
        if (!navigator.geolocation) {
          setSetupLoading(false);
          return;
        }
        await new Promise<void>((resolve, reject) => {
          const onSuccess = async (pos: GeolocationPosition) => {
            try {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              const result = await reverseGeocode({ lat, lng });
              const detectedState = (result as any)?.state as string | null;

              // Build location object for profile
              const location = { lat, lng, state: detectedState || undefined };

              // If current language is still "en", compute a regional one
              const current = String(profile.preferredLang || "en");
              let nextLang: string | null = null;
              if (current === "en") {
                nextLang = stateToLang(detectedState || undefined) || localeToLang(navigator.language);
              }

              // Update profile with location (and language if decided)
              try {
                await updateProfile(
                  nextLang
                    ? { location, preferredLang: nextLang }
                    : { location }
                );
                if (nextLang) {
                  toast.success("Language set based on your region");
                } else {
                  toast.success("Location saved");
                }
              } catch (e: any) {
                // non-blocking
              }
              resolve();
            } catch (e) {
              reject(e);
            }
          };
          const onError = () => resolve(); // Ignore errors silently for now
          navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 15000,
          });
        });
      } finally {
        setSetupLoading(false);
      }
    })();
  }, [profile, reverseGeocode, updateProfile, setupLoading]);

  // Localized voice intro strings
  const greetings: Record<string, string> = {
    ta: "வணக்கம்! நான் Root AI, உங்கள் விவசாய உதவியாளர்!",
    te: "నమస్కారం! నేను Root AI, మీ వ్యవసాయ సహాయకుడు!",
    ml: "നമസ്കാരം! ഞാൻ Root AI, നിങ്ങളുടെ കൃഷി സഹായി!",
    kn: "ನಮಸ್ಕಾರ! ನಾನು Root AI, ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕ!",
    hi: "नमस्कार! मैं Root AI, आपका कृषि सहायक हूँ!",
    bn: "নমস্কার! আমি Root AI, আপনার কৃষি সহকারী!",
    mr: "नमस्कार! मी Root AI, तुमचा शेती सहाय्यक!",
    gu: "નમસ્કાર! હું Root AI, તમારો કૃષિ સહાયક!",
    pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ Root AI, ਤੁਹਾਡਾ ਖੇਤੀ ਸਹਾਇਕ!",
    or: "ନମସ୍କାର! ମୁଁ Root AI, ଆପଣଙ୍କ କୃଷି ସହାୟକ!",
    as: "নমস্কাৰ! মই Root AI, আপোনাৰ কৃষি সহায়ক!",
    bho: "प्रणाम! हम Root AI, तोहार खेती सहायक बानी!",
    en: "Hello! I am Root AI, your farming assistant!",
  };

  const langToBCP47: Record<string, string> = {
    te: "te-IN",
    ta: "ta-IN",
    ml: "ml-IN",
    kn: "kn-IN",
    hi: "hi-IN",
    bn: "bn-IN",
    mr: "mr-IN",
    gu: "gu-IN",
    pa: "pa-IN",
    or: "or-IN",
    as: "as-IN",
    bho: "hi-IN", // fallback for TTS
    en: "en-IN",
  };

  const playIntro = async () => {
    try {
      // Use the live selection during the language gate; otherwise use profile language
      const lang = gateOpen ? selectedLang : (currentLang || "en");
      const text = greetings[lang] || greetings.en;
      const bcp = langToBCP47[lang] || "en-IN";
      const base64 = await tts({ text, language: bcp });
      const audio = new Audio(`data:audio/mp3;base64,${base64}`);
      await audio.play();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to play intro");
    }
  };

  const tr = (s: string) => {
    if (currentLang.startsWith("te")) {
      const te: Record<string, string> = {
        "Root AI — Intelligent Agriculture Companion": "Root AI — మేధావి వ్యవసాయ సహాయకుడు",
        "Speak in your language, manage farms, test soil with camera, and track market prices — all in a simple, mobile‑first app.":
          "మీ భాషలో మాట్లాడండి, ఫార్మ్‌లను నిర్వహించండి, కెమెరాతో మట్టి పరీక్ష చేయండి, మరియు మార్కెట్ ధరలు ట్రాక్ చేయండి — ఇవన్నీ ఒక సాధారణ, మొబైల్‑ఫస్ట్ యాప్‌లో.",
        "Open App": "యాప్ ఓపెన్ చేయండి",
        "See Market Prices": "మార్కెట్ ధరలు చూడండి",
        "Private & secure. You control your data.": "గోప్యత & భద్రత. మీ డేటా మీదే నియంత్రణ.",
        "Voice‑First & Multilingual": "వాయిస్‑ఫస్ట్ & బహుభాషా",
        "Navigate, add tasks, and get answers with your voice in Telugu, Hindi, English, and more.":
          "తెలుగు, హిందీ, ఇంగ్లీష్ తదితర భాషల్లో మీ వాయిస్‌తో నావిగేట్ చేయండి, టాస్క్‌లు జోడించండి, సమాధానాలు పొందండి.",
        "Camera‑Powered Soil Test": "కెమెరా ఆధారిత మట్టి పరీక్ష",
        "Click or upload soil photos for instant AI insights and actionable recommendations.":
          "తక్షణ AI విశ్లేషణలు మరియు సూచనల కోసం మట్టి ఫోటోలు క్యాప్చర్ చేయండి లేదా అప్‌లోడ్ చేయండి.",
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

  // Add: simple language map for the gate
  const langOptions: Array<{ label: string; value: string }> = [
    { label: "English", value: "en" },
    { label: "தமிழ்", value: "ta" },
    { label: "తెలుగు", value: "te" },
    { label: "മലയാളം", value: "ml" },
    { label: "ಕನ್ನಡ", value: "kn" },
    { label: "हिन्दी", value: "hi" },
    { label: "বাংলা", value: "bn" },
    { label: "मराठी", value: "mr" },
    { label: "ગુજરાતી", value: "gu" },
    { label: "ਪੰਜਾਬੀ", value: "pa" },
    { label: "ଓଡ଼ିଆ", value: "or" },
    { label: "অসমীয়া", value: "as" },
    { label: "भोजपुरी", value: "bho" },
    { label: "اردو", value: "ur" },
    { label: "नेपाली", value: "ne" },
    { label: "සිංහල", value: "si" },
    { label: "मैथिली", value: "mai" },
    { label: "कोंकणी", value: "kok" },
    { label: "سنڌي (Sindhi)", value: "sd" },
    { label: "کٲشُر (Kashmiri)", value: "ks" },
  ];

  // Confirm selected language: save to profile if signed in, else to localStorage
  const confirmLanguage = async () => {
    const lang = selectedLang || "en";
    try {
      if (profile?._id) {
        await updateProfile({ preferredLang: lang });
      } else {
        localStorage.setItem("km.lang", lang);
      }
      setGateOpen(false);
      setPostGate(true); // show the second landing with minimal buttons
      toast.success("Language set");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to set language");
    }
  };

  const activeLang: LangKey = (String(profile?.preferredLang || guestLang || selectedLang || "en") as LangKey);
  const langForGate: LangKey = (gateOpen ? (selectedLang as LangKey) : activeLang);

  if (gateOpen) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-background text-foreground flex items-center justify-center px-4">
        {/* Patterned background to match landing */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(135deg, color-mix(in oklab, var(--color-secondary) 70%, white 30%) 0 14px, color-mix(in oklab, var(--color-secondary) 85%, black 15%) 14px 28px)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background z-10" />
        </div>

        <div className="relative z-20 w-full max-w-3xl">
          {/* Header */}
          <div className="flex items-center gap-3 justify-center mb-6">
            <img
              src="https://harmless-tapir-303.convex.cloud/api/storage/a4af3a5d-e126-420d-b31d-c1929a3c833b"
              alt="Root AI"
              className="h-12 w-12 rounded-lg object-cover border"
              onError={(e) => {
                const t = e.currentTarget as HTMLImageElement;
                if (t.src !== '/logo.svg') t.src = '/logo.svg';
                t.onerror = null;
              }}
            />
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{ui(langForGate, "Choose Language")}</div>
          </div>

          {/* Card */}
          <div className="rounded-2xl border bg-card shadow-none">
            <div className="p-5 md:p-6">
              <h2 className="text-xl font-extrabold">{ui(langForGate, "Select Preferred Language")}</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {ui(langForGate, "Language Change Note")}
              </p>

              {/* Grid with scroll to accommodate 18+ languages */}
              <div className="mt-5">
                <div className="max-h-[360px] overflow-auto pr-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {langOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedLang(opt.value)}
                        className={`rounded-xl border px-3 py-3 text-sm text-left transition-all
                          ${
                            selectedLang === opt.value
                              ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                              : "hover:bg-muted/60"
                          }`}
                        aria-pressed={selectedLang === opt.value}
                        aria-label={`Select ${opt.label}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  className="rounded-xl border px-4 py-3 text-sm hover:bg-muted/60"
                  onClick={() => {
                    // go back to landing without saving
                    setGateOpen(false);
                  }}
                >
                  {ui(langForGate, "Back")}
                </button>
                <Button
                  className="rounded-xl px-5 py-5 text-base bg-primary text-primary-foreground hover:opacity-95"
                  onClick={confirmLanguage}
                >
                  {ui(langForGate, "Continue")}
                </Button>
              </div>
            </div>

            {/* Footer note */}
            <div className="border-t px-5 py-3 text-center text-xs text-muted-foreground">
              {ui(langForGate, "SecurityNote")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        {/* Neobrutalist patterned background */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(135deg, color-mix(in oklab, var(--color-secondary) 70%, white 30%) 0 14px, color-mix(in oklab, var(--color-secondary) 85%, black 15%) 14px 28px)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background z-10" />
        </div>

        <div className="relative z-20 mx-auto w-full max-w-6xl px-4 pt-16 pb-16">
          {/* Top-right language selector for landing */}
          <div className="flex justify-end">
            <LanguageSelect size="sm" />
          </div>

          <div className="mt-6 grid md:grid-cols-[1.25fr_1fr] gap-6 items-stretch">
            {/* Left: Title + CTAs */}
            <div className="rounded-2xl bg-card border p-6 md:p-8 shadow-none">
              <div className="flex items-center gap-3">
                <img
                  src="https://harmless-tapir-303.convex.cloud/api/storage/a4af3a5d-e126-420d-b31d-c1929a3c833b"
                  alt="Root AI"
                  className="h-12 w-12 rounded-lg object-cover"
                  onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement;
                    if (t.src !== '/logo.svg') t.src = '/logo.svg';
                    t.onerror = null;
                  }}
                />
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{ui(activeLang, "Farming Companion")}</div>
              </div>

<h1 className="mt-5 text-4xl md:text-5xl font-extrabold leading-[1.1]">
  {ui(activeLang, "AppTitle")}
</h1>
<p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl">
  {ui(activeLang, "AppTagline")}
</p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  className="rounded-xl px-5 py-5 text-base bg-secondary hover:bg-secondary/80"
                  onClick={() => {
                    try { localStorage.removeItem("km.lang"); } catch {}
                    setGuestLang(null);
                    setSelectedLang("en");
                    setPostGate(false);
                    setGateOpen(true);
                  }}
                >
                  {ui(activeLang, "Change Language")}
                </Button>
                <Button
                  className="rounded-xl px-5 py-5 text-base bg-primary text-primary-foreground hover:opacity-95"
                  onClick={() => navigate("/dashboard")}
                >
                  {ui(activeLang, "Open App")}
                </Button>
              </div>

              {/* Add: Compact stat strip under hero actions */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">Active Farmers</div>
                  <div className="text-lg font-extrabold">12,500+</div>
                </div>
                <div className="rounded-xl border bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">Soil Tests</div>
                  <div className="text-lg font-extrabold">48k</div>
                </div>
                <div className="rounded-xl border bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">Communities</div>
                  <div className="text-lg font-extrabold">320</div>
                </div>
                <div className="rounded-xl border bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">Recommendations</div>
                  <div className="text-lg font-extrabold">1.2M</div>
                </div>
              </div>

              <div className="mt-6 inline-flex items-center gap-2 rounded-xl border bg-muted/50 px-3 py-2 text-sm">
                <span className="inline-block h-3 w-3 rounded-[4px] bg-primary" />
                {ui(activeLang, "SecurityNote")}
              </div>
            </div>

            {/* Right: Visual card with texture */}
            <div className="rounded-2xl border bg-card p-0 overflow-hidden">
              <div className="h-full min-h-[260px] relative">
                <img
                  src="/assets/Fild.jpeg"
                  alt="Fields"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement;
                    if (t.src !== '/logo_bg.png') t.src = '/logo_bg.png';
                    t.onerror = null;
                  }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.35),transparent_40%)]" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-background/90 border px-3 py-2 text-xs">
                    <span className="font-semibold">{ui(activeLang, "Live Tools")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Blocks — neobrutalist cards */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl border bg-card p-5 md:p-6">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-[10px] bg-primary text-primary-foreground mb-3 border">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="font-semibold">AI Insights</div>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time recommendations for irrigation and planting powered by modern AI.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 md:p-6">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-[10px] bg-primary text-primary-foreground mb-3 border">
              <Cloud className="h-6 w-6" />
            </div>
            <div className="font-semibold">Weather-Aware</div>
            <p className="text-sm text-muted-foreground mt-1">
              ET0 and rainfall integrated to guide watering with precision per field.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 md:p-6">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-[10px] bg-primary text-primary-foreground mb-3 border">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="font-semibold">Location Smart</div>
            <p className="text-sm text-muted-foreground mt-1">
              Region-specific market info and community discovery near you.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 md:p-6">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-[10px] bg-primary text-primary-foreground mb-3 border">
              <Leaf className="h-6 w-6" />
            </div>
            <div className="font-semibold">Crop Profiles</div>
            <p className="text-sm text-muted-foreground mt-1">
              Seed types, stages, and coefficients modeled for realistic growth.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 md:p-6">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-[10px] bg-primary text-primary-foreground mb-3 border">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="font-semibold">Track & Improve</div>
            <p className="text-sm text-muted-foreground mt-1">
              Growth, health, and soil moisture metrics visualized cleanly.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 md:p-6">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-[10px] bg-primary text-primary-foreground mb-3 border">
              <Shield className="h-6 w-6" />
            </div>
            <div className="font-semibold">Private by Design</div>
            <p className="text-sm text-muted-foreground mt-1">
              Your data stays yours. Clear controls and transparent storage.
            </p>
          </div>
        </div>
      </section>

      {/* Add: Expanded Feature Grid (denser, 2 rows) */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl border bg-card p-5 md:p-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] bg-primary text-primary-foreground mb-3 border">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="font-semibold">AI Insights</div>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time recommendations for irrigation and planting powered by modern AI.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 md:p-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] bg-primary text-primary-foreground mb-3 border">
              <Cloud className="h-6 w-6" />
            </div>
            <div className="font-semibold">Weather-Aware</div>
            <p className="text-sm text-muted-foreground mt-1">
              ET0 and rainfall integrated to guide watering with precision per field.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 md:p-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] bg-primary text-primary-foreground mb-3 border">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="font-semibold">Location Smart</div>
            <p className="text-sm text-muted-foreground mt-1">
              Region-specific market info and community discovery near you.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 md:p-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] bg-primary text-primary-foreground mb-3 border">
              <Leaf className="h-6 w-6" />
            </div>
            <div className="font-semibold">Crop Profiles</div>
            <p className="text-sm text-muted-foreground mt-1">
              Seed types, stages, and coefficients modeled for realistic growth.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 md:p-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] bg-primary text-primary-foreground mb-3 border">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="font-semibold">Track & Improve</div>
            <p className="text-sm text-muted-foreground mt-1">
              Growth, health, and soil moisture metrics visualized cleanly.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 md:p-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] bg-primary text-primary-foreground mb-3 border">
              <Shield className="h-6 w-6" />
            </div>
            <div className="font-semibold">Private by Design</div>
            <p className="text-sm text-muted-foreground mt-1">
              Your data stays yours. Clear controls and transparent storage.
            </p>
          </div>
        </div>
      </section>

      {/* Add: Partner / Trusted by marquee */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-12">
        <div className="rounded-2xl border bg-card p-5 md:p-6 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Trusted by innovative teams</div>
            <div className="text-xs text-muted-foreground">Beta</div>
          </div>
          <div className="relative mt-4">
            <div className="flex gap-8 animate-[marquee_24s_linear_infinite] will-change-transform"
                 style={{ maskImage: "linear-gradient(90deg, transparent 0, black 10%, black 90%, transparent 100%)" as any }}>
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-10 min-w-[160px] grid place-items-center rounded-xl border bg-muted/40 px-4">
                  <img src="/logo.svg" alt="Partner" className="h-6 opacity-70" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Split Section */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-primary text-primary-foreground grid place-items-center border">
                <span className="font-bold">1</span>
              </div>
              <div className="font-semibold">{ui(activeLang, "Manage Farms & Simulate Growth")}</div>
            </div>
<p className="text-sm text-muted-foreground mt-2">
  {ui(activeLang, "Manage Farms Desc")}
</p>
            {!postGate && (
              <div className="mt-4">
                <Button variant="outline" className="rounded-xl" onClick={() => navigate("/my-farm")}>
                  {ui(activeLang, "Go to My Farm")}
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-primary text-primary-foreground grid place-items-center border">
                <span className="font-bold">2</span>
              </div>
              <div className="font-semibold">{ui(activeLang, "Local Language Experience")}</div>
            </div>
<p className="text-sm text-muted-foreground mt-2">
  {ui(activeLang, "Local Language Desc")}
</p>
            {!postGate && (
              <div className="mt-4">
                <Button variant="outline" className="rounded-xl" onClick={() => navigate("/settings")}>
                  {ui(activeLang, "Set Language")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Image Mosaic Gallery */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-12">
        <div className="rounded-2xl border bg-card p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">From the fields</div>
            <div className="text-xs text-muted-foreground">Curated images</div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <img src="/assets/Fild.jpeg" alt="Field" className="h-24 w-full object-cover rounded-xl border" />
            <img src="/assets/Soil.webp" alt="Soil" className="h-24 w-full object-cover rounded-xl border" />
            <img src="/logo_bg.png" alt="Logo BG" className="h-24 w-full object-cover rounded-xl border" />
            <img src="https://images.unsplash.com/photo-1515721577489-2c79a7a81717?q=80&w=600&auto=format&fit=crop" alt="Crop" className="h-24 w-full object-cover rounded-xl border" />
            <img src="https://images.unsplash.com/photo-1472145246862-b24cf25c4a36?q=80&w=600&auto=format&fit=crop" alt="Irrigation" className="h-24 w-full object-cover rounded-xl border" />
            <img src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=600&auto=format&fit=crop" alt="Green" className="h-24 w-full object-cover rounded-xl border" />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-12">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { name: "Ravi", role: "Farmer, AP", body: "The irrigation advisor nailed my watering schedule. Saved water and time." },
            { name: "Meera", role: "Farmer, TN", body: "Soil test insights helped me balance nutrients better this season." },
            { name: "Arjun", role: "Co-op Lead, KA", body: "Community and jobs made it easy to find help for harvesting." },
          ].map((t, idx) => (
            <div key={idx} className="rounded-2xl border bg-card p-5 md:p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/15 grid place-items-center border">
                  <Users2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold leading-tight">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-24">
        <div className="rounded-2xl border bg-card p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold">{ui(activeLang, "Start with your voice")}</h2>
<p className="text-muted-foreground mt-2">
  {ui(activeLang, "Voice CTA")}
</p>
          {!postGate && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button className="rounded-xl px-5 py-5 text-base" onClick={() => navigate("/dashboard")}>
                {ui(activeLang, "Get Started")}
              </Button>
              <Button variant="secondary" className="rounded-xl px-5 py-5 text-base" onClick={() => navigate("/soil-test")}>
                {ui(activeLang, "Try Soil Test")}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-24">
        <div className="rounded-2xl border bg-card p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">Frequently asked questions</div>
            <div className="text-xs text-muted-foreground">Updated weekly</div>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How does the irrigation advisor work?</AccordionTrigger>
              <AccordionContent>
                It uses weather (ET0 and precipitation), crop coefficients, and your field's context to recommend daily water in mm and liters.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Can I use my local language?</AccordionTrigger>
              <AccordionContent>
                Yes. Switch languages from the top-right selector; navigation and key content adapt instantly.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>What is AI model generation?</AccordionTrigger>
              <AccordionContent>
                Upload a farm photo and generate a realistic 3D model via Meshy. You can track status and preview when ready.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
}