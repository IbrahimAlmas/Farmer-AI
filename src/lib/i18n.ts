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
  | "bho";

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
  { key: "bho", locale: "hi-IN", label: "भोजपुरी" }, // fallback locale for Bhojpuri
  { key: "en", locale: "en-IN", label: "English" },
];

// Map Indian states to preferred language keys (simplified; users can override)
export const StateToLang: Record<string, LangKey> = {
  "Tamil Nadu": "ta",
  "Puducherry": "ta",
  "Andhra Pradesh": "te",
  "Telangana": "te",
  Kerala: "ml",
  Karnataka: "kn",
  "West Bengal": "bn",
  Maharashtra: "mr",
  Gujarat: "gu",
  Punjab: "pa",
  "Odisha": "or",
  Assam: "as",
  Bihar: "bho",
  Jharkhand: "hi",
  "Uttar Pradesh": "hi",
  "Madhya Pradesh": "hi",
  Rajasthan: "hi",
  "Himachal Pradesh": "hi",
  "Uttarakhand": "hi",
  Haryana: "hi",
  "Jammu and Kashmir": "hi",
  "Arunachal Pradesh": "as",
  Manipur: "as",
  Meghalaya: "as",
  Mizoram: "as",
  Nagaland: "as",
  Tripura: "bn",
  Chhattisgarh: "hi",
  "Andaman and Nicobar Islands": "hi",
  "Dadra and Nagar Haveli and Daman and Diu": "gu",
  Ladakh: "hi",
  Goa: "mr",
  Sikkim: "hi",
  Delhi: "hi",
};

// Minimal translations for onboarding and UI labels
export const t = (lang: LangKey) => {
  const dict: Record<string, string> = {
    "title.welcome":
      lang === "ta"
        ? "வணக்கம்! நான் உங்கள் விவசாய உதவியாளர். பேசிக்கொண்டு வழிநடத்துவேன்."
        : lang === "hi"
        ? "नमस्ते! मैं आपका खेती सहायक हूँ। बात करके मार्गदर्शन करूंगा।"
        : "Hello! I’m your farming assistant. I can guide you by talking.",
    "prompt.name": lang === "ta" ? "என் பெயர் கிருஷிமித்ரா!" : lang === "hi" ? "मेरा नाम कृषिमित्रा है!" : "My name is KrishiMitra!",
    "prompt.tutorial":
      lang === "ta"
        ? "இந்த செயலியை எப்படி பயன்படுத்துவது பற்றி குறும் பாடக்குறிப்பு பார்க்க விரும்புகிறீர்களா?"
        : lang === "hi"
        ? "क्या आप ऐप का छोटा ट्यूटोरियल देखना चाहेंगे?"
        : "Would you like to see a short tutorial on how to use this app?",
    "choice.yes": lang === "ta" ? "ஆமா" : lang === "hi" ? "हाँ" : "Yes",
    "choice.no": lang === "ta" ? "இல்லை" : lang === "hi" ? "नहीं" : "No",
    "ui.detecting": lang === "ta" ? "மொழியை கண்டறிகிறது..." : lang === "hi" ? "भाषा पहचान हो रही है..." : "Detecting language...",
    "ui.pickLanguage":
      lang === "ta" ? "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்" : lang === "hi" ? "अपनी भाषा चुनें" : "Pick your language",
    "ui.mic.hold": lang === "ta" ? "பேச குரல் பொத்தானை அழுத்தி பிடியுங்கள்" : lang === "hi" ? "बोलने के लिए माइक्रोफोन दबाकर रखें" : "Hold mic to speak",
  };
  return (key: keyof typeof dict) => dict[key] ?? key;
};

export function localeFromLang(key: LangKey): Locale {
  return SupportedLanguages.find((l) => l.key === key)?.locale ?? "en-IN";
}

export function langFromNavigator(): LangKey {
  const nav = navigator.language || "en-IN";
  const short = nav.split("-")[0] as LangKey;
  const match = SupportedLanguages.find((l) => l.key === short);
  return match ? match.key : "en";
}

export async function langFromGeolocation(): Promise<LangKey | null> {
  if (!("geolocation" in navigator)) return null;
  const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 }),
  ).catch(() => null);
  if (!pos) return null;
  const { latitude, longitude } = pos.coords;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=en`,
      { headers: { "User-Agent": "KrishiMitra/1.0 (+https://example.com)" } },
    );
    const data = await res.json();
    const state: string | undefined = data?.address?.state;
    if (!state) return null;
    for (const [s, l] of Object.entries(StateToLang)) {
      if (state.includes(s)) return l;
    }
    return null;
  } catch {
    return null;
  }
}
