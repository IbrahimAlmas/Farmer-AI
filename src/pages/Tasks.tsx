import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Tasks() {
  const tasks = useQuery(api.tasks.list);
  const create = useMutation(api.tasks.create);
  const markDone = useMutation(api.tasks.markDone);

  // New: AI hooks
  const suggestions = useQuery((api as any).tasks.aiSuggestions as any) as
    | Array<{ title: string; priority: "high" | "medium" | "low"; reason: string; dueInDays: number }>
    | undefined;
  const createFromSuggestion = useMutation((api as any).tasks.createFromSuggestion as any);
  const schedule = useQuery((api as any).tasks.schedule as any) as
    | Array<{ at: number; item: string; details: string; technique?: string }>
    | undefined;

  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);

  const addTask = async () => {
    if (!title.trim()) return;
    try {
      await create({ title, notes: undefined, dueDate: undefined });
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
      await createFromSuggestion({
        title: s.title,
        reason: s.reason,
        priority: s.priority,
        dueInDays: s.dueInDays,
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: AI Suggestions */}
          <Card className="lg:col-span-2 rounded-2xl bg-white ring-1 ring-black/5">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>AI Task Suggestions</CardTitle>
              <div className="text-xs font-medium text-emerald-500">Analysis Complete ✨</div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(suggestions ?? []).map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl ring-1 ring-black/10 bg-[oklch(0.98_0.01_120)] px-3 py-3"
                >
                  <div>
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Priority:{" "}
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
                      <DialogTitle>Full Schedule Plan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 max-h-[60vh] overflow-auto">
                      {(schedule ?? []).map((it, i) => (
                        <div key={i} className="rounded-lg border p-3">
                          <div className="text-sm font-semibold">
                            {new Date(it.at).toLocaleString()}
                          </div>
                          <div className="font-medium">{it.item}</div>
                          <div className="text-sm text-muted-foreground">{it.details}</div>
                          {(it as any).farmName && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Farm: {(it as any).farmName}
                            </div>
                          )}
                          {it.technique && (
                            <div className="text-xs text-primary mt-1">Technique: {it.technique}</div>
                          )}
                        </div>
                      ))}
                      {!schedule?.length && (
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
                <CardTitle>Your Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks?.length ? (
                  tasks.map((t) => (
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
                          onClick={() => markDone({ id: t._id })}
                        >
                          Mark Done
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No tasks yet. Add tasks from AI suggestions or create your own.
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