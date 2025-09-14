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
          "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1600&auto=format&fit=crop",
      });
      toast.success("Community created!");
      navigate("/community", { replace: true });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create community");
    }
  };

  return (
    <AppShell title="Create Community">
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>New Community</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Name</label>
                <Input
                  placeholder="Eg. Guntur Farmers Collective"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">
                  Description (optional)
                </label>
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
                  <label className="text-xs text-muted-foreground">
                    District (optional)
                  </label>
                  <Input
                    placeholder="District"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Latitude
                  </label>
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
                  <label className="text-xs text-muted-foreground">
                    Longitude
                  </label>
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

              <div className="flex items-center gap-2">
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
                  {detecting ? "Detecting location..." : "Create Community"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground">
          Tip: We auto-detect your area. You can edit the state/district or coordinates if needed.
        </div>
      </div>
    </AppShell>
  );
}
