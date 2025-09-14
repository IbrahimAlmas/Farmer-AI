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
        {/* Nearby Communities & Create */}
        <Card className="overflow-hidden">
          <div className="relative h-28 w-full">
            <img
              src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1600&auto=format&fit=crop"
              alt="Community banner"
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
              onError={(e) => {
                const t = e.currentTarget as HTMLImageElement;
                if (t.src !== '/logo_bg.png') t.src = '/logo_bg.png';
                t.onerror = null;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/10" />
            <div className="absolute inset-0 flex items-center px-5">
              <div>
                <div className="text-white text-xs opacity-90">Find your people</div>
                <div className="text-white text-xl font-bold">Communities Near You</div>
                {area?.state && (
                  <div className="text-white/80 text-xs">
                    {area.district ? `${area.district}, ` : ""}{area.state}
                  </div>
                )}
              </div>
            </div>
          </div>

          <CardContent className="p-4">
            {/* Already a member */}
            {my?.community ? (
              <div className="rounded-2xl border bg-card/70 p-4 mb-4">
                <div className="text-sm text-muted-foreground mb-1">You're a member of</div>
                <div className="flex items-center gap-3">
                  <img
                    src={my.community.image ?? "/assets/Logo_.png"}
                    className="h-10 w-10 rounded-xl object-cover"
                    alt={my.community.name}
                    onError={(e) => {
                      const t = e.currentTarget as HTMLImageElement;
                      if (t.src !== '/logo.png') t.src = '/logo.png';
                      t.onerror = null;
                    }}
                  />
                  <div>
                    <div className="font-semibold">{my.community.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {my.community.district ? `${my.community.district}, ` : ""}{my.community.state}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Nearby list to join */}
            <div className="grid sm:grid-cols-2 gap-3">
              {(nearby ?? []).map((c: any) => (
                <div key={c._id} className="rounded-2xl border overflow-hidden">
                  <div className="h-24 w-full">
                    <img
                      src={c.image ?? "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop"}
                      className="h-full w-full object-cover"
                      alt={c.name}
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement;
                        if (t.src !== '/logo_bg.png') t.src = '/logo_bg.png';
                        t.onerror = null;
                      }}
                    />
                  </div>
                  <div className="p-3">
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.district ? `${c.district}, ` : ""}{c.state} • {c.membersCount ?? 0} members
                    </div>
                    {!my?.community && (
                      <Button className="mt-2 rounded-xl" size="sm" onClick={() => handleJoin(c._id as any)}>
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Community creation moved to a separate page */}
          </CardContent>
        </Card>

        {/* Existing Post Composer */}
        <Card>
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
              <div key={p._id} className="border rounded-md p-3">
                <div className="text-sm text-muted-foreground">{p.user?.name ?? "Anonymous"}</div>
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