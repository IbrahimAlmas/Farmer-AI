import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

export default function Tasks() {
  const tasks = useQuery(api.tasks.list);
  const create = useMutation(api.tasks.create);
  const markDone = useMutation(api.tasks.markDone);

  const [title, setTitle] = useState("");

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

  return (
    <AppShell title="Tasks">
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Add Task</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input placeholder="e.g. Check irrigation" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Button onClick={addTask}>Add</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks?.length ? (
              tasks.map((t) => (
                <div key={t._id} className="flex items-center justify-between border rounded-md p-2">
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.status.toUpperCase()} {t.dueDate ? `• due ${new Date(t.dueDate).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                  {t.status !== "done" && (
                    <Button size="sm" variant="outline" onClick={() => markDone({ id: t._id })}>
                      Mark Done
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No tasks yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
