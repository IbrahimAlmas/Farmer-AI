import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAction } from "convex/react";
/* removed unused Textarea import */

export default function Community() {
  const posts = useQuery(api.community.list);
  const create = useMutation(api.community.create);

  const nearbyEnabled = useState<boolean>(false)[0]; // hint: no-op to keep hooks order stable
  const reverseGeocode = useAction(api.location.reverseGeocode);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [area, setArea] = useState<{ state: string; district?: string } | null>(null);
// Post composer state
const [body, setBody] = useState("");

  // Mutations/queries for groups
  const my = useQuery(api.community_groups.myMembership);
  const nearby = useQuery(
    api.community_groups.listNearby,
    area ? { state: area.state, district: area.district } : "skip"
  );
  const join = useMutation(api.community_groups.join);

  /* removed create-community local state */
  /* removed create-community local state */

  // Acquire location -> state/district once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => {
    (async () => {
      try {
        if (!navigator.geolocation) return;
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              setCoords({ lat, lng });
              try {
                const res = await reverseGeocode({ lat, lng });
                const state = (res as any)?.state as string | null;
                const district = (res as any)?.district as string | null;
                if (state) setArea({ state, district: district ?? undefined });
              } catch {
                // ignore
              }
              resolve();
            },
            () => resolve(),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
          );
        });
      } catch {
        // ignore
      }
    })();
    return undefined;
  });

  const handleJoin = async (communityId: string) => {
    try {
      await join({ communityId: communityId as any });
      toast.success("Joined community");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to join");
    }
  };

  const submit = async () => {
    if (!body.trim()) return;
    try {
      await create({ body, images: undefined });
      setBody("");
      toast.success("Posted");
    } catch {
      toast.error("Failed to post");
    }
  };

  return (
    <AppShell title="Community">
      <div className="p-4 space-y-4">
        {/* Hero with layered gradients and texture */}
        <Card className="overflow-hidden border-0 shadow-none">
          <div className="relative h-36 sm:h-44 w-full rounded-3xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1543255006-c93fdbf9a21f?q=80&w=1600&auto=format&fit=crop"
              alt="Community banner"
              className="absolute inset-0 h-full w-full object-cover scale-105"
              loading="eager"
              onError={(e) => {
                const t = e.currentTarget as HTMLImageElement;
                if (t.src !== '/logo_bg.png') t.src = '/logo_bg.png';
                t.onerror = null;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent,rgba(0,0,0,0.5))]" />
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
              <div className="text-white drop-shadow">
                <div className="text-xs uppercase tracking-widest opacity-90">Find your people</div>
                <div className="text-2xl font-extrabold">Communities Near You</div>
                {area?.state && (
                  <div className="text-white/80 text-xs mt-1">
                    {area.district ? `${area.district}, ` : ""}{area.state}
                  </div>
                )}
              </div>
              {/* Quick action to create */}
              <Button
                variant="secondary"
                size="sm"
                className="rounded-xl"
                onClick={() => (window.location.href = "/community/create")}
              >
                Create Community
              </Button>
            </div>
          </div>
        </Card>

        {/* Current membership spotlight */}
        {my?.community && (
          <div className="rounded-3xl border bg-card/70 p-4 flex items-center gap-4 shadow-sm">
            <img
              src={my.community.image ?? "/assets/Logo_.png"}
              className="h-12 w-12 rounded-2xl object-cover"
              alt={my.community.name}
              onError={(e) => {
                const t = e.currentTarget as HTMLImageElement;
                if (t.src !== '/logo.png') t.src = '/logo.png';
                t.onerror = null;
              }}
            />
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">You're a member of</div>
              <div className="font-semibold leading-tight">{my.community.name}</div>
              <div className="text-xs text-muted-foreground">
                {my.community.district ? `${my.community.district}, ` : ""}{my.community.state}
              </div>
            </div>
          </div>
        )}

        {/* Nearby Communities */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Discover Nearby</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {(nearby ?? []).map((c: any) => (
                <div key={c._id} className="group relative rounded-2xl border overflow-hidden">
                  <div className="h-28 w-full relative">
                    <img
                      src={c.image ?? "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop"}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      alt={c.name}
                      loading="lazy"
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement;
                        if (t.src !== '/logo_bg.png') t.src = '/logo_bg.png';
                        t.onerror = null;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 text-white">
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-[11px] opacity-90">
                        {c.district ? `${c.district}, ` : ""}{c.state} • {c.membersCount ?? 0} members
                      </div>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">Local group</div>
                    {!my?.community && (
                      <Button className="rounded-xl" size="sm" onClick={() => handleJoin(c._id as any)}>
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Existing Post Composer */}
        <Card className="border shadow-sm">
          <CardHeader><CardTitle>Create Post</CardTitle></CardHeader>
          <CardContent className="flex gap-2">
            <Input placeholder="Share your update..." value={body} onChange={(e) => setBody(e.target.value)} />
            <Button onClick={submit}>Post</Button>
          </CardContent>
        </Card>

        {/* Feed */}
        <Card>
          <CardHeader><CardTitle>Feed</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {posts?.length ? posts.map((p) => (
              <div key={p._id} className="border rounded-2xl p-3 bg-card/70">
                <div className="flex items-center gap-2 mb-1">
                  <img
                    src={p.user?.image ?? "/logo.png"}
                    alt={p.user?.name ?? "User"}
                    className="h-6 w-6 rounded-lg object-cover"
                    onError={(e) => {
                      const t = e.currentTarget as HTMLImageElement;
                      if (t.src !== '/logo.png') t.src = '/logo.png';
                      t.onerror = null;
                    }}
                  />
                  <div className="text-sm text-muted-foreground">{p.user?.name ?? "Anonymous"}</div>
                </div>
                <div className="font-medium">{p.body}</div>
                <div className="text-xs text-muted-foreground mt-1">❤️ {p.likes} • 💬 {p.commentsCount}</div>
              </div>
            )) : <div className="text-sm text-muted-foreground">No posts yet.</div>}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}