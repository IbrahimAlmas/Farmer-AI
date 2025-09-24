import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import LanguageSelect from "@/components/LanguageSelect";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ui, type LangKey } from "@/lib/i18n";

export default function Settings() {
  const { signOut } = useAuth();
  const profile = useQuery(api.profiles.get);
  const lang = (profile?.preferredLang || "en") as LangKey;

  return (
    <AppShell title={ui(lang, "Settings")}>
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{ui(lang, "Choose Language")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {ui(lang, "Select Preferred Language")}
              </label>
              <LanguageSelect size="md" />
              <p className="text-xs text-muted-foreground mt-1">
                {ui(lang, "Language Change Note")}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>{ui(lang, "Account")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" onClick={() => signOut()}>
              {ui(lang, "Sign out")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}