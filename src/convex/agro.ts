"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

// Simple crop coefficient map by stage (approximate FAO-56 style values)
// Stages aligned to your sim: seedling -> initial, vegetative -> mid-rise, flowering -> mid, maturity -> late
const KC: Record<
  string,
  { seedling: number; vegetative: number; flowering: number; maturity: number }
> = {
  wheat: { seedling: 0.35, vegetative: 0.9, flowering: 1.15, maturity: 0.25 },
  rice: { seedling: 1.0, vegetative: 1.05, flowering: 1.2, maturity: 0.9 },
  maize: { seedling: 0.3, vegetative: 0.85, flowering: 1.2, maturity: 0.35 },
  corn: { seedling: 0.3, vegetative: 0.85, flowering: 1.2, maturity: 0.35 },
  soybean: { seedling: 0.35, vegetative: 0.95, flowering: 1.15, maturity: 0.5 },
  cotton: { seedling: 0.35, vegetative: 0.85, flowering: 1.15, maturity: 0.6 },
  canola: { seedling: 0.4, vegetative: 0.95, flowering: 1.1, maturity: 0.5 },
};

const ACRES_TO_M2 = 4046.8564224;

// Normalize crop and pick KC
function getKc(crop: string, stage: string): number {
  const key = (crop || "wheat").toLowerCase();
  const map = KC[key] || KC["wheat"];
  const s = (stage || "vegetative").toLowerCase() as keyof typeof map;
  return map[s] ?? map.vegetative;
}

export const getIrrigationRecommendation = action({
  args: {
    lat: v.number(),
    lng: v.number(),
    crop: v.string(), // e.g., "wheat", "rice", "maize", etc.
    stage: v.string(), // "seedling" | "vegetative" | "flowering" | "maturity"
    areaAcres: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const kc = getKc(args.crop, args.stage);

    // Request next 3 days with ET0 (FAO), precipitation and ancillary vars for fallback.
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${encodeURIComponent(args.lat)}` +
      `&longitude=${encodeURIComponent(args.lng)}` +
      "&daily=et0_fao_evapotranspiration,precipitation_sum,temperature_2m_max,temperature_2m_min,shortwave_radiation_sum" +
      "&timezone=auto&forecast_days=3";

    let daily:
      | {
          time: string[];
          et0_fao_evapotranspiration?: number[];
          precipitation_sum?: number[];
          temperature_2m_max?: number[];
          temperature_2m_min?: number[];
          shortwave_radiation_sum?: number[];
        }
      | null = null;

    try {
      const resp = await fetch(url, { headers: { "Content-Type": "application/json" } });
      if (!resp.ok) {
        throw new Error(`Open-Meteo failed: ${resp.status} ${resp.statusText}`);
      }
      const json: any = await resp.json();
      daily = json?.daily ?? null;
    } catch (err) {
      // Surface a clear error; frontend will toast this
      throw new Error(
        "Weather fetch failed. Please ensure location is valid and try again."
      );
    }

    if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
      throw new Error("Weather data unavailable for your location.");
    }

    const times = daily.time;
    const et0Arr = (daily.et0_fao_evapotranspiration ?? []).map((n: any) =>
      typeof n === "number" ? n : NaN
    );
    const precipArr = (daily.precipitation_sum ?? []).map((n: any) =>
      typeof n === "number" ? n : 0
    );

    // Fallback ET0 if missing: use a conservative 4 mm/day
    const fallbackEt0 = 4;

    // Calculate per day water need: water_mm = max(0, kc * ET0 - precipitation)
    const results: Array<{
      date: string;
      et0: number;
      precipitation: number;
      kc: number;
      water_mm: number;
      liters?: number | null;
    }> = [];

    const areaM2 =
      typeof args.areaAcres === "number" && args.areaAcres > 0
        ? args.areaAcres * ACRES_TO_M2
        : null;

    for (let i = 0; i < times.length; i++) {
      const et0 = Number.isFinite(et0Arr[i]) ? et0Arr[i] : fallbackEt0;
      const pr = Number.isFinite(precipArr[i]) ? precipArr[i] : 0;
      const water_mm = Math.max(0, kc * et0 - pr);
      const liters = areaM2 != null ? water_mm * areaM2 : null;
      results.push({
        date: times[i],
        et0,
        precipitation: pr,
        kc,
        water_mm,
        liters,
      });
    }

    const today = results[0];
    const summary = {
      today_mm: today?.water_mm ?? null,
      today_liters: today?.liters ?? null,
      kc_used: kc,
      crop: args.crop,
      stage: args.stage,
      area_acres: args.areaAcres ?? null,
      lat: args.lat,
      lng: args.lng,
    };

    return { success: true, days: results, summary };
  },
});
