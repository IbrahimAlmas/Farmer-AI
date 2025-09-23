import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const vegImages: Record<string, string> = {
  potato: "https://images.unsplash.com/photo-1546857095-6fb93167a42d?q=80&w=1200&auto=format&fit=crop",
  onion: "https://images.unsplash.com/photo-1600326145359-8b75775b43f1?q=80&w=1200&auto=format&fit=crop",
  tomato: "https://images.unsplash.com/photo-1546470427-e21a6557b6bc?q=80&w=1200&auto=format&fit=crop",
  brinjal: "https://images.unsplash.com/photo-1604908554027-0c2b6676b9f1?q=80&w=1200&auto=format&fit=crop",
  cauliflower: "https://images.unsplash.com/photo-1510627498534-cf7e9002facc?q=80&w=1200&auto=format&fit=crop",
  cabbage: "https://images.unsplash.com/photo-1510626176961-cbb77bd371b8?q=80&w=1200&auto=format&fit=crop",
  okra: "https://images.unsplash.com/photo-1621262001070-ecd5e8e90b2e?q=80&w=1200&auto=format&fit=crop",
  carrot: "https://images.unsplash.com/photo-1506806732259-39c2d0268443?q=80&w=1200&auto=format&fit=crop",
  capsicum: "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1200&auto=format&fit=crop",
  cucumber: "https://images.unsplash.com/photo-1586201375761-83865001e31b?q=80&w=1200&auto=format&fit=crop",
  "green peas": "https://images.unsplash.com/photo-1586201375761-83865001e31b?q=80&w=1200&auto=format&fit=crop",
  "bottle gourd": "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=1200&auto=format&fit=crop",
  "bitter gourd": "https://images.unsplash.com/photo-1621262001070-ecd5e8e90b2e?q=80&w=1200&auto=format&fit=crop",
  "ridge gourd": "https://images.unsplash.com/photo-1621262001070-ecd5e8e90b2e?q=80&w=1200&auto=format&fit=crop",
  spinach: "https://images.unsplash.com/photo-1456394555490-ef1bf0ced421?q=80&w=1200&auto=format&fit=crop",
  coriander: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1200&auto=format&fit=crop",
  ginger: "https://images.unsplash.com/photo-1604908554027-0c2b6676b9f1?q=80&w=1200&auto=format&fit=crop",
  garlic: "https://images.unsplash.com/photo-1506806732259-39c2d0268443?q=80&w=1200&auto=format&fit=crop",
  "green chilli": "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1200&auto=format&fit=crop",
  pumpkin: "https://images.unsplash.com/photo-1475855581690-80accde3ae2b?q=80&w=1200&auto=format&fit=crop",
};

const localImages: string[] = [
  "/assets/Farm_3.jpg",
  "/assets/Farm_4.webp",
  "/assets/Farm_5.webp",
  "/assets/Farm_6.webp",
  "/assets/Wheat_Farm.webp",
  "/assets/Barily.jpg",
  "/assets/FEILD_1.jpeg",
  "/assets/Farm_7.jpg",
];

const nameHash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

const localVegImageFor = (name: string) => {
  const key = String(name).trim().toLowerCase();

  const map: Record<string, string> = {
    // exact veggies present in /public/assets
    "potato": "/assets/Potato.webp",
    "onion": "/assets/Onion.webp",
    "tomato": "/assets/Tomato..webp", // note: filename has two dots
    "brinjal": "/assets/Brinjal.jpg",
    "cauliflower": "/assets/Cauliflower..webp", // note: filename has two dots
    "cabbage": "/assets/Cabbage.webp",
    "okra": "/assets/Okra.webp",
    "carrot": "/assets/Carrot.webp",
    "capsicum": "/assets/Capsicum.jpeg",
    "cucumber": "/assets/Cucumber.webp",
    "green peas": "/assets/Green_peas.jpeg", // underscores in filename
    "spinach": "/assets/Spinach.webp",
    "coriander": "/assets/Coriander.webp",
    "ginger": "/assets/Ginger.webp",
    "garlic": "/assets/Garlic.webp",
    // items not in assets will fall back online then to a generic local image
  };

  // prefer exact key
  if (map[key]) return map[key];

  // simple normalization variants
  const normalized = key.replace(/\s+/g, "_");
  if (map[normalized]) return map[normalized];

  return ""; // signal no exact local match
};

