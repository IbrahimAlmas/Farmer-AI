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

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

const navItems = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/my-farm", icon: Sprout, label: "Farm" },
  { path: "/tasks", icon: CheckSquare, label: "Tasks" },
  { path: "/market", icon: ShoppingCart, label: "Market" },
  { path: "/learn", icon: BookOpen, label: "Learn" },
  { path: "/community", icon: Users, label: "Community" },
  { path: "/soil-test", icon: Camera, label: "Soil" },
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <LogoDropdown />
          <h1 className="text-lg font-semibold truncate flex-1 text-center">
            {title || "KrishiMitra"}
          </h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-30">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => navigate(item.path)}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Voice Button */}
      <VoiceButton
        className="z-50"
        onTranscript={handleVoiceCommand}
        transcribe={({ audio, language }) =>
          transcribe({ audio, language: language ?? localeFromLang(currentLang) })
        }
        language={localeFromLang(currentLang)}
      />
    </div>
  );
}
