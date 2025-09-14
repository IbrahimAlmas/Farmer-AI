import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";

export default function FarmModelViewer() {
  const { id } = useParams() as { id: string };
  const farm = useQuery(api.farms.getById, id ? ({ id: id as any } as any) : "skip") as any;
  const photoId = farm?.cornerPhotos?.[0] ?? null;
  const photoUrl = useQuery(
    api.soil_upload.getFileUrl,
    photoId ? { fileId: photoId as any } : "skip"
  ) as string | null;

  // Interactive rotation state
  const [angle, setAngle] = useState<{ x: number; y: number }>({ x: 25, y: -30 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      lastRef.current = { x: e.clientX, y: e.clientY };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !lastRef.current) return;
      const dx = e.clientX - lastRef.current.x;
      const dy = e.clientY - lastRef.current.y;
      lastRef.current = { x: e.clientX, y: e.clientY };
      setAngle((prev) => ({
        x: Math.max(-85, Math.min(85, prev.x - dy * 0.4)),
        y: prev.y + dx * 0.5,
      }));
    };
    const onPointerUp = () => {
      isDraggingRef.current = false;
      lastRef.current = null;
    };

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  const size = 320; // base size of the "field" cube

  return (
    <AppShell title="3D Farm Model">
      <div className="p-4 mx-auto max-w-6xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Drag to rotate. Your uploaded photo is used as the top texture.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/my-farm">Back to My Farm</Link>
            </Button>
            <Button
              variant="secondary"
              onClick={() => setAngle({ x: 25, y: -30 })}
            >
              Reset View
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Farm Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full grid place-items-center">
              <div
                ref={containerRef}
                className="relative"
                style={{
                  width: size * 2,
                  height: size * 1.2,
                  perspective: "1000px",
                  cursor: "grab",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    transformStyle: "preserve-3d",
                    transform: `rotateX(${angle.x}deg) rotateY(${angle.y}deg) translateZ(-60px)`,
                    transition: isDraggingRef.current ? "none" : "transform 0.08s ease-out",
                  }}
                >
                  {/* Field box — 6 faces */}
                  {/* Top (texture from uploaded photo) */}
                  <div
                    style={{
                      position: "absolute",
                      width: size,
                      height: size,
                      left: "50%",
                      top: "50%",
                      transform: `translate(-50%, -50%) rotateX(90deg) translateZ(${size / 2}px)`,
                      backgroundImage: photoUrl
                        ? `url(${photoUrl})`
                        : "linear-gradient(135deg, #dcedc8, #a5d6a7)",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      border: "1px solid rgba(0,0,0,0.1)",
                      boxShadow: "inset 0 0 80px rgba(0,0,0,0.15)",
                    }}
                  >
                    {/* Optional overlay stripes if we know prior crops */}
                    {Array.isArray(farm?.previousCrops) && farm.previousCrops.length > 0 && (
                      <div style={{ position: "absolute", inset: 0 }}>
                        {farm.previousCrops.slice(0, 5).map((crop: string, i: number) => {
                          const bandH = 100 / Math.min(5, farm.previousCrops.length);
                          const colors = ["#8BC34A", "#4CAF50", "#FFC107", "#FF9800", "#9C27B0"];
                          return (
                            <div
                              key={i}
                              style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: `${i * bandH}%`,
                                height: `${bandH}%`,
                                background: `${colors[i % colors.length]}22`,
                                mixBlendMode: "overlay",
                                borderTop: "1px dashed rgba(255,255,255,0.35)",
                              }}
                            >
                              <div
                                style={{
                                  position: "absolute",
                                  left: 6,
                                  top: 4,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  color: "rgba(0,0,0,0.7)",
                                  textShadow: "0 1px 2px rgba(255,255,255,0.6)",
                                }}
                              >
                                {crop}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Bottom */}
                  <div
                    style={{
                      position: "absolute",
                      width: size,
                      height: size,
                      left: "50%",
                      top: "50%",
                      transform: `translate(-50%, -50%) rotateX(-90deg) translateZ(${size / 2}px)`,
                      background: "#795548",
                    }}
                  />

                  {/* Front */}
                  <div
                    style={{
                      position: "absolute",
                      width: size,
                      height: size / 3,
                      left: "50%",
                      top: "50%",
                      transform: `translate(-50%, -50%) translateZ(${size / 2}px)`,
                      background:
                        "linear-gradient(to bottom, #795548, #5d4037)",
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  />
                  {/* Back */}
                  <div
                    style={{
                      position: "absolute",
                      width: size,
                      height: size / 3,
                      left: "50%",
                      top: "50%",
                      transform: `translate(-50%, -50%) rotateY(180deg) translateZ(${size / 2}px)`,
                      background:
                        "linear-gradient(to bottom, #795548, #5d4037)",
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  />
                  {/* Left */}
                  <div
                    style={{
                      position: "absolute",
                      width: size,
                      height: size / 3,
                      left: "50%",
                      top: "50%",
                      transform: `translate(-50%, -50%) rotateY(-90deg) translateZ(${size / 2}px)`,
                      background:
                        "linear-gradient(to bottom, #795548, #5d4037)",
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  />
                  {/* Right */}
                  <div
                    style={{
                      position: "absolute",
                      width: size,
                      height: size / 3,
                      left: "50%",
                      top: "50%",
                      transform: `translate(-50%, -50%) rotateY(90deg) translateZ(${size / 2}px)`,
                      background:
                        "linear-gradient(to bottom, #795548, #5d4037)",
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  />
                </div>
              </div>
            </div>

            {!photoUrl && (
              <div className="text-sm text-center text-muted-foreground mt-4">
                Upload a field photo on the My Farm page to see it here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}