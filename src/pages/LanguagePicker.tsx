import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SupportedLanguages, ui, type LangKey } from "@/lib/i18n";
import { toast } from "sonner";
import { useNavigate } from "react-router";

export default function LanguagePicker() {
  const profile = useQuery(api.profiles.get);
  const update = useMutation(api.profiles.update);
  const create = useMutation(api.profiles.create);
  const navigate = useNavigate();

  const currentLang = (profile?.preferredLang || "en") as LangKey;

  const setLanguage = async (key: string) => {
    try {
      if (profile?._id) {
        await update({ preferredLang: key });
      } else {
        await create({ preferredLang: key, tutorialCompleted: false });
      }
      toast.success("Language updated");
      navigate(-1);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to set language");
    }
  };

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.01_120)] text-[oklch(0.22_0.02_120)]">
      {/* Simple header matching Landing style */}
      <header className="sticky top-4 z-30">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="flex items-center justify-between rounded-2xl bg-white shadow-sm ring-1 ring-black/5 px-3 py-2">
            <a href="/" className="flex items-center gap-2">
              <img
                src="/assets/Logo_.png"
                alt="Root Assistant"
                className="h-7 w-7 rounded-lg object-cover ring-1 ring-black/5"
                onError={(e) => {
                  const t = e.currentTarget as HTMLImageElement;
                  if (t.src !== '/logo.svg') t.src = '/logo.svg';
                  t.onerror = null;
                }}
              />
              <span className="font-semibold">Root Assistant</span>
            </a>
            <Button
              variant="secondary"
              className="rounded-xl bg-white text-[oklch(0.3_0.03_120)] hover:bg-[oklch(0.97_0.01_120)]"
              onClick={() => navigate(-1)}
            >
              {ui(currentLang, "Back")}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <Card className="rounded-2xl shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle className="tracking-tight font-bold">
              {ui(currentLang, "Choose Language")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[oklch(0.45_0.03_120)] mb-6">
              {ui(currentLang, "Select Preferred Language")}
            </p>

            {/* Grid of languages */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {SupportedLanguages.map((l) => (
                <button
                  key={l.key}
                  onClick={() => setLanguage(l.key)}
                  className={[
                    "rounded-xl border ring-1 ring-black/5 bg-white px-3 py-3 text-left",
                    "hover:bg-[oklch(0.97_0.01_120)] transition-colors",
                    currentLang === l.key ? "border-[oklch(0.69_0.17_145)]" : "border-black/10",
                  ].join(" ")}
                >
                  <div className="text-[oklch(0.22_0.02_120)] font-medium">{l.label}</div>
                  <div className="text-xs text-[oklch(0.45_0.03_120)] mt-0.5">{l.key.toUpperCase()}</div>
                </button>
              ))}
            </div>

            <p className="text-xs text-[oklch(0.45_0.03_120)] mt-6">
              {ui(currentLang, "Language Change Note")}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
