export type LangKey =
  | "en"
  | "hi"
  | "ta"
  | "te"
  | "ml"
  | "kn"
  | "bn"
  | "mr"
  | "gu"
  | "pa"
  | "or"
  | "as"
  | "bho"
  | "ur"
  | "ne"
  | "si"
  | "mai"
  | "kok"
  | "sd"
  | "ks";

export type Locale = `${LangKey}-IN` | "en-IN";

export const SupportedLanguages: Array<{ key: LangKey; locale: Locale; label: string }> = [
  { key: "hi", locale: "hi-IN", label: "हिन्दी" },
  { key: "ta", locale: "ta-IN", label: "தமிழ்" },
  { key: "te", locale: "te-IN", label: "తెలుగు" },
  { key: "ml", locale: "ml-IN", label: "മലയാളം" },
  { key: "kn", locale: "kn-IN", label: "ಕನ್ನಡ" },
  { key: "bn", locale: "bn-IN", label: "বাংলা" },
  { key: "mr", locale: "mr-IN", label: "मराठी" },
  { key: "gu", locale: "gu-IN", label: "ગુજરાતી" },
  { key: "pa", locale: "pa-IN", label: "ਪੰਜਾਬੀ" },
  { key: "or", locale: "or-IN", label: "ଓଡ଼ିଆ" },
  { key: "as", locale: "as-IN", label: "অসমীয়া" },
  // Fallback locales for some regional languages
  { key: "bho", locale: "hi-IN", label: "भोजपुरी" },
  { key: "ur", locale: "hi-IN", label: "اردو" },
  { key: "ne", locale: "hi-IN", label: "नेपाली" },
  { key: "si", locale: "hi-IN", label: "සිංහල" },
  { key: "mai", locale: "hi-IN", label: "मैथिली" },
  { key: "kok", locale: "mr-IN", label: "कोंकणी" },
  { key: "sd", locale: "hi-IN", label: "سنڌي" },
  { key: "ks", locale: "hi-IN", label: "کٲشُر" },
  { key: "en", locale: "en-IN", label: "English" },
];

// Helper: map a language key to the best-fit locale (used by TTS/STT)
export function localeFromLang(lang: LangKey): Locale {
  const found = SupportedLanguages.find((l) => l.key === lang);
  return found?.locale ?? "en-IN";
}

/* Add compatibility helpers and broader i18n utilities */
/* Add compatibility helpers and broader i18n utilities */
// Support both styles: t(lang)('Key') and t(lang, 'Key')
export function t(lang: LangKey): (key: string) => string;
export function t(lang: LangKey, key: string): string;
export function t(lang: LangKey, key?: string) {
  if (typeof key === "string") {
    return ui(lang, key as any);
  }
  return (k: string) => ui(lang, k as any);
}

export function langFromNavigator(navLang?: string): LangKey {
  const l = String(
    navLang ?? (typeof navigator !== "undefined" ? navigator.language : "")
  ).toLowerCase();
  const known: Array<LangKey> = [
    "hi","ta","te","ml","kn","bn","mr","gu","pa","or","as",
    "bho","ur","ne","si","mai","kok","sd","ks","en",
  ];
  const found = known.find((k) => l.startsWith(k));
  return (found ?? "en") as LangKey;
}

export function langFromGeolocation(state?: string | null, district?: string | null): LangKey | null {
  if (!state) return null;
  const s = state.toLowerCase();
  const map: Record<string, LangKey> = {
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
    "bihar": "hi",
    "madhya pradesh": "hi",
    "rajasthan": "hi",
    "chandigarh": "hi",
    "goa": "mr",
    "jammu and kashmir": "ks",
    "ladakh": "ks",
  };
  return map[s] ?? null;
}

type UIKey =
  | "Farming Companion"
  | "AppTitle"
  | "AppTagline"
  | "Change Language"
  | "Open App"
  | "SecurityNote"
  | "Live Tools"
  | "Voice"
  | "Home"
  | "Farm"
  | "Tasks"
  | "Soil"
  | "Market"
  | "Learn"
  | "Community"
  | "Settings"
  | "Create Community"
  | "Back"
  | "Continue"
  | "Manage Farms & Simulate Growth"
  | "Manage Farms Desc"
  | "Go to My Farm"
  | "Local Language Experience"
  | "Local Language Desc"
  | "Set Language"
  | "Start with your voice"
  | "Voice CTA"
  | "Get Started"
  | "Try Soil Test"
  | "Our Team"
  | "Our Mission"
  | "Future Plan"
  | "Voice‑First & Multilingual"
  | "Voice Feature Desc"
  | "Camera‑Powered Soil Test"
  | "Camera Feature Desc"
  | "Region‑Aware Market Prices"
  | "Market Feature Desc"
  | "Choose Language"
  | "Select Preferred Language"
  | "Language Change Note";

/**
 * UI helper for localized strings with sensible fallbacks.
 * Returns the string in the selected language if available, otherwise English, otherwise the key.
 */
export function ui(lang: LangKey, key: UIKey): string {
  const fallback = UI_DICTIONARY.en?.[key] ?? key;
  return UI_DICTIONARY[lang]?.[key] ?? fallback;
}

