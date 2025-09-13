"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Reverse geocode latitude/longitude to a state name using OpenStreetMap Nominatim.
 * Returns { state, district?, raw? } for debugging/future use.
 */
export const reverseGeocode = action({
  args: { lat: v.number(), lng: v.number() },
  handler: async (_ctx, args) => {
    const { lat, lng } = args;
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat,
    )}&lon=${encodeURIComponent(lng)}&zoom=8&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "KrishiMitra/1.0 (convex action)",
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Reverse geocoding failed: ${res.status} ${body}`);
    }
    const data = (await res.json()) as any;
    const addr = data?.address ?? {};

    // Prefer state; fallbacks to region/county if needed
    const state: string | undefined =
      addr.state ||
      addr.region ||
      addr.state_district ||
      addr.county ||
      addr.province ||
      addr.city ||
      addr.town;

    const district: string | undefined =
      addr.state_district || addr.county || addr.district || addr.city;

    return {
      state: state || null,
      district: district || null,
      raw: { address: addr },
    };
  },
});