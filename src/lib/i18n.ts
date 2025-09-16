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
  // South Asian + English
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
  { key: "ur", locale: "hi-IN", label: "اردو" }, // using hi-IN as closest fallback locale
  { key: "ne", locale: "hi-IN", label: "नेपाली" },
  { key: "si", locale: "hi-IN", label: "සිංහල" },
  { key: "mai", locale: "hi-IN", label: "मैथिली" },
  { key: "kok", locale: "mr-IN", label: "कोंकणी" },
  { key: "sd", locale: "hi-IN", label: "سنڌي" },
  { key: "ks", locale: "hi-IN", label: "کٲشُر" },
  { key: "en", locale: "en-IN", label: "English" },
];

/**
 * UI helper for localized strings with sensible fallbacks.
 * Returns the string in the selected language if available, otherwise English, otherwise the key.
 */
export function ui(
  lang: LangKey,
  key:
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
): string {
  const fallback = UI_DICTIONARY.en?.[key] ?? key;
  return UI_DICTIONARY[lang]?.[key] ?? fallback;
}

const UI_DICTIONARY: Partial<Record<
  LangKey,
  Record<
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
  , string>
>> = {
  en: {
    "Farming Companion": "Farming Companion",
    AppTitle: "Root AI — Farming, Simplified.",
    AppTagline: "Speak in your language, manage farms, test soil with camera, and track market prices — all in a simple, fast experience.",
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
    "Manage Farms Desc": "Add farms, capture 3D context, and run per‑farm simulations: plant, water, advance, harvest.",
    "Go to My Farm": "Go to My Farm",
    "Local Language Experience": "Local Language Experience",
    "Local Language Desc": "Choose your preferred language from Settings. Navigation adapts automatically.",
    "Set Language": "Set Language",
    "Start with your voice": "Start with your voice",
    "Voice CTA": "Say \"Open Market\", \"Add Task\", or \"Test Soil\" — it's that simple.",
    "Get Started": "Get Started",
    "Try Soil Test": "Try Soil Test",
  },
  hi: {
    "Farming Companion": "कृषि सहायक",
    AppTitle: "Root AI — खेती, आसान.",
    AppTagline: "अपनी भाषा में बोलें, खेत प्रबंधित करें, कैमरे से मिट्टी जाँचें और बाज़ार कीमतें देखें — सब कुछ सरल और तेज़ अनुभव में।",
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
    "Manage Farms Desc": "खेत जोड़ें, 3D संदर्भ कैप्चर करें, और प्रति‑खेत सिमुलेशन चलाएँ: बोना, सिंचाई, आगे बढ़ाना, फसल काटना।",
    "Go to My Farm": "मेरे खेत पर जाएँ",
    "Local Language Experience": "स्थानीय भाषा अनुभव",
    "Local Language Desc": "सेटिंग्स से अपनी भाषा चुनें। नेविगेशन स्वतः अनुकूलित होगा।",
    "Set Language": "भाषा सेट करें",
    "Start with your voice": "Start with your voice",
    "Voice CTA": "Say \"Open Market\", \"Add Task\", or \"Test Soil\" — it's that simple.",
    "Get Started": "Get Started",
    "Try Soil Test": "Try Soil Test",
  },
  ta: {
    "Farming Companion": "விவசாய துணை",
    AppTitle: "Root AI — வேளாண்மை, எளிமை.",
    AppTagline: "உங்கள் மொழியில் பேசுங்கள், பண்ணைகளை நிர்வகிக்கவும், கேமராவால் மண் பரிசோதிக்கவும், சந்தை விலைகளைப் பாருங்கள் — இவை அனைத்தும் எளிதான, விரைவான அனுபவத்தில்.",
    "Change Language": "மொழி மாற்று",
    "Open App": "அப் திறக்க",
    SecurityNote: "தனியுரிமை மற்றும் பாதுகாப்பு. உங்கள் தரவு உங்கள் கட்டுப்பாட்டில்.",
    "Live Tools": "நேரடி கருவிகள் — குரல், மண் பரிசோதனை, சந்தை",
    Voice: "குரல்",
    Home: "முகப்பு",
    Farm: "பண்ணை",
    Tasks: "பணிகள்",
    Soil: "மண்",
    Market: "சந்தை",
    Learn: "கற்பது",
    Community: "சமூகம்",
    Settings: "அமைப்புகள்",
    "Create Community": "சமூகத்தை உருவாக்கு",
    Back: "பின்",
    Continue: "தொடர",
    "Manage Farms & Simulate Growth": "பண்ணை மேலாண்மை & வளர்ச்சி ஒழுங்குபடுத்தல்",
    "Manage Farms Desc": "பண்ணைகளைச் சேர்த்து, 3D சூழலைப் பதிவு செய்து, ஒவ்வொரு பண்ணைக்கும் சாகுபடி, நீர்ப்பாய்ச்சி, முன்னேற்றம், அறுவடை ஆகியவற்றை இயக்கவும்.",
    "Go to My Farm": "என் பண்ணைக்கு செல்ல",
    "Local Language Experience": "உள்ளூர் மொழி அனுபவம்",
    "Local Language Desc": "அமைப்புகளில் உங்கள் மொழியைத் தேர்ந்தெடுக்கவும். வழிசெலுத்தல் தானாக ஒத்துப்போகும்.",
    "Set Language": "மொழி அமை",
    "Start with your voice": "உங்கள் குரலுடன் தொடங்குங்கள்",
    "Voice CTA": "\"சந்தை தெரெயியும்\", \"கார் சேர்\", அல்லென்று \"மண் பரிசோதனை\" என்று சொல்லுங்கள் — அத்துவம் எளிது.",
    "Get Started": "தொடங்கு",
    "Try Soil Test": "மண் பரிசோதனை முயற்சி",
  },
  te: {
    "Farming Companion": "వ్యవసాయ సహాయకుడు",
    AppTitle: "Root AI — వ్యవసాయం, సులభం.",
    AppTagline: "మీ భాషలో మాతనాడండి, ఫార్మ్‌లను నిర్వహించండి, కెమెరాతో మట్టి పరీక్ష చేయండి, మారుకಟ్టె బెలెగలను నోడి — ఒరే సరళ, వేగవంతమైన అనుభవంలో.",
    "Change Language": "భాష మార్చండి",
    "Open App": "యాప్ ఓపెన్ చేయండి",
    SecurityNote: "ప్రైవేట్ & సురక్షితం. మీ డేటాపై మీ నియంత్రణ.",
    "Live Tools": "లైవ్ టూల్స్ — వాయిస్, మట్టి పరీక్ష, మారుకಟ్టె",
    Voice: "వాయిస్",
    Home: "హోమ్",
    Farm: "పంటభూమి",
    Tasks: "పనులు",
    Soil: "మట్టి",
    Market: "మారుకట్టె",
    Learn: "కలియుకోండి",
    Community: "సమూహం",
    Settings: "సెట్టింగ్స్",
    "Create Community": "సమూహాన్ని సృష్టించండి",
    Back: "వెనక్కి",
    Continue: "కొనసాగించు",
    "Manage Farms & Simulate Growth": "ఫార్మ్‌లు నిర్వహించండి & పెరుగుదల సిమ్యులేట్ చేయండి",
    "Manage Farms Desc": "ఫార్మ్‌లు జోడించండి, 3D సందర్భ క్యాప్చర్ చేయండి, ప్రతి ఫార్మ్‌కు నాటడం, నీరు పెట్టడం, ముందుకు తీసుకెళ్లడం, కోత వంటివి నడపండి.",
    "Go to My Farm": "నా ఫార్మ్‌కి వెళ్ళండి",
    "Local Language Experience": "స్థానిక భాషా అనుభవం",
    "Local Language Desc": "సెట్టింగ్స్‌లో మీకు నచ్చిన భాషను ఎంచుకోండి. నావిగేషన్ ఆటోమేటిక్‌గా సరిపోతుంది.",
    "Set Language": "భాషను సెట్ చేయండి",
    "Start with your voice": "నిమ్మ ధ్వని‌తో ప్రారంభించండి",
    "Voice CTA": "\"మారుకట్టె తెరెయి\", \"కార్య జోడించు\", లేదా \"మట్టి పరీక్ష\" అని చెప్పండి — అంతే చాలు.",
    "Get Started": "ప్రారంభించండి",
    "Try Soil Test": "మట్టి పరీక్ష ప్రయత్నించండి",
  },
  ml: {
    "Farming Companion": "കൃഷി സഹായി",
    AppTitle: "Root AI — കൃഷി, ലളിതം.",
    AppTagline: "നിങ്ങളുടെ ഭാഷയിൽ സംസാരിക്കുക, ഫാം മാനേജുചെയ്യുക, ക്യാമറ ഉപയോഗിച്ച് മണ്ണ് പരിശോധിക്കുക, മാർക്കറ്റ് വിലകൾ കാണുക — ഒറ്റ ലളിതമായ വേഗത്തിലുള്ള അനുഭവത്തിൽ.",
    "Change Language": "ഭാഷ മാറ്റുക",
    "Open App": "ആപ്പ് തുറക്കുക",
    SecurityNote: "സ്വകാര്യവും സുരക്ഷിതവും. നിങ്ങളുടെ ഡാറ്റ നിങ്ങൾക്കാണ് നിയന്ത്രണം.",
    "Live Tools": "ലൈവ് ഉപകരണങ്ങൾ — വോയ്‌സ്, മണ്ണ് പരിശോധന, മാർക്കറ്റ്",
    Voice: "ശബ്ദം",
    Home: "ഹോം",
    Farm: "ഫാം",
    Tasks: "ടാസ്കുകൾ",
    Soil: "മണ്ണ്",
    Market: "മാർക്കറ്റ്",
    Learn: "പഠിക്കുക",
    Community: "സമൂഹം",
    Settings: "സെറ്റിംഗ്സ്",
    "Create Community": "സമൂഹം സൃഷ്ടിക്കുക",
    Back: "തിരികെ",
    Continue: "തുടരുക",
    "Manage Farms & Simulate Growth": "ഫാം മാനേജ് & വളർച്ച സിമുലേറ്റ് ചെയ്യുക",
    "Manage Farms Desc": "ഫാം ചേർക്കുക, 3D സംദര്ഭ പകർത്തുക, ഓരോ ഫാമിനും വിതയം, നീരേറ്റൽ, മുന്നേറൽ, കൊയ്ത്ത് എന്നിവ നടത്തുക.",
    "Go to My Farm": "നന്ന ഫാമിലേക്ക് പോകുക",
    "Local Language Experience": "സ്ഥാനിക ഭാഷാ അനുഭവം",
    "Local Language Desc": "സെറ്റിംഗ്സിൽ നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക. നാവിഗേഷൻ സ്വയം പൊരുത്തപ്പെടും.",
    "Set Language": "ഭാഷ സജ്ജമാക്കുക",
    "Start with your voice": "നിങ്ങളുടെ ശബ്ദത്തിൽ ആരംഭിക്കുക",
    "Voice CTA": "\"മാർക്കറ്റ് തുറക്കൂ\", \"ടാസ്ക് ചേർക്കൂ\", അല്ലെങ്കിൽ \"മണ്ണ് പരിശോധന\" എന്നു പറയൂ — അത്രയും എളുപ്പം.",
    "Get Started": "ശുരു കരുന്നു",
    "Try Soil Test": "മണ്ണ് പരിശോധന ശ്രമിക്കുക",
  },
  kn: {
    "Farming Companion": "ಕೃಷಿ ಸಹಾಯಕ",
    AppTitle: "Root AI — ಕೃಷಿ, ಸುಲಭ.",
    AppTagline: "ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ, ಫಾರ್ಮ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸಿ, ಕ್ಯಾಮೆರಾದಿಂದ ಮಣ್ಣನ್ನು ಪರೀಕ್ಷಿಸಿ, ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳನ್ನು ನೋಡಿ — ಒಂದೇ ಸರೳ, ವೇಗದ ಅನುಭವದಲ್ಲಿ.",
    "Change Language": "ಭಾಷೆ ಬದಲಿಸಿ",
    "Open App": "ಆಪ್ ತೆರೆಯಿರಿ",
    SecurityNote: "ಖಾಸಗಿ ಮತ್ತು ಸುರಕ್ಷಿತ. ನಿಮ್ಮ ಡೇಟಾ ನಿಮ್ಮ ನಿಯಂತ್ರಣಂ.",
    "Live Tools": "ಲೈವ್ ಸಾಧನಗಳು — ಧ್ವನಿ, ಮಣ್ಣಿನ ಪರೀಕ್ಷೆ, ಮಾರುಕಟ್ಟೆ",
    Voice: "ಧ್ವನಿ",
    Home: "ಮುಖಪುಟ",
    Farm: "ಫಾರ್ಮ್",
    Tasks: "ಕಾರ್ಯಗಳು",
    Soil: "ಮಣ್ಣು",
    Market: "ಬಾಜಾರ",
    Learn: "ಶಿಕ್ಷಿಸಿ",
    Community: "ಸಮುದಾಯ",
    Settings: "ಸೆಟ್ಟಿಂಗ್ಸ್",
    "Create Community": "ಸಮೂಹಂ ರಚಿಸಿ",
    Back: "ಹಿಂದೆ",
    Continue: "ಕೊಂದುವರಿಸಿ",
    "Manage Farms & Simulate Growth": "ಫಾರ್ಮ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸಿ ಮತ್ತು ಬೆಳವಣಿಗೆ ಅನುಕರಿಸಿ",
    "Manage Farms Desc": "ಫಾರ್ಮ್‌ಗಳನ್ನು ಸೇರಿಸಿ, 3D ಸಂದರ್ಭ ಸೆರೆಹಿಡಿಯಿರಿ, ಪ್ರತಿಫಾರ್ಮ್‌ಗೆ ಬಿತ್ತನೆ, ನೀರು ಪೆಟ್ಟడಂ, ಮುಂದುಕು ತೀಸುಕೆళ್లడಂ, ಕೊಯ್ಲು ಮುಂತಾದವುಗಳನ್ನು ನಡೆಸಿ.",
    "Go to My Farm": "ನನ್ನ ಫಾಮಿಲೇಕ್ಕೆ ಹೋಗಿ",
    "Local Language Experience": "ಸ್ಥಳೀಯ ಭಾಷಾ ಅನುಭವ",
    "Local Language Desc": "ಸೆಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ. ನವಿಗೇಶನ್ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಹೊಂದಿಕೊಳ್ಳುತ್ತದೆ.",
    "Set Language": "ಭಾಷೆ ಹೊಂದಿಸಿ",
    "Start with your voice": "ನಿಮ್ಮ ಧ್ವನಿಯಿಂದ ಪ್ರಾರಂಭಿಸಿ",
    "Voice CTA": `“ಮಾರುಕಟ್ಟೆ ತೆರೆಯಿರಿ”, "ಕಾರ್ಯ ಸೇರಿಸಿ", ಅಥವಾ "ಮಣ್ಣಿನ ಪರೀಕ್ಷೆ" ಎಂದು ಹೇಳಿ — ಅಷ್ಟೇ ಸುಲಭ.`,
    "Get Started": "ಪ್ರಾರಂಭಿಸಿ",
    "Try Soil Test": "ಮಣ್ಣಿನ ಪರೀಕ್ಷೆ ಪ್ರಯತ್ನಿಸಿ",
  },
  bn: {
    "Farming Companion": "কৃষি সহকারী",
    AppTitle: "Root AI — কৃষি, সহজ।",
    AppTagline: "আপনার ভাষায় বলুন, খামার পরিচালনা করুন, ক্যামেরায় মাটি পরীক্ষা করুন, এবং বাজারদর দেখুন — সবকিছু এক সহজ, দ্রুত অভিজ্ঞতায়।",
    "Change Language": "ভাষা পরিবর্তন",
    "Open App": "অ্যাপ খুলুন",
    SecurityNote: "ব্যক্তিগত ও নিরাপদ। আপনার ডেটা আপনার নিয়ন্ত্রণে।",
    "Live Tools": "লাইব্হ টূল্স — ভয়েস, মাটি পরীক্ষা, বাজার",
    Voice: "ভয়েস",
    Home: "হোম",
    Farm: "খামার",
    Tasks: "কাজ",
    Soil: "মাটি",
    Market: "বাজার",
    Learn: "শিখো",
    Community: "কমিউনিটি",
    Settings: "সেটিংস",
    "Create Community": "সমিউনিটি তৈরি করো",
    Back: "ফিরে যান",
    Continue: "চালিয়ে যান",
    "Manage Farms & Simulate Growth": "খামার পরিচালনা ও বৃদ্ধি সিমুলেশন",
    "Manage Farms Desc": "খামার যোগ করুন, 3D সন্দর্ভ কৈপ্চর করুন, এবং প্রতিটি খামারে বপন, সেচ, অগ্রগতি, ফসল তোলা চালান।",
    "Go to My Farm": "নাম্ন খামারে যান",
    "Local Language Experience": "স্থানীয় ভাষার অভিজ্ঞতা",
    "Local Language Desc": "সেটিংস থেকে আপনার ভাষা বেছে নিন। ন্যাভিগেশন স্বয়ংক্রিয়ভাবে মানিয়ে নেবে।",
    "Set Language": "ভাষা সেট করো",
    "Start with your voice": "আপনার কণ্ঠ দিয়ে শুরু করুন",
    "Voice CTA": "\"মারুকট্টে তেরেরি\", \"কার্য সেরিসি\", অথবা \"মাটি পরিশেক্ষা\" এন্ড হেল্প করুন — অন্তে সুলভ।",
    "Get Started": "প্রারম্ভ করুন",
    "Try Soil Test": "মাটি পরিশেক্ষা প্রয়ত্ন করুন",
  },
};

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
        : "Hello! I'm your farming assistant. I can guide you by talking.",
    "prompt.name": lang === "ta" ? "என் பெயர் Root AI!" : lang === "hi" ? "मेरा नाम Root AI है!" : "My name is Root AI!",
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