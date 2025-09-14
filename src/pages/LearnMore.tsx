import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sprout, Mic, Camera, ShoppingCart, ShieldCheck, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";

export default function LearnMore() {
  const navigate = useNavigate();

  return (
    <AppShell title="About Root AI">
      <div className="pb-24">
        {/* Hero */}
        <div className="relative">
          <div className="h-40 sm:h-52 w-full overflow-hidden rounded-b-3xl">
            <img
              src="/logo_bg.svg"
              alt="Root AI"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
          <div className="absolute inset-x-0 top-0 h-40 sm:h-52 bg-gradient-to-b from-black/30 to-transparent rounded-b-3xl" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-white drop-shadow">
                <div className="text-xl font-bold tracking-tight">Root AI</div>
                <div className="text-xs opacity-90">Intelligent Agriculture Companion</div>
              </div>
              <Badge variant="secondary" className="text-xs shadow">Private & Secure</Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>What is Root AI?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                Root AI is a voice‑first, multilingual farming assistant. Manage farms, run quick soil checks using your camera, and see region‑aware market prices — all in a simple mobile‑first app.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Multilingual</Badge>
                <Badge variant="outline">Voice First</Badge>
                <Badge variant="outline">Market Insights</Badge>
                <Badge variant="outline">Soil Checks</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Mic className="h-5 w-5" />
                </div>
                <div className="font-semibold">Voice & Local Languages</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Navigate and add tasks using your voice in Telugu, Hindi, English, and more.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Camera className="h-5 w-5" />
                </div>
                <div className="font-semibold">Camera‑Powered Soil</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload soil photos for instant, actionable guidance.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div className="font-semibold">Market Prices</div>
                <p className="text-sm text-muted-foreground mt-1">
                  See indicative local retail prices adjusted to your region.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Privacy & Security</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <div className="inline-flex items-center gap-2 text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="font-medium">You control your data.</span>
              </div>
              <p>
                We keep things simple and transparent. Manage your information and language preferences anytime in Settings.
              </p>
            </CardContent>
          </Card>

          {/* CTA Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              className="rounded-2xl py-6 text-base"
              onClick={() => navigate("/dashboard")}
            >
              Open App <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl py-6 text-base"
              onClick={() => navigate("/market")}
            >
              See Market Prices
            </Button>
          </div>

          {/* Footer note */}
          <div className="text-center text-xs text-muted-foreground">
            Built to be fast, simple, and helpful for farmers.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
