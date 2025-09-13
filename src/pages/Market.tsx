import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Market() {
  const profile = useQuery(api.profiles.get);
  const items = useQuery(api.market_prices.getVegetablePrices);
  const loading = items === undefined;

  const regionLabel = useMemo(() => profile?.location?.state ?? "Delhi", [profile]);

  return (
    <AppShell title="Market">
      <div className="p-4 space-y-4">
        <Card className="border-emerald-200/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                Nearby Vegetable Prices
              </span>
              <Badge variant="outline" className="text-xs">
                Region: {regionLabel}
              </Badge>
            </CardTitle>
            <div className="text-xs text-muted-foreground mt-1">
              Indicative local retail estimates (₹/kg)
            </div>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="text-right space-y-1">
                      <Skeleton className="h-5 w-16 ml-auto" />
                      <Skeleton className="h-3 w-24 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && (!items || items.length === 0) && (
              <div className="text-sm text-muted-foreground">
                No prices available. Please try again later.
              </div>
            )}

            {!loading && items && (
              <div className="divide-y">
                {items.map((it) => (
                  <div
                    key={it.name}
                    className="py-3 flex items-center justify-between hover:bg-muted/40 rounded-md px-2 -mx-2 transition-colors"
                  >
                    <div>
                      <div className="font-medium capitalize">{it.name}</div>
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-[10px]">
                          per {it.unit}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold tracking-tight">
                        ₹{it.price}
                      </div>
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