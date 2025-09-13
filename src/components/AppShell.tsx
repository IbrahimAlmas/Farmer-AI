import { Button } from "@/components/ui/button";
import { LogoDropdown } from "@/components/LogoDropdown";
import VoiceButton from "@/components/VoiceButton";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  Home, 
  Sprout, 
  CheckSquare, 
  ShoppingCart, 
  BookOpen, 
  Users, 
  Settings, 
  Camera 
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { localeFromLang, type LangKey } from "@/lib/i18n";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import LanguageSelect from "@/components/LanguageSelect";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

const navItems = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/my-farm", icon: Sprout, label: "Farm" },
  { path: "/tasks", icon: CheckSquare, label: "Tasks" },
  { path: "/soil-test", icon: Camera, label: "Soil" },
];

const moreItems = [
  { path: "/market", icon: ShoppingCart, label: "Market" },
  { path: "/learn", icon: BookOpen, label: "Learn" },
  { path: "/community", icon: Users, label: "Community" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export function AppShell({ children, title }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const transcribe = useAction(api.voice.stt);
  const profile = useQuery(api.profiles.get);

  const handleVoiceCommand = (text: string) => {
    const command = text.toLowerCase().trim();
    
    // Simple voice navigation commands
    if (command.includes("home") || command.includes("dashboard")) {
      navigate("/dashboard");
      toast.success("Navigating to dashboard");
    } else if (command.includes("farm")) {
      navigate("/my-farm");
      toast.success("Navigating to farm");
    } else if (command.includes("task")) {
      navigate("/tasks");
      toast.success("Navigating to tasks");
    } else if (command.includes("market")) {
      navigate("/market");
      toast.success("Navigating to market");
    } else if (command.includes("learn")) {
      navigate("/learn");
      toast.success("Navigating to learn");
    } else if (command.includes("community")) {
      navigate("/community");
      toast.success("Navigating to community");
    } else if (command.includes("soil") || command.includes("test")) {
      navigate("/soil-test");
      toast.success("Navigating to soil test");
    } else if (command.includes("settings")) {
      navigate("/settings");
      toast.success("Navigating to settings");
    } else {
      toast.info(`Voice command: "${text}"`);
    }
  };

  const currentLang = (profile?.preferredLang as LangKey) || "en";

  // Add: tiny translator for nav labels (extend as needed)
  const tr = (s: string) => {
    if (currentLang.startsWith("te")) {
      const te: Record<string, string> = {
        Home: "హోమ్",
        Farm: "పంటభూమి",
        Tasks: "పనులు",
        Soil: "మట్టి",
        Market: "మార్కెట్",
        Learn: "నేర్చుకోండి",
        Community: "సమాజం",
        Settings: "సెట్టింగ్స్",
        More: "మరిన్ని",
      };
      return te[s] ?? s;
    }
    return s;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-40">
        <div className="px-4 pt-[env(safe-area-inset-top)]" />
        <div className="mx-auto w-full max-w-md">
          {/* Updated glass header */}
          <div className="rounded-b-3xl border-b bg-card/70 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60 shadow-[0_6px_30px_-10px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between px-4 py-3">
              <LogoDropdown />
              <h1 className="text-base font-semibold truncate flex-1 text-center">
                {title || "KrishiMitra"}
              </h1>
              <div className="w-auto">
                <LanguageSelect size="sm" />
              </div>
            </div>
            {/* subtle gradient bar */}
            <div className="h-1 w-full bg-gradient-to-r from-primary/30 via-cyan-400/30 to-primary/30" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24">
        {children}
      </main>

      {/* Bottom Navigation (mobile-first) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30">
        <div className="pb-[calc(env(safe-area-inset-bottom))]" />
        <div className="mx-auto w-full max-w-md px-3">
          {/* Updated glass nav */}
          <div className="rounded-3xl border bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/70 shadow-[0_-10px_35px_-15px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between px-2 py-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    size="sm"
                    className={`flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-16 rounded-2xl transition-[background,transform,color] ${
                      isActive ? "text-primary bg-primary/10 shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    } hover:scale-[1.02]`}
                    onClick={() => navigate(item.path)}
                    aria-label={tr(item.label)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-[22px] w-[22px]" />
                    <span className="text-[11px] leading-none">{tr(item.label)}</span>
                  </Button>
                );
              })}

              {/* More menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-16 rounded-2xl ${
                      moreItems.some((m) => m.path === location.pathname)
                        ? "text-primary bg-primary/10 shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    } hover:scale-[1.02]`}
                    aria-label={tr("More")}
                    aria-haspopup="menu"
                  >
                    <MoreHorizontal className="h-[22px] w-[22px]" />
                    <span className="text-[11px] leading-none">{tr("More")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-44" align="end" side="top">
                  {moreItems.map((m) => {
                    const Icon = m.icon;
                    const isActive = location.pathname === m.path;
                    return (
                      <DropdownMenuItem
                        key={m.path}
                        onClick={() => navigate(m.path)}
                        className={isActive ? "text-primary" : undefined}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {tr(m.label)}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Voice Button (floats above nav safely) */}
      <VoiceButton
        className="z-50 !bottom-[92px] sm:!bottom-[92px]"
        onTranscript={handleVoiceCommand}
        transcribe={({ audio, language, contentType, filename }) =>
          transcribe({ audio, language: language ?? localeFromLang(currentLang), contentType, filename })
        }
        language={localeFromLang(currentLang)}
      />
    </div>
  );
}