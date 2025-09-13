import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

export default function MyFarm() {
  const farms = useQuery(api.farms.list);
  const create = useMutation(api.farms.create);
  const [name, setName] = useState("");

  const add = async () => {
    if (!name.trim()) return;
    try {
      await create({ name, crops: [], location: undefined });
      setName("");
      toast.success("Farm added");
    } catch {
      toast.error("Failed to add farm");
    }
  };

  return (
    <AppShell title="My Farm">
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader><CardTitle>Add Farm</CardTitle></CardHeader>
          <CardContent className="flex gap-2">
            <Input placeholder="Farm name" value={name} onChange={(e) => setName(e.target.value)} />
            <Button onClick={add}>Add</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Your Farms</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {farms?.length ? farms.map((f) => (
              <div key={f._id} className="border rounded-md p-2">
                <div className="font-medium">{f.name}</div>
                <div className="text-xs text-muted-foreground">{(f.crops ?? []).join(", ") || "No crops yet"}</div>
              </div>
            )) : <div className="text-sm text-muted-foreground">No farms yet.</div>}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
