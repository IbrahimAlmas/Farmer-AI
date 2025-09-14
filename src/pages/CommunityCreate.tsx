import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";

export default function CommunityCreate() {
  const navigate = useNavigate();
  const reverseGeocode = useAction(api.location.reverseGeocode);
  const create = useMutation(api.community_groups.create);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stateName, setStateName] = useState("");
  const [district, setDistrict] = useState<string>("");
  const [lat, setLat] = useState<number | "">("");
  const [lng, setLng] = useState<number | "">("");
  const [detecting, setDetecting] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.geolocation) return;
        setDetecting(true);
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              if (cancelled) return resolve();
              const plat = pos.coords.latitude;
              const plng = pos.coords.longitude;
              setLat(plat);
              setLng(plng);
              try {
                const res = await reverseGeocode({ lat: plat, lng: plng });
                const s = (res as any)?.state as string | null;
                const d = (res as any)?.district as string | null;
                if (s && !cancelled) setStateName(s);
                if (d && !cancelled) setDistrict(d);
              } catch {
                // ignore reverse geocode error; manual entry still allowed
              }
              resolve();
            },
            () => resolve(),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
          );
        });
      } finally {
        if (!cancelled) setDetecting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reverseGeocode]);

  const canSubmit =
    name.trim().length > 2 &&
    stateName.trim().length > 0 &&
    lat !== "" &&
    lng !== "" &&
    typeof lat === "number" &&
    typeof lng === "number";

  const onSubmit = async () => {
    if (!canSubmit) {
      toast.info("Please fill the required fields and location.");
      return;
    }
    try {
      const id = await create({
        name: name.trim(),
        description: description.trim() || undefined,
        state: stateName.trim(),
        district: district.trim() || undefined,
        lat,
        lng,
        image:
          (imageUrl && imageUrl.trim()) ||
          "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1600&auto=format&fit=crop",
      });
      toast.success("Community created!");
      navigate("/community", { replace: true });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create community");
    }
  };

  // Helper: re-detect location on demand
  const redetect = async () => {
    try {
      if (!navigator.geolocation) return;
      setDetecting(true);
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const plat = pos.coords.latitude;
            const plng = pos.coords.longitude;
            setLat(plat);
            setLng(plng);
            try {
              const res = await reverseGeocode({ lat: plat, lng: plng });
              const s = (res as any)?.state as string | null;
              const d = (res as any)?.district as string | null;
              if (s) setStateName(s);
              if (d) setDistrict(d);
            } catch {
              // ignore
            }
            resolve();
          },
          () => resolve(),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      });
    } finally {
      setDetecting(false);
    }
  };

  return (
    <AppShell title="Create Community">
      {/* Hero */}
      <div className="relative">
        <div className="h-40 w-full overflow-hidden rounded-b-3xl">
          <img
            src={imageUrl || "/assets/Logo_.png"}
            alt="Community cover"
            className="w-full h-full object-cover"
            onError={(e) => {
              const t = e.currentTarget as HTMLImageElement;
              if (t.src !== "/logo_bg.png") t.src = "/logo_bg.png";
              t.onerror = null;
            }}
          />
        </div>
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/30 to-transparent rounded-b-3xl" />
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
          <div className="text-white drop-shadow">
            <div className="text-xl font-bold">Create a New Community</div>
            <div className="text-xs opacity-90">
              What is this community about?
            </div>
          </div>
          {/* Right-side actions: Community link + Redetect */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => navigate("/community")}
              aria-label="Go to Community"
            >
              Community
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-xl"
              onClick={redetect}
              disabled={detecting}
            >
              {detecting ? "Detecting..." : "Redetect Area"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Form */}
          <Card>
            <CardHeader>
              <CardTitle>1. Community Information</CardTitle>
              <div className="text-xs text-muted-foreground">
                Tip: We auto-detect your area. You can edit the state/district or coordinates if needed.
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Name</label>
                <Input
                  placeholder="E.g. Guntur Farmers Collective"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Description (optional)</label>
                <Textarea
                  placeholder="What is this community about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">State</label>
                  <Input
                    placeholder="State"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">District (optional)</label>
                  <Input
                    placeholder="District"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Latitude</label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Latitude"
                    value={lat === "" ? "" : String(lat)}
                    onChange={(e) =>
                      setLat(e.target.value === "" ? "" : Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Longitude</label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Longitude"
                    value={lng === "" ? "" : String(lng)}
                    onChange={(e) =>
                      setLng(e.target.value === "" ? "" : Number(e.target.value))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Cover Image URL (optional)</label>
                <Input
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <div className="text-[10px] text-muted-foreground mt-1">
                  Tip: Use a wide image for best results.
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => navigate("/community")}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onSubmit}
                  disabled={!canSubmit || detecting}
                  className="rounded-xl"
                >
                  {detecting ? "Detecting..." : "Create Community"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right: Live Preview */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>2. Preview</CardTitle>
              <div className="text-xs text-muted-foreground">
                See how your community will appear to others.
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-40 w-full rounded-xl overflow-hidden border">
                <img
                  src={
                    imageUrl ||
                    "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop"
                  }
                  className="h-full w-full object-cover"
                  alt="Preview"
                  onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement;
                    if (t.src !== "/logo_bg.png") t.src = "/logo_bg.png";
                    t.onerror = null;
                  }}
                />
              </div>
              <div className="font-semibold">{name || "Community Name"}</div>
              <div className="text-xs text-muted-foreground">
                {(district ? `${district}, ` : "") + (stateName || "State")}
              </div>
              {description && (
                <div className="text-sm mt-2 line-clamp-3">{description}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}