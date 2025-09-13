import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo } from "react";

export default function Market() {
  const profile = useQuery(api.profiles.get);
  const items = useQuery(api.market_prices.getVegetablePrices);
  const loading = items === undefined;

  const regionLabel = useMemo(() => profile?.location?.state ?? "Delhi", [profile]);

  return (
    <AppShell title="Market">
      <div className="p-4 space-y-4">
        <Card className="border-emerald-200/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Nearby Vegetable Prices
              <span className="text-xs font-normal text-muted-foreground">
                Region: {regionLabel}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-sm text-muted-foreground">Fetching latest prices…</div>
            )}

            {!loading && (!items || items.length === 0) && (
              <div className="text-sm text-muted-foreground">
                No prices available. Please try again later.
              </div>
            )}

            {!loading && items && (
              <div className="divide-y">
                {items.map((it) => (
                  <div key={it.name} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium capitalize">{it.name}</div>
                      <div className="text-xs text-muted-foreground">Per {it.unit}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold">₹{it.price}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Updated: {new Date(it.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && items && (
              <div className="mt-4 text-[11px] text-muted-foreground">
                Source: {items[0]?.source}. Prices are indicative and adjusted for your region.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}