const onlineImageFor = (name: string) => {
  const key = String(name).toLowerCase();
  const mapped = vegImages[key];
  if (mapped) return mapped;
  // Generic online fallback using Unsplash source with query based on the vegetable name
  return `https://source.unsplash.com/600x400/?${encodeURIComponent(key)},vegetable`;
};

export default function Market() {
  const profile = useQuery(api.profiles.get);
  const items = useQuery(api.market_prices.getVegetablePrices);
  const loading = items === undefined;

  const regionLabel = useMemo(() => profile?.location?.state ?? "Delhi", [profile]);

  const lang = profile?.preferredLang ?? "en";
  const tr = (s: string) => {
    if (String(lang).startsWith("te")) {
      const te: Record<string, string> = {
        Market: "మార్కెట్",
        "Nearby Vegetable Prices": "దగ్గర్లోని కూరగాయల ధరలు",
        Region: "ప్రాంతం",
        "Indicative local retail estimates (₹/kg)": "సూచకీయ స్థానిక రిటైల్ అంచనాలు (₹/kg)",
        per: "ప్రతి",
        Updated: "నవీకరించబడింది",
        "No prices available. Please try again later.": "ధరలు అందుబాటులో లేవు. దయచేసి తరువాత ప్రయత్నించండి.",
        Source: "మూలం",
        "Prices are indicative and adjusted for your region.": "ధరలు సూచకీయంగా ఉంటాయి మరియు మీ ప్రాంతానికి అనుగుణంగా సవరించబడ్డాయి.",
      };
      return te[s] ?? s;
    }
    return s;
  };

  return (
    <AppShell title={tr("Market")}>
      <div className="p-0">
        {/* Hero */}
        <div className="relative">
          <div className="h-36 sm:h-44 w-full overflow-hidden rounded-b-3xl">
            <img
              src="/logo_bg.svg"
              alt="Market"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
          <div className="absolute inset-x-0 top-0 h-36 sm:h-44 bg-gradient-to-b from-black/30 to-transparent rounded-b-3xl" />
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <div className="text-white drop-shadow">
              <div className="text-lg font-semibold">{tr("Nearby Vegetable Prices")}</div>
              <div className="text-xs opacity-90">{tr("Indicative local retail estimates (₹/kg)")}</div>
            </div>
            <Badge variant="secondary" className="text-xs shadow">
              {tr("Region")}: {regionLabel}
            </Badge>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <Card className="border-emerald-200/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {/* subtle icon shape using CSS only */}
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 mr-1" />
                  {tr("Nearby Vegetable Prices")}
                </span>
                <Badge variant="outline" className="text-xs">
                  {tr("Region")}: {regionLabel}
                </Badge>
              </CardTitle>
              <div className="text-xs text-muted-foreground mt-1">
                {tr("Indicative local retail estimates (₹/kg)")}
              </div>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-xl border overflow-hidden">
                      <Skeleton className="h-24 w-full" />
                      <div className="p-3 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && (!items || items.length === 0) && (
                <div className="text-sm text-muted-foreground">
                  {tr("No prices available. Please try again later.")}
                </div>
              )}

              {!loading && items && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                >
                  {items.map((it) => {
                    // Resolve local-first, then online fallback, then a deterministic local fallback
                    const local = localVegImageFor(it.name);
                    const online = onlineImageFor(it.name);
                    const finalLocalFallback =
                      localImages[nameHash(it.name) % localImages.length];

                    return (
                      <div
                        key={it.name}
                        className="group rounded-xl border overflow-hidden bg-muted/20 hover:shadow-md transition-all"
                      >
                        <div className="h-24 w-full overflow-hidden">
                          <img
                            src={local || online}
                            alt={it.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              // Step 1: if started with local and it failed, switch to online
                              if (local && target.src.endsWith(local)) {
                                target.src = online;
                                return;
                              }
                              // Step 2: if online failed, use deterministic local fallback
                              if (target.src === online) {
                                target.src = finalLocalFallback;
                                return;
                              }
                              // Step 3: stop error loop
                              target.onerror = null;
                            }}
                          />
                        </div>
                        <div className="p-3 flex items-start justify-between gap-2">
                          <div>
                            <div className="font-medium capitalize leading-tight">{it.name}</div>
                            <div className="mt-1">
                              <Badge variant="secondary" className="text-[10px]">
                                {tr("per")} {it.unit}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold tracking-tight">₹{it.price}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {tr("Updated")}: {new Date(it.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {!loading && items && (
                <div className="mt-4 text-[11px] text-muted-foreground">
                  {tr("Source")}: {items[0]?.source}. {tr("Prices are indicative and adjusted for your region.")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}