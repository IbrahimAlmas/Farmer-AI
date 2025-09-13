import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";

export default function Learn() {
  const [tag, setTag] = useState<string | undefined>(undefined);
  const resources = useQuery(api.resources.list, { tag });
  const tags = useQuery(api.resources.getTags);

  return (
    <AppShell title="Learn">
      <div className="p-4 space-y-4">
        <div className="flex gap-2 items-center">
          <div className="text-sm text-muted-foreground">Filter:</div>
          <Select value={tag ?? "all"} onValueChange={(v) => setTag(v === "all" ? undefined : v)}>
            <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {(tags ?? []).map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {(resources ?? []).map((r) => (
            <Card key={r._id}>
              <CardHeader><CardTitle>{r.title}</CardTitle></CardHeader>
              <CardContent>
                <div className="text-sm">{r.summary}</div>
                <a className="text-xs text-primary underline" href={r.url} target="_blank" rel="noreferrer">Open</a>
              </CardContent>
            </Card>
          ))}
          {resources?.length === 0 && <div className="text-sm text-muted-foreground">No resources for this filter.</div>}
        </div>
      </div>
    </AppShell>
  );
}
