import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Mic, Sprout, Camera, ShoppingCart, Languages, ShieldCheck, Loader2, Cloud, Sparkles, MapPin, Leaf, BarChart3, Shield, Users2, Zap, Droplets, Sun, Cpu, Globe, TrendingUp, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { useMemo, useEffect, useState, useRef } from "react";
import { api } from "@/convex/_generated/api";
import LanguageSelect from "@/components/LanguageSelect";
import { useAction, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { ui, type LangKey } from "@/lib/i18n";

export default function Landing() {
  const navigate = useNavigate();
  const updateProfile = useMutation(api.profiles.update);
  const tts = useAction(api.voice.tts);
  const reverseGeocode = useAction(api.location.reverseGeocode);
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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

  // Scroll-based animations
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

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

  // Spotlight effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
    
    heroRef.current.style.setProperty('--spot-x', `${x}%`);
    heroRef.current.style.setProperty('--spot-y', `${y}%`);
    heroRef.current.style.setProperty('--spot-opacity', '1');
  };

  const handleMouseLeave = () => {
    if (!heroRef.current) return;
    heroRef.current.style.setProperty('--spot-opacity', '0');
  };

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
          "ఫార్మ్‌లు జోడించండి, 3D కాంటెక్స్ట్ (కోన ఫొటోలు + GPS వాక్) క్యాప్చర్ చేయండి, మరియు ప్రతీ ఫార్మ్‌కు సిమ్పుల్ సిమ్యులేషన్లు నడపండి: నాటడం, నీరు పెట్టడం, ముందుకు తీసుకెళ్లడం, కోత.",
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

  // Dynamic feature grid data
  const dynamicFeatures = [
    {
      icon: Sparkles,
      title: "AI-Powered Insights",
      description: "Smart recommendations powered by machine learning algorithms",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Cloud,
      title: "Weather Integration",
      description: "Real-time weather data for precise irrigation timing",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Camera,
      title: "Visual Soil Analysis",
      description: "Instant soil health assessment through camera technology",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: BarChart3,
      title: "Growth Analytics",
      description: "Track crop performance with detailed metrics and insights",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: Globe,
      title: "Multi-Language Support",
      description: "Native language experience across 20+ regional languages",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: Shield,
      title: "Data Privacy",
      description: "Your farming data stays secure and under your control",
      gradient: "from-teal-500 to-green-500"
    },
    {
      icon: Zap,
      title: "Voice Commands",
      description: "Navigate and control the app using natural voice interactions",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: TrendingUp,
      title: "Yield Optimization",
      description: "Maximize harvest potential with data-driven recommendations",
      gradient: "from-rose-500 to-pink-500"
    },
    {
      icon: Droplets,
      title: "Smart Irrigation",
      description: "Optimize water usage based on crop needs and weather patterns",
      gradient: "from-cyan-500 to-blue-500"
    }
  ];

  // Live preview tiles data
  const livePreviewTiles = [
    { icon: Droplets, label: "Soil Moisture", color: "text-blue-500" },
    { icon: Sun, label: "Weather", color: "text-yellow-500" },
    { icon: Sprout, label: "Growth Stage", color: "text-green-500" },
    { icon: BarChart3, label: "Analytics", color: "text-purple-500" },
    { icon: Camera, label: "Soil Test", color: "text-orange-500" },
    { icon: Globe, label: "Market", color: "text-indigo-500" }
  ];

  // Motion timeline steps
  const timelineSteps = [
    { title: "Create Farm", description: "Add your farm details and location" },
    { title: "Capture Context", description: "Upload photos and GPS data" },
    { title: "AI Analysis", description: "Get intelligent recommendations" },
    { title: "Track Progress", description: "Monitor growth and health metrics" },
    { title: "Optimize Yield", description: "Harvest better results" }
  ];

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

  const SHOW_PREVIEW = false;
  const SHOW_TIMELINE = false;
  const SHOW_TESTIMONIALS = false;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Animated Announcement Ribbon */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-2 overflow-hidden"
      >
        <div className="animate-marquee whitespace-nowrap">
          <span className="mx-8">🌱 Welcome to the future of farming</span>
          <span className="mx-8">🚀 AI-powered agriculture at your fingertips</span>
          <span className="mx-8">🌍 Supporting 20+ languages</span>
          <span className="mx-8">💧 Smart irrigation recommendations</span>
          <span className="mx-8">📱 Voice-first mobile experience</span>
        </div>
      </motion.div>

      {/* Hero Section with Spotlight Effect */}
      <section className="relative overflow-hidden border-b">
        <motion.div 
          ref={heroRef}
          className="spotlight-container absolute inset-0 z-0"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ y: heroY, opacity: heroOpacity }}
        >
          {/* Multi-layer animated background */}
          <div className="absolute inset-0">
            {/* Base pattern layer */}
            <div
              className="absolute inset-0 animate-drift-slower"
              style={{
                background:
                  "radial-gradient(80% 80% at 20% 20%, color-mix(in oklab, var(--color-primary) 20%, transparent 80%), transparent 60%), radial-gradient(80% 80% at 80% 80%, color-mix(in oklab, var(--color-accent) 18%, transparent 82%), transparent 60%)",
              }}
            />
            
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/80 to-accent/10 animate-gradient-shift" />
            
            {/* Floating particles */}
            <div className="absolute inset-0">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-primary/30 rounded-full animate-particle-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.5}s`,
                  }}
                  aria-hidden
                />
              ))}
            </div>
          </div>
          
          {/* Animated orbs */}
          <motion.div
            className="absolute -top-20 -left-10 size-72 rounded-full bg-primary/10 blur-3xl animate-float-slow"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            aria-hidden
          />
          <motion.div
            className="absolute -bottom-28 -right-10 size-80 rounded-full bg-accent/10 blur-3xl animate-drift-slower"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2.5, ease: 'easeOut', delay: 0.3 }}
            aria-hidden
          />
          <motion.div
            className="absolute top-1/2 left-1/4 size-40 rounded-full bg-cyan-400/5 blur-2xl animate-float-slow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 3, delay: 0.8 }}
            style={{ animationDelay: '2s' }}
            aria-hidden
          />
        </motion.div>

        <div className="relative z-20 mx-auto w-full max-w-6xl px-4 pt-16 pb-16">
          {/* Top-right language selector for landing */}
          <motion.div 
            className="flex justify-end"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <LanguageSelect size="sm" />
          </motion.div>

          <div className="mt-6 grid md:grid-cols-[1.25fr_1fr] gap-6 items-stretch">
            {/* Left: Title + CTAs */}
            <motion.div 
              className="rounded-3xl p-6 md:p-8 bg-white/10 backdrop-blur-xl border border-transparent ring-1 ring-white/20 shadow-[0_12px_60px_-10px_rgba(0,0,0,0.25)] transition-all duration-300 will-change-transform hover:-translate-y-2 hover:shadow-[0_24px_80px_-20px_rgba(0,0,0,0.35)] hover:scale-[1.02] glow-sweep"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div 
                className="flex items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <motion.img
                  src="https://harmless-tapir-303.convex.cloud/api/storage/a4af3a5d-e126-420d-b31d-c1929a3c833b"
                  alt="Root AI"
                  className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/30 shadow-md"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement;
                    if (t.src !== '/logo.svg') t.src = '/logo.svg';
                    t.onerror = null;
                  }}
                />
                <div className="text-xs uppercase tracking-widest text-muted-foreground animate-shimmer">
                  {ui(activeLang, "Farming Companion")}
                </div>
              </motion.div>

              <motion.h1 
                className="mt-5 text-4xl md:text-6xl font-extrabold leading-[1.1] text-gradient-animated"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                {ui(activeLang, "AppTitle")}
              </motion.h1>
              
              <motion.p 
                className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {ui(activeLang, "AppTagline")}
              </motion.p>

              <motion.div 
                className="mt-6 flex flex-wrap items-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <Button
                  variant="outline"
                  className="magnetic-hover rounded-xl px-5 py-5 text-base bg-secondary hover:bg-secondary/80 glow-sweep"
                  onClick={() => {
                    try { localStorage.removeItem("km.lang"); } catch {}
                    setGuestLang(null);
                    setSelectedLang("en");
                    setPostGate(false);
                    setGateOpen(true);
                  }}
                >
                  <Languages className="mr-2 h-4 w-4" />
                  {ui(activeLang, "Change Language")}
                </Button>
                <Button
                  className="magnetic-hover rounded-xl px-5 py-5 text-base bg-primary text-primary-foreground hover:opacity-95 animate-shimmer"
                  onClick={() => navigate("/dashboard")}
                >
                  {ui(activeLang, "Open App")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>

              {/* Enhanced Proven impact callout */}
              <motion.div 
                className="mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
              >
                <div className="rounded-2xl p-4 bg-white/10 backdrop-blur-xl border border-transparent ring-1 ring-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:translate-y-[-4px] transition-transform">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Real Impact, No Hype
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Measure your own outcomes over time. Our irrigation guidance uses real weather data and crop profiles to help you make informed decisions. Results vary by farm, soil, and climate.
                  </p>
                </div>
              </motion.div>

              {/* Enhanced stat strip */}
              <motion.div 
                className="mt-6 grid grid-cols-1 gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
              >
                <div className="rounded-2xl p-4 bg-white/10 backdrop-blur-xl border border-transparent ring-1 ring-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:translate-y-[-4px] transition-transform">
                  <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    What you can expect
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                    <li>Weather-informed irrigation suggestions (ET0 and rain) tailored to your chosen crop.</li>
                    <li>Simple per‑farm records to track planting, watering, and harvest actions.</li>
                    <li>Localized experience in your language for key navigation and actions.</li>
                  </ul>
                </div>
                <div className="rounded-2xl p-4 bg-white/10 backdrop-blur-xl border border-transparent ring-1 ring-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:translate-y-[-4px] transition-transform">
                  <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-accent" />
                    Data sources
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Uses Open‑Meteo for weather and ET0, plus your farm inputs. No fabricated metrics are shown. You're encouraged to compare before/after outcomes in your own context.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-transparent bg-white/10 backdrop-blur-md ring-1 ring-white/15 px-3 py-2 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
              >
                <span className="inline-block h-3 w-3 rounded-[4px] bg-primary animate-pulse" />
                {ui(activeLang, "SecurityNote")}
              </motion.div>
            </motion.div>

            {/* Right: Enhanced Visual card */}
            <motion.div 
              className="rounded-3xl p-0 overflow-hidden bg-white/5 backdrop-blur-xl border border-transparent ring-1 ring-white/15 shadow-[0_12px_60px_-10px_rgba(0,0,0,0.25)] transition-all duration-300 will-change-transform hover:-translate-y-2 hover:shadow-[0_24px_80px_-20px_rgba(0,0,0,0.35)] hover:scale-[1.02]"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="h-full min-h-[260px] relative">
                <motion.img
                  src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1600&auto=format&fit=crop"
                  alt="Official meeting photo"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement;
                    if (t.src !== '/logo_bg.png') t.src = '/logo_bg.png';
                    t.onerror = null;
                  }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.35),transparent_40%)]" />
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <div className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-white/10 backdrop-blur-md ring-1 ring-white/15 px-3 py-2 text-xs animate-glow-pulse">
                    <Cpu className="h-3 w-3" />
                    <span className="font-semibold">{ui(activeLang, "Live Tools")}</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Preview Strip */}
      {SHOW_PREVIEW && (
        <section className="mx-auto w-full max-w-6xl px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-center mb-6 text-gradient-animated">Live Farm Intelligence</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {livePreviewTiles.map((tile, index) => {
                const Icon = tile.icon;
                return (
                  <motion.div
                    key={tile.label}
                    className="gradient-border min-w-[140px] p-4 rounded-xl hover-parallax glow-sweep"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    whileHover={{ y: -5 }}
                  >
                    <Icon className={`h-8 w-8 ${tile.color} mb-2 animate-float-slow`} />
                    <div className="text-sm font-medium">{tile.label}</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>
      )}

      {/* Core Tools Hub */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Core Tools Hub
          </h2>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Built for speed • No fluff
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Voice */}
          <div className="rounded-3xl border border-transparent ring-1 ring-white/15 bg-white/10 backdrop-blur-xl p-0 overflow-hidden hover:-translate-y-1 hover:shadow-[0_16px_60px_-16px_rgba(0,0,0,0.3)] transition-all">
            <div className="h-40 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/15" />
              <div className="absolute inset-0 grid place-items-center">
                <Mic className="h-10 w-10 text-primary animate-float-slow" />
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Voice Commands</h3>
                <span className="text-[10px] uppercase text-muted-foreground">Fast</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Navigate and act hands‑free in your language.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  className="rounded-xl"
                  onClick={() => navigate("/dashboard")}
                >
                  Open App <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() => navigate("/settings")}
                >
                  Change Language
                </Button>
              </div>
            </div>
          </div>

          {/* Soil Test */}
          <div className="rounded-3xl border border-transparent ring-1 ring-white/15 bg-white/10 backdrop-blur-xl p-0 overflow-hidden hover:-translate-y-1 hover:shadow-[0_16px_60px_-16px_rgba(0,0,0,0.3)] transition-all">
            <div className="h-40 relative">
              <img
                src="/assets/Soil.webp"
                alt="Soil"
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Soil Test</h3>
                <span className="text-[10px] uppercase text-muted-foreground">Camera</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Upload or capture soil photos for instant insights.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  className="rounded-xl"
                  onClick={() => navigate("/soil-test")}
                >
                  Try Soil Test <Camera className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() => navigate("/learn")}
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>

          {/* My Farm */}
          <div className="rounded-3xl border border-transparent ring-1 ring-white/15 bg-white/10 backdrop-blur-xl p-0 overflow-hidden hover:-translate-y-1 hover:shadow-[0_16px_60px_-16px_rgba(0,0,0,0.3)] transition-all">
            <div className="h-40 relative">
              <img
                src="/assets/Fild.jpeg"
                alt="Farm"
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">My Farm</h3>
                <span className="text-[10px] uppercase text-muted-foreground">Simulate</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Manage farms and run simulations with real weather.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  className="rounded-xl"
                  onClick={() => navigate("/my-farm")}
                >
                  Go to My Farm <Sprout className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() => navigate("/dashboard")}
                >
                  Open App
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Why Root AI */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-transparent ring-1 ring-white/15 bg-white/10 backdrop-blur-xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Irrigation</div>
            <div className="mt-2 font-bold text-lg">Real Weather Advisor</div>
            <p className="text-sm text-muted-foreground mt-1">
              Uses ET0 and rain to guide watering for your chosen crop.
            </p>
          </div>
          <div className="rounded-2xl border border-transparent ring-1 ring-white/15 bg-white/10 backdrop-blur-xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Multilingual</div>
            <div className="mt-2 font-bold text-lg">20+ Languages</div>
            <p className="text-sm text-muted-foreground mt-1">
              A native experience with dynamic language switching.
            </p>
          </div>
          <div className="rounded-2xl border border-transparent ring-1 ring-white/15 bg-white/10 backdrop-blur-xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Privacy</div>
            <div className="mt-2 font-bold text-lg">Your Data, Yours</div>
            <p className="text-sm text-muted-foreground mt-1">
              No hype. Clear sources and transparent outcomes.
            </p>
          </div>
        </div>
      </section>

      {/* Enhanced CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-24">
        <motion.div 
          className="rounded-3xl p-8 text-center bg-white/10 backdrop-blur-xl border border-transparent ring-1 ring-white/20 shadow-[0_12px_60px_-10px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-all"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.02 }}
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-extrabold text-gradient-animated"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {ui(activeLang, "Start with your voice")}
          </motion.h2>
          <motion.p 
            className="text-muted-foreground mt-2 text-lg"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            {ui(activeLang, "Voice CTA")}
          </motion.p>
          {!postGate && (
            <motion.div 
              className="mt-6 flex items-center justify-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <Button 
                className="magnetic-hover rounded-xl px-6 py-6 text-lg animate-shimmer" 
                onClick={() => navigate("/dashboard")}
              >
                <Zap className="mr-2 h-5 w-5" />
                {ui(activeLang, "Get Started")}
              </Button>
              <Button 
                variant="secondary" 
                className="magnetic-hover rounded-xl px-6 py-6 text-lg glow-sweep" 
                onClick={() => navigate("/soil-test")}
              >
                <Camera className="mr-2 h-5 w-5" />
                {ui(activeLang, "Try Soil Test")}
              </Button>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Enhanced Official Footer */}
      <section className="border-t bg-card/60 relative">
        {/* Animated gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary animate-gradient-shift" />
        
        <div className="mx-auto w-full max-w-6xl px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 relative">
              {/* Soft glow behind logo */}
              <div className="absolute -inset-2 bg-primary/10 rounded-lg blur-lg animate-glow-pulse" />
              <img
                src="/logo.svg"
                alt="Root AI"
                className="relative h-10 w-10 rounded-xl border border-transparent ring-1 ring-white/20 object-cover animate-float-slow"
                onError={(e) => {
                  const t = e.currentTarget as HTMLImageElement;
                  if (t.src !== '/logo.png') t.src = '/logo.png';
                  t.onerror = null;
                }}
              />
              <span className="relative font-extrabold tracking-wide text-gradient-animated">Root AI</span>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Helping farms grow smarter with AI-driven insights, localized experience, and real-time tools.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-transparent bg-white/10 backdrop-blur-md ring-1 ring-white/15 px-3 py-2 text-xs">
              <span className="inline-block h-3 w-3 rounded-[4px] bg-primary animate-pulse" />
              Private & secure. You control your data.
            </div>
          </motion.div>

          {[
            {
              title: "Product",
              links: [
                { label: "Dashboard", href: "/dashboard" },
                { label: "My Farm", href: "/my-farm" },
                { label: "Soil Test", href: "/soil-test" },
                { label: "Market", href: "/market" }
              ]
            },
            {
              title: "Company", 
              links: [
                { label: "Our Mission", href: "/our-mission" },
                { label: "Our Team", href: "/our-team" },
                { label: "Future Plan", href: "/future-plan" }
              ]
            },
            {
              title: "Resources",
              links: [
                { label: "Frequently Asked Questions", href: "/#faq" },
                { label: "Learn", href: "/learn" },
                { label: "Community", href: "/community" },
                { label: "Settings", href: "/settings" }
              ]
            }
          ].map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (index + 1) * 0.1 }}
            >
              <div className="text-sm font-semibold mb-3">{section.title}</div>
              <ul className="space-y-2 text-sm">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="hover:underline hover:text-primary transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="border-t">
          <motion.div 
            className="mx-auto w-full max-w-6xl px-4 py-4 text-xs flex flex-col md:flex-row items-center justify-between gap-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-muted-foreground">© {new Date().getFullYear()} Root AI. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <a href="/#faq" className="hover:underline hover:text-primary transition-colors">FAQs</a>
              <a href="#" className="hover:underline hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:underline hover:text-primary transition-colors">Terms</a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}