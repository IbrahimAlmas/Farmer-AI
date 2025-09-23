import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Tasks() {
  const create = useMutation(api.tasks.create);
  const markDone = useMutation(api.tasks.markDone);

  // Farms list (real if available)
  const farms = useQuery((api as any).farms?.list as any) as Array<{ _id?: string; name: string }> | undefined;

  // AI hooks
  const suggestions = useQuery((api as any).tasks.aiSuggestions as any) as
    | Array<{ title: string; priority: "high" | "medium" | "low"; reason: string; dueInDays: number }>
    | undefined;
  const createFromSuggestion = useMutation((api as any).tasks.createFromSuggestion as any);
  const schedule = useQuery((api as any).tasks.schedule as any) as
    | Array<{ at: number; item: string; details: string; technique?: string }>
    | undefined;

  // Selected farm (no "All" anymore) — default to first available
  const [selectedForm, setSelectedForm] = useState<string>("");

  // Load all tasks (for fallback filtering when no farmId exists)
  const tasksAll = useQuery(api.tasks.list);

  // Determine selected farmId from farms + selectedForm
  const selectedFarmId = useMemo(() => {
    if (!farms || !selectedForm) return null;
    const match = (farms as any[]).find((f) => (f?.name as string)?.toLowerCase() === selectedForm.toLowerCase());
    return match?._id ?? null;
  }, [farms, selectedForm]);

  // Load per-farm tasks when a farm is selected (uses farmId if available)
  const tasksByFarm = useQuery(
    (api as any).tasks.listByFarm as any,
    selectedFarmId ? ({ farmId: selectedFarmId } as any) : "skip"
  ) as any[] | undefined;

  // Visible tasks: prefer farmId query; otherwise fallback-filter by title against selected farm name
  const visibleTasks = useMemo(() => {
    if (selectedFarmId) return tasksByFarm ?? [];
    const all = tasksAll ?? [];
    const target = (selectedForm || "").trim().toLowerCase();
    if (!target) return [];
    return all.filter((t: any) => {
      const fromTitle = extractFarmName(t.title);
      if (fromTitle) return fromTitle.toLowerCase() === target;
      return (t.title as string)?.toLowerCase().includes(target);
    });
  }, [tasksByFarm, tasksAll, selectedFarmId, selectedForm]);

  // Auto-seed baseline tasks if a farm has none
  useEffect(() => {
    // Only run when we have a selected farm and data is loaded (no undefined)
    const loaded =
      (selectedFarmId ? tasksByFarm !== undefined : tasksAll !== undefined) &&
      suggestions !== undefined &&
      schedule !== undefined;

    if (!selectedForm || !loaded) return;

    // If the selected farm currently shows no tasks, auto-create a few baseline ones
    if ((visibleTasks?.length ?? 0) > 0) return;

    const suffix = ` — ${selectedForm}`;
    const base: Array<string> = [
      "Irrigation",
      "Fertilization",
      "Pest scouting",
      "Weed management",
    ];

    // Fire and forget: create a compact starter set for this farm
    (async () => {
      try {
        await Promise.all(
          base.map((label) => {
            const title = `${label}${suffix}`;
            return create({
              title,
              notes: undefined,
              dueDate: undefined,
              farmId: selectedFarmId as any,
            });
          }),
        );
        // A tiny delay helps the realtime subscription reflect immediately
        setTimeout(() => {
          toast.success(`Added starter tasks for ${selectedForm}`);
        }, 50);
      } catch {
        // If seeding fails (e.g., race), silently ignore to avoid loops
      }
    })();
  }, [
    selectedForm,
    selectedFarmId,
    visibleTasks,
    tasksByFarm,
    tasksAll,
    suggestions,
    schedule,
    create,
  ]);

  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);

  // Demo farm names as requested
  const demoForms = useMemo(() => ["Wheat farm", "Barely", "Rice"], []);
  const formNames = useMemo(() => {
    const names = (farms ?? []).map((f: any) => (f?.name as string) || "Farm");
    return names.length ? names : demoForms;
  }, [farms, demoForms]);

  // Initialize selectedForm to first available farm if not set
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useMemo(() => {
    if (!selectedForm && formNames.length) {
      setSelectedForm(formNames[0]);
    }
  }, [formNames, selectedForm]);

  // Helpers to extract farm name from strings like "Task — Farm Name"
  const extractFarmName = (text: string): string | null => {
    const idx = text.lastIndexOf("—");
    if (idx === -1) return null;
    const name = text.slice(idx + 1).trim();
    return name || null;
  };

  // Filtered datasets based on selected farm (no "All")
  const filteredSuggestions = useMemo(() => {
    if (!selectedForm) return [];
    const target = selectedForm.toLowerCase();
    return (suggestions ?? []).filter((s) => {
      const fromTitle = extractFarmName(s.title);
      return fromTitle ? fromTitle.toLowerCase() === target : s.title.toLowerCase().includes(target);
    });
  }, [suggestions, selectedForm]);

  const filteredSchedule = useMemo(() => {
    if (!selectedForm) return [];
    const target = selectedForm.toLowerCase();
    return (schedule ?? []).filter((it) => {
      const fromItem = extractFarmName(it.item);
      return fromItem ? fromItem.toLowerCase() === target : it.item.toLowerCase().includes(target);
    });
  }, [schedule, selectedForm]);

  const addTask = async () => {
    if (!title.trim() || !selectedForm) return;
    try {
      const suffix = ` — ${selectedForm}`;
      const needsTag = !title.toLowerCase().includes(selectedForm.toLowerCase());
      const finalTitle = needsTag ? `${title}${suffix}` : title;
      await create({ title: finalTitle, notes: undefined, dueDate: undefined, farmId: selectedFarmId as any });
      setTitle("");
      toast.success("Task added");
    } catch {
      toast.error("Failed to add task");
    }
  };

  const addSuggestion = async (s: {
    title: string;
    priority: "high" | "medium" | "low";
    reason: string;
    dueInDays: number;
  }) => {
    try {
      const needsTag = !s.title.toLowerCase().includes((selectedForm || "").toLowerCase());
      const finalTitle = needsTag && selectedForm ? `${s.title} — ${selectedForm}` : s.title;
      await createFromSuggestion({
        title: finalTitle,
        reason: s.reason,
        priority: s.priority,
        dueInDays: s.dueInDays,
        farmId: selectedFarmId as any,
      } as any);
      toast.success("Added to your tasks");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add");
    }
  };

  return (
    <AppShell title="Tasks">
      <div className="p-4 md:p-6 space-y-6 bg-[oklch(0.98_0.01_120)]">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-2xl md:text-4xl font-extrabold">Your AI-Powered Farm Schedule</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
            Our AI analyzes your farm's context to suggest the most optimal tasks. Add your own or
            let us guide you for a bountiful harvest.
          </p>
        </div>

        {/* Farm selector buttons (no "All") */}
        <div className="flex flex-wrap items-center gap-2 justify-center">
          {formNames.map((name, idx) => (
            <Button
              key={`${name}-${idx}`}
              variant={selectedForm === name ? "default" : "outline"}
              className="rounded-xl"
              onClick={() => setSelectedForm(name)}
            >
              {name}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: AI Suggestions */}
          <Card className="lg:col-span-2 rounded-2xl bg-white ring-1 ring-black/5">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>
                AI Task Suggestions{selectedForm ? ` — ${selectedForm}` : ""}
              </CardTitle>
              <div className="text-xs font-medium text-emerald-500">Analysis Complete ✨</div>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredSuggestions.slice(0, 3).map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl ring-1 ring-black/10 bg-[oklch(0.98_0.01_120)] px-3 py-3"
                >
                  <div>
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Priority{" "}
                      <span
                        className={
                          s.priority === "high"
                            ? "text-red-500"
                            : s.priority === "medium"
                            ? "text-amber-500"
                            : "text-muted-foreground"
                        }
                      >
                        {s.priority.charAt(0).toUpperCase() + s.priority.slice(1)}
                      </span>{" "}
                      — {s.reason}
                    </div>
                  </div>
                  <Button variant="secondary" onClick={() => addSuggestion(s)}>
                    Add to My Tasks
                  </Button>
                </div>
              ))}

              {/* View full schedule button */}
              <div className="pt-2">
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full md:w-auto rounded-xl bg-emerald-500 hover:bg-emerald-500/90 text-white">
                      View Complete Schedule →
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        Full Schedule Plan{selectedForm ? ` — ${selectedForm}` : ""}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 max-h-[60vh] overflow-auto">
                      {filteredSchedule.map((it, i) => {
                        const farmName = extractFarmName(it.item);
                        return (
                          <div key={i} className="rounded-lg border p-3">
                            <div className="text-sm font-semibold">
                              {new Date(it.at).toLocaleString()}
                            </div>
                            <div className="font-medium">{it.item}</div>
                            <div className="text-sm text-muted-foreground">{it.details}</div>
                            {farmName && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Farm: {farmName}
                              </div>
                            )}
                            {it.technique && (
                              <div className="text-xs text-primary mt-1">
                                Technique: {it.technique}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {!filteredSchedule.length && (
                        <div className="text-sm text-muted-foreground">No schedule produced.</div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Right: Add + Your tasks */}
          <div className="space-y-4">
            <Card className="rounded-2xl bg-white ring-1 ring-black/5">
              <CardHeader>
                <CardTitle>Add New Task</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Input
                  placeholder="e.g. Check irrigation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Button onClick={addTask}>Add</Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl bg-white ring-1 ring-black/5">
              <CardHeader>
                <CardTitle>Your Tasks{selectedForm ? ` — ${selectedForm}` : ""}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {visibleTasks?.length ? (
                  visibleTasks.slice(0, 3).map((t: any) => (
                    <div
                      key={t._id}
                      className="flex items-center justify-between border rounded-md p-2"
                    >
                      <div>
                        <div className="font-medium">{t.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.status.toUpperCase()}{" "}
                          {t.dueDate ? `• due ${new Date(t.dueDate).toLocaleDateString()}` : ""}{" "}
                          {t.priority ? `• ${t.priority}` : ""}
                        </div>
                      </div>
                      {t.status !== "done" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markDone({ id: t._id as any })}
                        >
                          Mark Done
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No tasks yet for {selectedForm || "this farm"}. Add tasks from AI suggestions or create your own.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}