import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

export default function Community() {
  const posts = useQuery(api.community.list);
  const create = useMutation(api.community.create);

  const [body, setBody] = useState("");

  const submit = async () => {
    if (!body.trim()) return;
    try {
      await create({ body, images: undefined });
      setBody("");
      toast.success("Posted");
    } catch {
      toast.error("Failed to post");
    }
  };

  return (
    <AppShell title="Community">
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader><CardTitle>Create Post</CardTitle></CardHeader>
          <CardContent className="flex gap-2">
            <Input placeholder="Share your update..." value={body} onChange={(e) => setBody(e.target.value)} />
            <Button onClick={submit}>Post</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Feed</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {posts?.length ? posts.map((p) => (
              <div key={p._id} className="border rounded-md p-3">
                <div className="text-sm text-muted-foreground">{p.user?.name ?? "Anonymous"}</div>
                <div className="font-medium">{p.body}</div>
                <div className="text-xs text-muted-foreground mt-1">❤️ {p.likes} • 💬 {p.commentsCount}</div>
              </div>
            )) : <div className="text-sm text-muted-foreground">No posts yet.</div>}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
