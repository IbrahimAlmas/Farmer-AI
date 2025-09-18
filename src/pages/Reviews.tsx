import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Reviews() {
  const addReview = useMutation(api.reviews.add);
  const reviews = useQuery(api.reviews.list) ?? [];

  const [name, setName] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addReview({ name: name.trim() || "Anonymous", rating, comment: comment.trim() });
      toast.success("Thank you for your review!");
      setName("");
      setRating(5);
      setComment("");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to submit review");
    }
  };

  return (
    <AppShell title="Reviews">
      <div className="mx-auto w-full max-w-4xl p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel-glass rounded-2xl p-5"
        >
          <h1 className="text-2xl font-extrabold">Share your experience</h1>
          <p className="text-muted-foreground text-sm">Your feedback helps other farmers.</p>
          <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-3">
            <Input
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Rating</label>
              <select
                className="rounded-md border bg-transparent px-3 py-2"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} {r === 1 ? "star" : "stars"}
                  </option>
                ))}
              </select>
            </div>
            <Textarea
              placeholder="Write your review..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
            <div className="flex justify-end">
              <Button type="submit" className="btn-neon rounded-xl">Submit Review</Button>
            </div>
          </form>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <Card key={r._id} className="panel-glass rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-yellow-400">{Array.from({ length: r.rating }).map((_, i) => "★").join("")}</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{r.comment}</p>
              </CardContent>
            </Card>
          ))}
          {reviews.length === 0 && (
            <div className="text-muted-foreground text-sm">No reviews yet. Be the first to share!</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
