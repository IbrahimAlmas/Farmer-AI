import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

export default function Market() {
  const listings = useQuery(api.market.list);
  const create = useMutation(api.market.create);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [unit, setUnit] = useState("kg");

  const add = async () => {
    if (!title || price === "" || isNaN(Number(price))) return;
    try {
      await create({ title, price: Number(price), unit, location: undefined, contact: undefined, description: undefined });
      setTitle("");
      setPrice("");
      toast.success("Listing created");
    } catch {
      toast.error("Failed to create listing");
    }
  };

  return (
    <AppShell title="Market">
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader><CardTitle>New Listing</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-2">
            <Input placeholder="Item" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Price" type="number" value={price} onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))} />
            <Input placeholder="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
            <div className="col-span-3">
              <Button onClick={add}>Post</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Listings</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {listings?.length ? listings.map((l) => (
              <div key={l._id} className="flex items-center justify-between border rounded-md p-2">
                <div>
                  <div className="font-medium">{l.title}</div>
                  <div className="text-xs text-muted-foreground">₹{l.price} / {l.unit}</div>
                </div>
              </div>
            )) : <div className="text-sm text-muted-foreground">No listings yet.</div>}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
