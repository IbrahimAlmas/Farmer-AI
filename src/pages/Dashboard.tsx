import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Droplets, Thermometer, Home as HomeIcon, AlertTriangle, Search, Bell } from "lucide-react";
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
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

export default function Dashboard() {
  const navigate = useNavigate();

  // Replace local urgent tasks with live pending tasks (top 3, derive risk)
  const pending = useQuery(api.tasks.listPending);
  const markDone = useMutation(api.tasks.markDone);

  const urgentTasks =
    (pending ?? [])
      .slice(0, 3)
      .map((t: any) => {
        // Derive risk level from priority/keywords
        const pr = (t.priority as string | undefined)?.toLowerCase();
        const title = (t.title as string).toLowerCase();
        const notes = ((t.notes as string | undefined) ?? "").toLowerCase();

        let risk: "low" | "high" | "critical" = "low";
        if (pr === "high" || title.includes("irrigat") || notes.includes("low moisture")) {
          risk = "critical";
        } else if (pr === "medium" || title.includes("pest") || notes.includes("aphid")) {
          risk = "high";
        }

        let icon: "water" | "pest" | "price" = "price";
        if (title.includes("irrigat") || notes.includes("moisture")) icon = "water";
        else if (title.includes("pest") || notes.includes("aphid")) icon = "pest";

        return {
          id: t._id,
          title: t.title,
          due:
            t.dueDate != null
              ? `Due ${new Date(t.dueDate).toLocaleDateString()}`
              : "Today",
          done: false,
          risk,
          icon,
        };
      }) ?? [];

  const toggleTask = async (id: string) => {
    try {
      await markDone({ id: id as any });
      toast.success("Completed");
    } catch {
      toast.error("Failed to complete");
    }
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
      <div className="p-4 md:p-6 space-y-6 bg-[oklch(0.98_0.01_120)] text-[oklch(0.22_0.02_120)]">
        {/* Floating/light header updated to white theme and wider */}
        <div className="sticky top-2 z-30 mx-auto max-w-6xl flex items-center justify-between gap-3 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 px-3 py-2">
          {/* Left: Go Back to Landing */}
          <Button
            variant="ghost"
            className="rounded-xl px-3 py-2.5 text-sm md:text-base font-semibold text-[oklch(0.3_0.03_120)]"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>

          {/* Center: Brand logo + name (use project logo asset) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2">
              <img
                src="/assets/Logo_.png"
                alt="Root AI"
                className="h-8 w-8 md:h-9 md:w-9 rounded-lg object-cover ring-1 ring-black/5"
                onError={(e) => {
                  const t = e.currentTarget as HTMLImageElement;
                  if (t.src !== '/logo.svg') t.src = '/logo.svg';
                  t.onerror = null;
                }}
              />
              <span className="text-base md:text-lg font-bold tracking-wide text-[oklch(0.22_0.02_120)]">Root AI</span>
            </div>
          </div>

          {/* Right: Icons to match light header style */}
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => navigate("/learn-more")}>
              Learn More →
            </Button>
            <button
              className="grid place-items-center size-9 rounded-xl bg-[oklch(0.97_0.01_120)] ring-1 ring-black/5 text-[oklch(0.35_0.03_120)]"
              aria-label="Search"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              className="grid place-items-center size-9 rounded-xl bg-[oklch(0.97_0.01_120)] ring-1 ring-black/5 text-[oklch(0.35_0.03_120)]"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
            <img
              src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=80&auto=format&fit=crop"
              alt="Profile"
              className="h-9 w-9 rounded-full object-cover ring-1 ring-black/5"
            />
          </div>
        </div>

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-2"
        >
          <h2 className="text-2xl font-bold mb-2">
            Welcome back, Farmer! 🌾
          </h2>
          <p className="text-muted-foreground">
            Let's check on your farming progress today
          </p>
        </motion.div>

        {/* KPI strip - switch to white cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Today's ET0</div>
              <Droplets className="h-4 w-4 text-primary/80" />
            </div>
            <div className="mt-1 text-2xl font-extrabold">4.2 mm</div>
            <div className="text-xs text-emerald-400">+0.2 mm vs avg</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Avg. Moisture</div>
              <Thermometer className="h-4 w-4 text-primary/80" />
            </div>
            <div className="mt-1 text-2xl font-extrabold">46%</div>
            <div className="text-xs text-muted-foreground">Last 7 days</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Active Farms</div>
            <div className="mt-1 text-2xl font-extrabold">3</div>
            <div className="text-xs text-muted-foreground">Managed</div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Alerts</div>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-1 text-2xl font-extrabold text-amber-400">2</div>
            <div className="text-xs text-muted-foreground">Irrigation pending</div>
          </div>
        </motion.div>

        {/* Urgent Tasks — light card container and light item cards */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {urgentTasks.map((t) => (
              <div
                key={t.id}
                className="rounded-xl px-3 py-3 bg-[oklch(0.98_0.01_120)] ring-1 ring-black/5 flex items-start justify-between gap-3"
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

        {/* Analytics row — light cards */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            {/* Environmental Factors (7 days) — temp line + rainfall bars */}
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

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
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
                  stroke="#fff"
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