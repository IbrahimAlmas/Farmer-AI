import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();

  // Add: demo chart data
  const moistureData = [
    { day: "Mon", moisture: 42 },
    { day: "Tue", moisture: 45 },
    { day: "Wed", moisture: 48 },
    { day: "Thu", moisture: 44 },
    { day: "Fri", moisture: 50 },
    { day: "Sat", moisture: 53 },
    { day: "Sun", moisture: 49 },
  ];

  const yieldData = [
    { crop: "Wheat", yield: 2.8 },
    { crop: "Rice", yield: 3.2 },
    { crop: "Maize", yield: 2.4 },
    { crop: "Pulses", yield: 1.6 },
  ];

  // Add: extra demo data for temperature and rainfall
  const tempData = [
    { day: "Mon", temp: 27 },
    { day: "Tue", temp: 28 },
    { day: "Wed", temp: 30 },
    { day: "Thu", temp: 29 },
    { day: "Fri", temp: 31 },
    { day: "Sat", temp: 33 },
    { day: "Sun", temp: 32 },
  ];

  const rainData = [
    { day: "Mon", rain: 2 },
    { day: "Tue", rain: 0 },
    { day: "Wed", rain: 5 },
    { day: "Thu", rain: 1 },
    { day: "Fri", rain: 0 },
    { day: "Sat", rain: 7 },
    { day: "Sun", rain: 3 },
  ];

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

        {/* Add: KPI strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <div className="panel-glass rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Today's ET0</div>
            <div className="mt-1 text-xl font-bold">4.2 mm</div>
            <div className="text-xs text-muted-foreground">Clear skies</div>
          </div>
          <div className="panel-glass rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Avg Moisture</div>
            <div className="mt-1 text-xl font-bold">46%</div>
            <div className="text-xs text-muted-foreground">Last 7 days</div>
          </div>
          <div className="panel-glass rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Active Farms</div>
            <div className="mt-1 text-xl font-bold">3</div>
            <div className="text-xs text-muted-foreground">Managed</div>
          </div>
          <div className="panel-glass rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Alerts</div>
            <div className="mt-1 text-xl font-bold text-amber-400">2</div>
            <div className="text-xs text-muted-foreground">Irrigation pending</div>
          </div>
        </motion.div>

        {/* Add: Simple analytics (row 1: existing charts) */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Soil Moisture Trend */}
          <div className="panel-glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Soil Moisture (7 days)</h3>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Realtime</span>
            </div>
            <ChartContainer
              className="h-72"
              config={{
                moisture: { label: "Soil Moisture", color: "oklch(0.72 0.15 145)" },
              }}
            >
              <LineChart data={moistureData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.35)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis unit="%" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="moisture"
                  stroke="var(--color-moisture)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </div>

          {/* Estimated Yield by Crop */}
          <div className="panel-glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Estimated Yield by Crop</h3>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Demo</span>
            </div>
            <ChartContainer
              className="h-72"
              config={{
                yield: { label: "Yield (t/ha)", color: "oklch(0.70 0.14 90)" },
              }}
            >
              <BarChart data={yieldData} barCategoryGap={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.35)" />
                <XAxis dataKey="crop" tickLine={false} axisLine={false} />
                <YAxis unit=" t/ha" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="yield"
                  fill="var(--color-yield)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </motion.div>

        {/* Add: More analytics (row 2: temperature + rainfall) */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Temperature Trend */}
          <div className="panel-glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Temperature (7 days)</h3>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Realtime</span>
            </div>
            <ChartContainer
              className="h-72"
              config={{
                temp: { label: "Temperature (°C)", color: "oklch(0.72 0.10 50)" },
              }}
            >
              <AreaChart data={tempData}>
                <defs>
                  <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-temp)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-temp)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.35)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis unit="°C" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="temp"
                  stroke="var(--color-temp)"
                  fill="url(#tempFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </div>

          {/* Rainfall */}
          <div className="panel-glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Rainfall (7 days)</h3>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">mm</span>
            </div>
            <ChartContainer
              className="h-72"
              config={{
                rain: { label: "Rain (mm)", color: "oklch(0.70 0.14 145)" },
              }}
            >
              <BarChart data={rainData} barCategoryGap={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.35)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis unit=" mm" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="rain" fill="var(--color-rain)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}