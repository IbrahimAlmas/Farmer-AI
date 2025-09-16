import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAction } from "convex/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle } from "lucide-react";

export default function Community() {
  const posts = useQuery(api.community.list);
  const create = useMutation(api.community.create);
  const like = useMutation(api.community.like);

  const nearbyEnabled = useState<boolean>(false)[0]; // hint: no-op to keep hooks order stable
  const reverseGeocode = useAction(api.location.reverseGeocode);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [area, setArea] = useState<{ state: string; district?: string } | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [msg, setMsg] = useState("");
  const sendMessage = useMutation(api.community.sendMessage);
  const addJob = useMutation(api.community.addJob);

  const [body, setBody] = useState("");
  const [jobName, setJobName] = useState("");
  const [jobContact, setJobContact] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [jobDetails, setJobDetails] = useState("");

  // Mutations/queries for groups
  const my = useQuery(api.community_groups.myMembership);
  const nearby = useQuery(
    api.community_groups.listNearby,
    area ? { state: area.state, district: area.district } : "skip"
  );
  const join = useMutation(api.community_groups.join);

  // Add: queries for selected community room
  const messages = useQuery(
    api.community.listMessages,
    selected ? { communityId: selected._id } : "skip"
  );
  const jobs = useQuery(
    api.community.listJobs,
    selected ? { communityId: selected._id } : "skip"
  );

  // Add: simple relative time helper (uses Convex system _creationTime)
  const timeAgo = (ts?: number) => {
    if (!ts) return "";
    const diff = Date.now() - ts;
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  };

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

  const submitMessage = async () => {
    if (!selected) return;
    const bodyTrim = msg.trim();
    if (!bodyTrim) return;
    try {
      await sendMessage({ communityId: selected._id, body: bodyTrim });
      setMsg("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send");
    }
  };

  const submitJob = async () => {
    if (!selected) return;
    if (!jobName.trim() || !jobContact.trim() || !jobRole.trim()) {
      toast.error("Please fill name, contact, and role.");
      return;
    }
    try {
      await addJob({
        communityId: selected._id,
        name: jobName.trim(),
        contact: jobContact.trim(),
        role: jobRole.trim(),
        details: jobDetails.trim() || undefined,
      });
      setJobName("");
      setJobContact("");
      setJobRole("");
      setJobDetails("");
      toast.success("Posted to job board");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to post");
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

  const onLike = async (id: string) => {
    try {
      await like({ id: id as any });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to like");
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
          <div
            className="rounded-3xl border bg-card/70 p-4 flex items-center gap-4 shadow-sm cursor-pointer"
            onClick={() => setSelected(my.community)}
            role="button"
          >
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
                <div
                  key={c._id}
                  className="group relative rounded-2xl border overflow-hidden cursor-pointer"
                  onClick={() => setSelected(c)}
                  role="button"
                >
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
                      <Button
                        className="rounded-xl"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoin(c._id as any);
                        }}
                      >
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
          <CardContent>
            <div className="flex gap-3">
              <img
                src="/logo.png"
                alt="You"
                className="h-10 w-10 rounded-xl object-cover"
                onError={(e) => {
                  const t = e.currentTarget as HTMLImageElement;
                  if (t.src !== '/logo.png') t.src = '/logo.png';
                  t.onerror = null;
                }}
              />
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Share your update…"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex items-center justify-end">
                  <Button onClick={submit}>Post</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feed */}
        <Card>
          <CardHeader><CardTitle>Feed</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {posts?.length ? posts.map((p) => (
              <div key={p._id} className="border rounded-2xl p-3 bg-card/70">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={p.user?.image ?? "/logo.png"}
                    alt={p.user?.name ?? "User"}
                    className="h-9 w-9 rounded-xl object-cover"
                    onError={(e) => {
                      const t = e.currentTarget as HTMLImageElement;
                      if (t.src !== '/logo.png') t.src = '/logo.png';
                      t.onerror = null;
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{p.user?.name ?? "Anonymous"}</div>
                    <div className="text-xs text-muted-foreground">• {timeAgo((p as any)?._creationTime)}</div>
                  </div>
                </div>

                {/* Body */}
                <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{p.body}</div>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <button
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => onLike(p._id as any)}
                    aria-label="Like"
                    title="Like"
                  >
                    <Heart className="h-4 w-4" />
                    <span>{p.likes}</span>
                  </button>
                  <div className="inline-flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{p.commentsCount}</span>
                  </div>
                </div>
              </div>
            )) : <div className="text-sm text-muted-foreground">No posts yet.</div>}
          </CardContent>
        </Card>
      </div>

      {/* Community Room Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <img
                src={selected?.image ?? "/assets/Logo_.png"}
                alt={selected?.name ?? "Community"}
                className="h-8 w-8 rounded-lg object-cover"
                onError={(e) => {
                  const t = e.currentTarget as HTMLImageElement;
                  if (t.src !== '/logo.png') t.src = '/logo.png';
                  t.onerror = null;
                }}
              />
              <span>{selected?.name ?? "Community"}</span>
              <span className="text-xs text-muted-foreground">
                {selected?.district ? `${selected.district}, ` : ""}{selected?.state}
              </span>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid grid-cols-2 mb-3">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="jobs">Job Board</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="space-y-3">
              <div className="rounded-xl border bg-card/70">
                <ScrollArea className="h-72 p-3">
                  <div className="space-y-3">
                    {(messages ?? []).map((m: any) => (
                      <div key={m._id} className="flex items-start gap-2">
                        <img
                          src={m.user?.image ?? "/logo.png"}
                          alt={m.user?.name ?? "User"}
                          className="h-7 w-7 rounded-lg object-cover"
                          onError={(e) => {
                            const t = e.currentTarget as HTMLImageElement;
                            if (t.src !== '/logo.png') t.src = '/logo.png';
                            t.onerror = null;
                          }}
                        />
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground">{m.user?.name ?? "Anonymous"}</div>
                          <div className="text-sm">{m.body}</div>
                        </div>
                      </div>
                    ))}
                    {!messages?.length && (
                      <div className="text-sm text-muted-foreground">No messages yet. Say hello!</div>
                    )}
                  </div>
                </ScrollArea>
                <div className="p-3 border-t flex items-center gap-2">
                  <Input
                    placeholder="Type a message…"
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submitMessage();
                      }
                    }}
                  />
                  <Button onClick={submitMessage}>Send</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="jobs" className="space-y-4">
              <div className="rounded-xl border bg-card/70 p-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input placeholder="Your name" value={jobName} onChange={(e) => setJobName(e.target.value)} />
                  <Input placeholder="Contact (phone/email)" value={jobContact} onChange={(e) => setJobContact(e.target.value)} />
                  <Input placeholder="Desired role/work" value={jobRole} onChange={(e) => setJobRole(e.target.value)} className="sm:col-span-2" />
                  <Textarea placeholder="Resume / skills / note (optional)" value={jobDetails} onChange={(e) => setJobDetails(e.target.value)} className="sm:col-span-2" />
                </div>
                <div className="mt-3 flex justify-end">
                  <Button onClick={submitJob}>Post</Button>
                </div>
              </div>

              <div className="space-y-3">
                {(jobs ?? []).map((j: any) => (
                  <div key={j._id} className="rounded-xl border p-3 bg-card/70">
                    <div className="flex items-center gap-2 mb-1">
                      <img
                        src={j.user?.image ?? "/logo.png"}
                        alt={j.user?.name ?? "User"}
                        className="h-6 w-6 rounded-lg object-cover"
                        onError={(e) => {
                          const t = e.currentTarget as HTMLImageElement;
                          if (t.src !== '/logo.png') t.src = '/logo.png';
                          t.onerror = null;
                        }}
                      />
                      <div className="text-sm font-medium">{j.name}</div>
                      <div className="text-xs text-muted-foreground">• {j.role}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">Contact: {j.contact}</div>
                    {j.details && <div className="text-sm mt-1 whitespace-pre-wrap">{j.details}</div>}
                  </div>
                ))}
                {!jobs?.length && (
                  <div className="text-sm text-muted-foreground">No postings yet.</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}