const UI_DICTIONARY: Partial<Record<LangKey, Partial<Record<UIKey, string>>>> = {
  en: {
    "Farming Companion": "Farming Companion",
    AppTitle: "Root AI — Farming, Simplified.",
    AppTagline:
      "Speak in your language, manage farms, test soil with camera, and track market prices — all in a simple, fast experience.",
    "Change Language": "Change Language",
    "Open App": "Open App",
    SecurityNote: "Private & secure. You control your data.",
    "Live Tools": "Live Tools — Voice, Soil Test, Market",
    Voice: "Voice",
    Home: "Home",
    Farm: "Farm",
    Tasks: "Tasks",
    Soil: "Soil",
    Market: "Market",
    Learn: "Learn",
    Community: "Community",
    Settings: "Settings",
    "Create Community": "Create Community",
    Back: "Back",
    Continue: "Continue",
    "Manage Farms & Simulate Growth": "Manage Farms & Simulate Growth",
    "Manage Farms Desc":
      "Add farms, capture 3D context, and run per‑farm simulations: plant, water, advance, harvest.",
    "Go to My Farm": "Go to My Farm",
    "Local Language Experience": "Local Language Experience",
    "Local Language Desc":
      "Choose your preferred language from Settings. Navigation adapts automatically.",
    "Set Language": "Set Language",
    "Start with your voice": "Start with your voice",
    "Voice CTA":
      "Say \"Open Market\", \"Add Task\", or \"Test Soil\" — it's that simple.",
    "Get Started": "Get Started",
    "Try Soil Test": "Try Soil Test",
    "Our Team": "Our Team",
    "Our Mission": "Our Mission",
    "Future Plan": "Future Plan",
    "Voice‑First & Multilingual": "Voice‑First & Multilingual",
    "Voice Feature Desc":
      "Navigate, add tasks, and get answers with your voice in Telugu, Hindi, English, and more.",
    "Camera‑Powered Soil Test": "Camera‑Powered Soil Test",
    "Camera Feature Desc":
      "Click or upload soil photos for instant AI insights and actionable recommendations.",
    "Region‑Aware Market Prices": "Region‑Aware Market Prices",
    "Market Feature Desc":
      "See indicative local retail prices (₹/kg) for vegetables in your state.",
    "Choose Language": "Choose your language",
    "Select Preferred Language": "Select your preferred language",
    "Language Change Note": "You can change this anytime from Settings.",
  },
  hi: {
    "Farming Companion": "कृषि सहायक",
    AppTitle: "Root AI — खेती, आसान.",
    AppTagline:
      "अपनी भाषा में बोलें, खेत प्रबंधित करें, कैमरे से मिट्टी जाँचें और बाज़ार कीमतें देखें — सब कुछ सरल और तेज़ अनुभव में।",
    "Change Language": "भाषा बदलें",
    "Open App": "ऐप खोलें",
    SecurityNote: "निजी और सुरक्षित। आपका डेटा आपके नियंत्रण में है।",
    "Live Tools": "लाइव टूल्स — वॉइस, मिट्टी जाँच, बाज़ार",
    Voice: "आवाज़",
    Home: "होम",
    Farm: "खेत",
    Tasks: "कार्य",
    Soil: "मिट्टी",
    Market: "बाज़ार",
    Learn: "सीखें",
    Community: "समुदाय",
    Settings: "सेटिंग्स",
    "Create Community": "समुदाय बनाएँ",
    Back: "वापस",
    Continue: "जारी रखें",
    "Manage Farms & Simulate Growth": "खेत प्रबंधन और वृद्धि सिमुलेशन",
    "Manage Farms Desc":
      "खेत जोड़ें, 3D संदर्भ कैप्चर करें, और प्रति‑खेत सिमुलेशन चलाएँ: बोना, सिंचाई, आगे बढ़ाना, फसल काटना।",
    "Go to My Farm": "मेरे खेत पर जाएँ",
    "Local Language Experience": "स्थानीय भाषा अनुभव",
    "Local Language Desc":
      "सेटिंग्स से अपनी भाषा चुनें। नेविगेशन स्वतः अनुकूलित होगा।",
    "Set Language": "भाषा सेट करें",
    "Start with your voice": "अपनी आवाज़ से शुरू करें",
    "Voice CTA": `“ओपन मार्केट”, "एड टास्क", या "टेस्ट सॉइल" कहें — बस इतना ही।`,
    "Get Started": "शुरू करें",
    "Try Soil Test": "मिट्टी परीक्षण आज़माएँ",
    "Our Team": "हमारी टीम",
    "Our Mission": "हमारा मिशन",
    "Future Plan": "भविष्य की योजना",
    "Voice‑First & Multilingual": "वॉइस‑फर्स्ट और बहुभाषी",
    "Voice Feature Desc":
      "तेलुगु, हिंदी, अंग्रेज़ी और अन्य भाषाओं में अपनी आवाज़ से नेविगेट करें, कार्य जोड़ें और उत्तर पाएं।",
    "Camera‑Powered Soil Test": "कैमरा‑संचालित मिट्टी परीक्षण",
    "Camera Feature Desc":
      "तुरंत AI इनसाइट्स और सुझावों के लिए मिट्टी की फोटो क्लिक करें या अपलोड करें।",
    "Region‑Aware Market Prices": "क्षेत्र‑आधारित बाजार भाव",
    "Market Feature Desc":
      "अपने राज्य के लिए सब्जियों के संकेतात्मक स्थानीय खुदरा भाव (₹/किलो) देखें।",
    "Choose Language": "अपनी भाषा चुनें",
    "Select Preferred Language": "अपनी पसंदीदा भाषा चुनें",
    "Language Change Note": "आप इसे किसी भी समय सेटिंग्स से बदल सकते हैं।",
  },

  // Other languages will fall back to English until translations are provided
  ta: {},
  te: {},
  ml: {},
  kn: {},
  bn: {},
  mr: {},
  gu: {},
  pa: {},
  or: {},
  as: {},
  bho: {},
  ur: {},
  ne: {},
  si: {},
  mai: {},
  kok: {},
  sd: {},
  ks: {},
};