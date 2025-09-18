import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <AppShell title="Dashboard">
      <div className="p-4 space-y-6">

        {/* Floating/glassy header */}
        <div className="sticky top-3 z-30 mx-auto max-w-3xl flex items-center justify-between gap-3 rounded-3xl border bg-card/80 backdrop-blur px-3 py-2 shadow-[0_10px_25px_-10px_rgba(0,0,0,0.45)]">
          {/* Left: Go Back to Landing */}
          <Button
            variant="ghost"
            className="rounded-2xl px-4 py-3 text-sm md:text-base font-semibold"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>

          {/* Center: Brand — make text white for visibility */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2">
              <img
                src="https://harmless-tapir-303.convex.cloud/api/storage/a4af3a5d-e126-420d-b31d-c1929a3c833b"
                alt="Root AI"
                className="h-8 w-8 md:h-9 md:w-9 rounded-full object-cover"
                onError={(e) => {
                  const t = e.currentTarget as HTMLImageElement;
                  if (t.src !== '/logo.svg') t.src = '/logo.svg';
                  t.onerror = null;
                }}
              />
              <span className="text-base md:text-lg font-bold tracking-wide text-white">Root AI</span>
            </div>
          </div>

          {/* Right: CTA */}
          <Button
            className="rounded-full px-5 py-3 text-sm md:text-base bg-[oklch(0.42_0.12_130)] hover:bg-[oklch(0.42_0.12_130_/_90%)] text-white"
            onClick={() => navigate("/learn-more")}
          >
            Learn More →
          </Button>
        </div>

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold mb-2">
            Welcome back, Farmer! 🌾
          </h2>
          <p className="text-muted-foreground">
            Let's check on your farming progress today
          </p>
        </motion.div>
      </div>
    </AppShell>
  );
}