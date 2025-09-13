import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Option = { label: string; value: string };

const options: Array<Option> = [
  { label: "English", value: "en" },
  { label: "తెలుగు (Telugu)", value: "te" },
  { label: "हिन्दी (Hindi)", value: "hi" },
];

export default function LanguageSelect({ size = "sm" }: { size?: "sm" | "md" }) {
  const profile = useQuery(api.profiles.get);
  const update = useMutation(api.profiles.update);
  const create = useMutation(api.profiles.create);
  const [saving, setSaving] = useState(false);

  const current = useMemo(() => {
    const raw = String(profile?.preferredLang || "en").toLowerCase();
    if (raw.startsWith("te")) return "te";
    if (raw.startsWith("hi")) return "hi";
    return "en";
  }, [profile?.preferredLang]);

  const onChange = async (value: string) => {
    try {
      setSaving(true);
      if (profile?._id) {
        await update({ preferredLang: value });
        toast.success("Language updated");
      } else {
        await create({ preferredLang: value, tutorialCompleted: false });
        toast.success("Language set");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to set language");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Select value={current} onValueChange={onChange} disabled={saving}>
      <SelectTrigger className={size === "sm" ? "h-8 w-[120px] rounded-xl" : "h-10 w-[150px] rounded-xl"}>
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
