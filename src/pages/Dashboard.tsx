import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Droplets, Thermometer, Home as HomeIcon, AlertTriangle } from "lucide-react";
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
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from "recharts";
import { toast } from "sonner";
import { useState } from "react";

export default function Dashboard() {
  const navigate = useNavigate();

  // Add: urgent tasks local state
  const [urgentTasks, setUrgentTasks] = useState<Array<{ id: number; title: string; due: string; done: boolean; risk?: "low" | "high" | "critical"; icon?: "water" | "pest" | "price" }>>([
    { id: 1, title: "Irrigate wheat plot (Block A)", due: "Today — Critically Low Moisture", done: false, risk: "critical", icon: "water" },
    { id: 2, title: "Scout for aphids in maize strip", due: "Today — High Risk", done: false, risk: "high", icon: "pest" },
    { id: 3, title: "Update market prices for soybeans", due: "Tomorrow", done: false, risk: "low", icon: "price" },
  ]);
  const toggleTask = (id: number) => {
    setUrgentTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
    const t = urgentTasks.find((x) => x.id === id);
    if (t) toast.success(`${t.done ? "Reopened" : "Completed"}: ${t.title}`);
  };

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

  // Add: extra datasets for distinct chart styles
  const cropShare = [
    { name: "Wheat", value: 38, color: "oklch(0.72 0.15 145)" },
    { name: "Rice", value: 28, color: "oklch(0.70 0.14 90)" },
    { name: "Maize", value: 22, color: "oklch(0.72 0.10 50)" },
    { name: "Pulses", value: 12, color: "oklch(0.65 0.10 30)" },
  ];

  const healthRadar = [
    { metric: "Moisture", score: 78 },
    { metric: "Nutrients", score: 65 },
    { metric: "Pests", score: 55 },
    { metric: "Growth", score: 72 },
    { metric: "Soil", score: 68 },
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

        {/* KPI strip - refined to match screenshot with icons and deltas */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <div className="panel-glass rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Today's ET0</div>
              <Droplets className="h-4 w-4 text-primary/80" />
            </div>
            <div className="mt-1 text-2xl font-extrabold">4.2 mm</div>
            <div className="text-xs text-emerald-400">+0.2 mm vs avg</div>
          </div>
          <div className="panel-glass rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Avg. Moisture</div>
              <Thermometer className="h-4 w-4 text-primary/80" />
            </div>
            <div className="mt-1 text-2xl font-extrabold">46%</div>
            <div className="text-xs text-muted-foreground">Last 7 days</div>
          </div>
          <div className="panel-glass rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Active Farms</div>
            <div className="mt-1 text-2xl font-extrabold">3</div>
            <div className="text-xs text-muted-foreground">Managed</div>
          </div>
          <div className="panel-glass rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Alerts</div>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-1 text-2xl font-extrabold text-amber-400">2</div>
            <div className="text-xs text-muted-foreground">Irrigation pending</div>
          </div>
        </motion.div>

        {/* Urgent Tasks — inline cards with icons + View Details */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel-glass rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Urgent Tasks</h3>
            <button
              onClick={() => navigate("/tasks")}
              className="text-xs font-medium text-emerald-400 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {urgentTasks.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border px-3 py-3 bg-card/70 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="grid place-items-center size-8 rounded-lg bg-primary/15 text-primary">
                    {t.icon === "water" ? (
                      <Droplets className="h-4 w-4" />
                    ) : t.icon === "pest" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <HomeIcon className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t.title}</div>
                    <div className={`text-xs ${t.risk === "critical" ? "text-red-400" : t.risk === "high" ? "text-amber-400" : "text-muted-foreground"}`}>
                      Due: {t.due}
                    </div>
                    <button
                      onClick={() => navigate("/tasks")}
                      className="mt-1 text-xs font-semibold text-emerald-400 hover:underline"
                    >
                      View Details
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => toggleTask(t.id)}
                  className={`size-6 grid place-items-center rounded-md border ${t.done ? "bg-primary/90 text-primary-foreground border-transparent" : "hover:bg-muted/60"}`}
                  aria-label={t.done ? "Mark as not done" : "Mark as done"}
                  title={t.done ? "Mark as not done" : "Mark as done"}
                >
                  {t.done ? "✓" : ""}
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Replace analytics with Environmental Factors + Crop Share */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Environmental Factors (7 days) — temp line + rainfall bars */}
          <div className="panel-glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Environmental Factors (7 days)</h3>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Temp • Rain</span>
            </div>
            <ChartContainer
              className="h-72"
              config={{
                temp: { label: "Temperature (°C)", color: "oklch(0.72 0.10 50)" },
                rain: { label: "Rainfall (mm)", color: "oklch(0.70 0.14 145)" },
              }}
            >
              <ComposedChart data={tempData.map((d, i) => ({ day: d.day, temp: d.temp, rain: rainData[i]?.rain ?? 0 }))}>
                <defs>
                  <linearGradient id="rainGradAll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-rain)" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="var(--color-rain)" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border)/0.3)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" unit="°C" tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" unit=" mm" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar yAxisId="right" dataKey="rain" fill="url(#rainGradAll)" radius={[6, 6, 6, 6]} barSize={18} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="temp"
                  stroke="var(--color-temp)"
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ChartContainer>
          </div>

          {/* Crop Share — doughnut */}
          <div className="panel-glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Crop Share</h3>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">% Area</span>
            </div>
            <ChartContainer
              className="h-72"
              config={{
                wheat: { label: "Wheat", color: cropShare[0].color },
                rice: { label: "Rice", color: cropShare[1].color },
                maize: { label: "Maize", color: cropShare[2].color },
                pulses: { label: "Pulses", color: cropShare[3].color },
              }}
            >
              <PieChart>
                <Pie
                  data={cropShare}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  cornerRadius={6}
                  stroke="hsl(var(--background))"
                  strokeWidth={3}
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {cropShare.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}