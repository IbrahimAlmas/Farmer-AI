import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Video Tutorials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="aspect-video w-full overflow-hidden rounded-lg ring-1 ring-border">
                <img
                  src="/assets/Farm_6.webp"
                  alt="Video tutorials preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement;
                    t.src = "/assets/Farm_2.webp";
                    t.onerror = null;
                  }}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Learn step-by-step with short videos on soil testing, irrigation planning, and farm setup.
              </div>
              <div className="flex gap-2">
                <a
                  href="https://www.youtube.com/results?search_query=farming+basics+soil+irrigation"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button>Watch Tutorials</Button>
                </a>
                <a
                  href="https://www.youtube.com/results?search_query=smart+farming+india"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="outline">Explore More</Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Voice Consultancy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Get quick guidance using your voice. Ask about irrigation, crop schedules, or soil insights in your language.
              </div>
              <div className="flex gap-2">
                <a href="/dashboard">
                  <Button>Start Voice Assistant</Button>
                </a>
                <a href="/settings">
                  <Button variant="outline">Change Language</Button>
                </a>
              </div>
            </CardContent>
          </Card>
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