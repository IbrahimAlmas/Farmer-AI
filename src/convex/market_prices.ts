import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

type Item = {
  name: string;
  price: number;
  unit: "kg";
  source: string;
  region: string;
  updatedAt: number;
};

// Return 15-20 most bought vegetables with region-adjusted indicative prices (₹/kg)
export const getVegetablePrices = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    let stateLower = "delhi";
    let stateLabel = "Delhi";

    if (userId) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique()
        .catch(() => null);

      stateLower = profile?.location?.state?.toLowerCase() ?? stateLower;
      stateLabel = profile?.location?.state ?? stateLabel;
    }

    // Baseline indicative retail prices (₹/kg), conservative and stable
    const base: Record<string, number> = {
      potato: 25,
      onion: 35,
      tomato: 40,
      brinjal: 35,
      cauliflower: 45,
      cabbage: 30,
      okra: 50,
      carrot: 40,
      capsicum: 70,
      cucumber: 35,
      green_peas: 90,
      bottle_gourd: 35,
      bitter_gourd: 60,
      ridge_gourd: 55,
      spinach: 30, // leaf veg priced per bunch, normalized to kg proxy
      coriander: 120, // per kg proxy
      ginger: 200,
      garlic: 180,
      green_chilli: 120,
      pumpkin: 30,
    };

    // Region factor to reflect typical variance across states/metros
    const regionFactors: Record<string, number> = {
      "delhi": 1.0,
      "nct of delhi": 1.0,
      "maharashtra": 1.08,
      "mumbai": 1.12,
      "karnataka": 1.05,
      "bengaluru": 1.08,
      "tamil nadu": 1.04,
      "chennai": 1.06,
      "telangana": 1.03,
      "hyderabad": 1.06,
      "uttar pradesh": 0.98,
      "punjab": 0.98,
      "haryana": 0.98,
      "rajasthan": 0.99,
      "gujarat": 1.02,
      "west bengal": 1.01,
      "kolkata": 1.03,
      "bihar": 0.97,
      "mp": 0.98,
      "madhya pradesh": 0.98,
      "kerala": 1.08,
      "andhra pradesh": 1.0,
      "assam": 1.02,
      "odisha": 0.99,
      "jharkhand": 0.98,
      "chandigarh": 1.02,
      "goa": 1.1,
    };

    const factor = regionFactors[stateLower] ?? 1.0;

    // Round to nearest rupee and clamp to sensible bounds
    const round = (n: number) => Math.max(5, Math.round(n));

    // Curate the top 18 items commonly bought PAN India
    const order: Array<keyof typeof base> = [
      "potato",
      "onion",
      "tomato",
      "cabbage",
      "cauliflower",
      "carrot",
      "cucumber",
      "okra",
      "brinjal",
      "capsicum",
      "bottle_gourd",
      "ridge_gourd",
      "bitter_gourd",
      "green_peas",
      "spinach",
      "coriander",
      "ginger",
      "garlic",
    ];

    const items: Array<Item> = order.slice(0, 18).map((key) => {
      const p = round(base[key] * factor);
      return {
        name: key.replace(/_/g, " "),
        price: p,
        unit: "kg",
        source: "Indicative local retail estimates",
        region: stateLabel,
        updatedAt: Date.now(),
      };
    });

    return items;
  },
});