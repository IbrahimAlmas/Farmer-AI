import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const { signOut } = useAuth();

  return (
    <AppShell title="Settings">
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" onClick={() => signOut()}>Sign out</Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
