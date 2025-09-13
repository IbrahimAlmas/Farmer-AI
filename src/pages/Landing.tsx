import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Mic, Sprout, Camera, ShoppingCart, Languages, ShieldCheck, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useMemo, useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import LanguageSelect from "@/components/LanguageSelect";
import { useAction, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

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
        // Ensure second landing (Back / Continue) appears when a guest language is already saved
        if (!profile) {
          setPostGate(true);
        }
      } else {
        // If user not authenticated or profile prefers en, prompt selection once
        if (!profile) {
          setGateOpen(true);
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
    ta: "வணக்கம்! நான் கிருஷிமித்ரா, உங்கள் விவசாய உதவியாளர்!",
    te: "నమస్కారం! నేను కృషిమిత్ర, మీ వ్యవసాయ సహాయకుడు!",
    ml: "നമസ്കാരं! ഞാൻ കൃഷിമിത്ര, നിങ്ങളുടെ കൃഷി സഹായി!",
    kn: "ನಮಸ್ಕಾರ! ನಾನು ಕೃಷಿಮಿತ್ರ, ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕ!",
    hi: "नमस्कार! मैं कृषिमित्र, आपका कृषि सहायक हूँ!",
    bn: "নমস্কার! আমি কৃষিমিত্র, আপনার কৃষি সহকারী!",
    mr: "नमस्कार! मी कृषीमित्र, तुमचा शेती सहाय्यक!",
    gu: "નમસ્કાર! હું કૃષિમિત્ર, તમારો કૃષિ સહાયક!",
    pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਕ੍ਰਿਸ਼ੀਮਿਤ੍ਰ, ਤੁਹਾਡਾ ਖੇਤੀ ਸਹਾਇਕ!",
    or: "ନମସ୍କାର! ମୁଁ କୃଷିମିତ୍ର, ଆପଣଙ୍କ କୃଷି ସହାୟକ!",
    as: "নমস্কাৰ! মই কৃষিমিত্ৰ, আপোনাৰ কৃষি সহায়ক!",
    bho: "प्रणाम! हम कृषिमित्र, तोहार खेती सहायक बानी!",
    en: "Hello! I am KrishiMitra, your farming assistant!",
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
        "KrishiMitra — Your Voice‑First Farming Companion": "కృషిమిత్ర — మీ వాయిస్‑ఫస్ట్ వ్యవసాయ సహాయకుడు",
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

  if (gateOpen) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-black">
        {/* Live rotating background images + vignette */}
        <div className="absolute inset-0 z-0">
          {/* Cross-fade stack */}
          <div className="absolute inset-0">
            {bgImages.map((src, i) => (
              <img
                key={src}
                src={src}
                alt="Farm fields"
                className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${bgIndex === i ? "opacity-100" : "opacity-0"}`}
                loading={i === 0 ? "eager" : "lazy"}
                onError={(e) => {
                  const t = e.currentTarget as HTMLImageElement;
                  if (t.src !== "/logo_bg.svg") t.src = "/logo_bg.svg";
                  t.onerror = null;
                }}
              />
            ))}
          </div>
        </div>
        {/* Lighten overlay so the image is visible on mobile too */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-black/35 to-black/55" />

        {/* Edge-to-edge background sweep (amber->purple) */}
        <div className="absolute inset-0 z-20 bg-gradient-to-br from-amber-500/30 via-transparent to-primary/30" />
        {/* Decorative flowing wave like reference */}
        <div className="pointer-events-none absolute inset-0 z-20 opacity-90">
          <svg viewBox="0 0 1440 700" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
            <defs>
              <linearGradient id="gateSweep" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.22 80)" />
                <stop offset="50%" stopColor="oklch(0.70 0.22 300)" />
                <stop offset="100%" stopColor="oklch(0.66 0.16 260)" />
              </linearGradient>
            </defs>
            <path
              d="M0,520 C240,420 360,200 700,240 C1040,280 1160,140 1440,220 L1440,700 L0,700 Z"
              fill="url(#gateSweep)"
              opacity="0.25"
            />
            <path
              d="M0,560 C220,560 420,360 720,380 C1020,400 1180,260 1440,320 L1440,700 L0,700 Z"
              fill="url(#gateSweep)"
              opacity="0.18"
            />
          </svg>
        </div>

        {/* Top bar (compact, mobile-first) */}
        <div className="relative z-30 px-4 pt-[env(safe-area-inset-top)] pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="KrishiMitra" className="h-9 w-9 rounded-xl shadow" />
            <span className="text-xs uppercase tracking-wide text-white/80">KrishiMitra</span>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-[11px] text-white/70">
            <span className="hidden md:inline">Home</span>
            <span className="hidden md:inline">About</span>
            <span className="hidden md:inline">Help</span>
          </div>
        </div>

        {/* Slides */}
        <div className="relative z-30 mx-auto max-w-md px-4">
          {gateSlide === 0 ? (
            <motion.div
              key="welcome-full"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-12 text-center"
            >
              <h1 className="text-[34px] sm:text-[44px] font-extrabold leading-tight tracking-tight">
                <span className="bg-gradient-to-r from-amber-400 via-white to-cyan-300 bg-clip-text text-transparent">
                  Welcome.
                </span>
              </h1>
              <p className="mt-2 text-lg sm:text-2xl font-semibold text-white">Landing Page Design</p>
              <p className="mt-3 text-sm sm:text-base text-white/70 max-w-xl">
                Choose your preferred language to personalize a smooth, voice‑first experience.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center">
                <Button
                  className="rounded-2xl px-6 py-5 text-base bg-gradient-to-r from-amber-500 via-primary to-cyan-500 text-primary-foreground hover:opacity-90 w-full sm:w-auto"
                  onClick={() => setGateSlide(1)}
                >
                  Next: Choose Language
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl px-6 py-5 text-base border-white/30 text-white hover:bg-white/10 w-full sm:w-auto"
                  onClick={playIntro}
                >
                  Intro Voice
                </Button>
              </div>

              {/* Privacy pill */}
              <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 backdrop-blur px-3 py-2 text-sm text-white/90 mx-auto">
                Private & secure. You control your data.
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="language-full"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-10 pb-6 text-center"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Choose your language</h2>
              <p className="mt-2 text-sm sm:text-base text-white/70 max-w-xl">
                Select your preferred language to personalize the experience.
              </p>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 justify-items-center">
                {langOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedLang(opt.value)}
                    className={`w-full rounded-2xl border bg-white/5 backdrop-blur px-4 py-4 text-sm text-white transition active:scale-[0.99] ${
                      selectedLang === opt.value
                        ? "border-primary text-primary shadow-sm ring-1 ring-primary/40"
                        : "border-white/15 hover:bg-white/10"
                    }`}
                    aria-pressed={selectedLang === opt.value}
                    aria-label={`Select ${opt.label}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center">
                <Button
                  variant="outline"
                  className="rounded-2xl px-6 py-5 text-base border-white/30 text-white hover:bg-white/10 w-full sm:w-auto"
                  onClick={() => setGateSlide(0)}
                >
                  Back
                </Button>
                <Button
                  className="rounded-2xl px-6 py-5 text-base bg-gradient-to-r from-amber-500 via-primary to-cyan-500 text-primary-foreground hover:opacity-90 w-full sm:w-auto"
                  onClick={confirmLanguage}
                >
                  Continue
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl px-6 py-5 text-base border-white/30 text-white hover:bg-white/10 w-full sm:w-auto"
                  onClick={playIntro}
                >
                  Preview Voice
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Slide dots centered near bottom */}
        <div className="relative z-30 absolute inset-x-0 bottom-8 mb-[env(safe-area-inset-bottom)] flex items-center justify-center gap-2">
          <button
            aria-label="Welcome slide"
            onClick={() => setGateSlide(0)}
            className={`h-2.5 rounded-full transition-all ${gateSlide === 0 ? "bg-amber-400 w-6" : "bg-white/40 w-2.5"}`}
          />
          <button
            aria-label="Language slide"
            onClick={() => setGateSlide(1)}
            className={`h-2.5 rounded-full transition-all ${gateSlide === 1 ? "bg-cyan-400 w-6" : "bg-white/40 w-2.5"}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* REPLACED: static background image with rotating live background */}
        <div className="absolute inset-0 z-0">
          {/* Cross-fade rotating images */}
          <div className="absolute inset-0">
            {bgImages.map((src, i) => (
              <img
                key={src}
                src={src}
                alt="Hero background"
                className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${bgIndex === i ? "opacity-100" : "opacity-0"}`}
                loading={i === 0 ? "eager" : "lazy"}
                onError={(e) => {
                  const t = e.currentTarget as HTMLImageElement;
                  if (t.src !== "/logo_bg.svg") t.src = "/logo_bg.svg";
                  t.onerror = null;
                }}
              />
            ))}
          </div>
          {/* Vignette + gradient overlays */}
          <div className="absolute inset-0 z-10 bg-black/40" />
          <div className="absolute inset-0 z-20 bg-gradient-to-b from-background/50 via-background/70 to-background" />
        </div>
        <div className="relative z-30 mx-auto w-full max-w-5xl px-4 pt-24 pb-16">
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
              <img src="/logo.svg" alt="Farmers Hub" className="h-14 w-14 rounded-xl shadow" />
            </div>
            <h1 className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
              {tr("KrishiMitra — Your Voice‑First Farming Companion")}
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {tr("Speak in your language, manage farms, test soil with camera, and track market prices — all in a simple, mobile‑first app.")}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              {postGate ? (
                <>
                  <Button
                    variant="outline"
                    className="rounded-2xl px-5 py-5 text-base"
                    onClick={() => {
                      // Go back to language selection page
                      try {
                        localStorage.removeItem("km.lang");
                      } catch {
                        // ignore storage errors
                      }
                      setGuestLang(null);
                      setSelectedLang("en");
                      setPostGate(false);
                      setGateOpen(true);
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    className="rounded-2xl px-5 py-5 text-base"
                    onClick={() => navigate("/dashboard")}
                  >
                    Continue to App <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button className="rounded-2xl px-5 py-5 text-base" onClick={() => navigate("/dashboard")}>
                    {tr("Open App")} <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button variant="secondary" className="rounded-2xl px-5 py-5 text-base" onClick={() => navigate("/market")}>
                    {tr("See Market Prices")}
                  </Button>
                  <Button variant="outline" className="rounded-2xl px-5 py-5 text-base" onClick={playIntro}>
                    Intro Voice
                  </Button>
                </>
              )}
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
              {!postGate && (
                <div className="mt-4">
                  <Button variant="outline" className="rounded-2xl" onClick={() => navigate("/my-farm")}>
                    {tr("Go to My Farm")}
                  </Button>
                </div>
              )}
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
              {!postGate && (
                <div className="mt-4">
                  <Button variant="outline" className="rounded-2xl" onClick={() => navigate("/settings")}>
                    {tr("Set Language")}
                  </Button>
                </div>
              )}
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
          {!postGate && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button className="rounded-2xl px-5 py-5 text-base" onClick={() => navigate("/dashboard")}>
                {tr("Get Started")} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="secondary" className="rounded-2xl px-5 py-5 text-base" onClick={() => navigate("/soil-test")}>
                {tr("Try Soil Test")}
              </Button>
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
}