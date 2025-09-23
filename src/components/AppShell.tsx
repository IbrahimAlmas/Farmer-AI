import { Button } from "@/components/ui/button";
import { LogoDropdown } from "@/components/LogoDropdown";
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
import { motion, AnimatePresence } from "framer-motion";
import { localeFromLang, type LangKey, ui } from "@/lib/i18n";
import { toast } from "sonner";
import LanguageSelect from "@/components/LanguageSelect";
import { useEffect, useState } from "react";
import GlobalAssistant from "@/components/GlobalAssistant";
import { AppHeader } from "@/components/appshell/Header";
import { AppDock } from "@/components/appshell/Dock";

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
  const myCommunity = useQuery(api.community_groups.myMembership);
  const tts = useAction(api.voice.tts);

  const hideTopBar = location.pathname === "/dashboard";
  const isLearnMoreSection = ["/learn-more", "/our-team", "/our-mission", "/future-plan"].includes(location.pathname);
  const isOurTeam = location.pathname === "/our-team";
  const isCommunity = location.pathname === "/community";
  const isCommunityCreate = location.pathname === "/community/create";

  // Add: use white theme wrapper for dashboard to avoid dark strip at bottom
  const isWhiteTheme = true;

  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Add: Mac-style Dock visibility and items (desktop)
  const [dockVisible, setDockVisible] = useState(false);
  const dockItems = [...navItems, ...moreItems];

  // Add: split dock items so the Voice button is exactly centered
  const mid = Math.ceil(dockItems.length / 2);
  const leftItems: Array<{ path: string; icon: any; label: string }> = dockItems.slice(0, mid);
  const rightItems: Array<{ path: string; icon: any; label: string }> = dockItems.slice(mid);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const total = (doc.scrollHeight - doc.clientHeight) || 1;
      const scrolled = Math.min(Math.max(window.scrollY / total, 0), 1);
      setScrollProgress(Math.round(scrolled * 100));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Make voice handler async to speak responses
  const handleVoiceCommand = async (text: string) => {
    const command = text.toLowerCase().trim();
    const speak = async (msg: string) => {
      try {
        const base64 = await tts({ text: msg, language: localeFromLang(currentLang) });
        const audio = new Audio(`data:audio/mp3;base64,${base64}`);
        await audio.play();
      } catch (e: any) {
        // non-blocking
      }
    };

    if (command.includes("home") || command.includes("dashboard")) {
      navigate("/dashboard");
      toast.success("Navigating to dashboard");
      await speak("Opening dashboard");
    } else if (command.includes("farm")) {
      navigate("/my-farm");
      toast.success("Navigating to farm");
      await speak("Opening your farm");
    } else if (command.includes("task")) {
      navigate("/tasks");
      toast.success("Navigating to tasks");
      await speak("Opening tasks");
    } else if (command.includes("market")) {
      navigate("/market");
      toast.success("Navigating to market");
      await speak("Opening market");
    } else if (command.includes("learn")) {
      navigate("/learn");
      toast.success("Navigating to learn");
      await speak("Opening learn");
    } else if (command.includes("community")) {
      navigate("/community");
      toast.success("Navigating to community");
      await speak("Opening community");
    } else if (command.includes("soil") || command.includes("test")) {
      navigate("/soil-test");
      toast.success("Navigating to soil test");
      await speak("Opening soil test");
    } else if (command.includes("settings")) {
      navigate("/settings");
      toast.success("Navigating to settings");
      await speak("Opening settings");
    } else {
      toast.info(`Voice command: "${text}"`);
      await speak("I heard you. Please say a command like open market, my farm, tasks, or soil test.");
    }
  };

  const currentLang = (profile?.preferredLang as LangKey) || "en";

  return (
    <div className={`min-h-screen flex flex-col ${isWhiteTheme ? "bg-[oklch(0.98_0.01_120)] text-[oklch(0.22_0.02_120)]" : "bg-background"}`}>
      {/* Header extracted */}
      <AppHeader
        pathname={location.pathname}
        title={title}
        currentLang={currentLang}
        myCommunity={myCommunity as any}
        isCommunity={isCommunity}
        isCommunityCreate={isCommunityCreate}
        isLearnMoreSection={isLearnMoreSection}
        hideTopBar={hideTopBar}
        scrollProgress={scrollProgress}
        onNavigate={(path) => navigate(path)}
      />

      {/* Main Content */}
      <main className="flex-1 pb-24">{children}</main>

      {/* Light backdrop under dock */}
      {isWhiteTheme && <div className="fixed inset-x-0 bottom-0 h-24 bg-[oklch(0.98_0.01_120)] z-10 pointer-events-none" />}

      {/* Dock extracted */}
      {!isOurTeam && (
        <AppDock
          visible={dockVisible}
          setVisible={setDockVisible}
          leftItems={leftItems}
          rightItems={rightItems}
          currentPath={location.pathname}
          onNavigate={(path) => navigate(path)}
          currentLang={currentLang}
          isWhiteTheme={isWhiteTheme}
          onTranscript={handleVoiceCommand}
          transcribe={({ audio, language, contentType, filename }) =>
            transcribe({ audio, language: language ?? localeFromLang(currentLang), contentType, filename })
          }
          language={localeFromLang(currentLang)}
          hide={false}
        />
      )}

      {/* Global Assistant */}
      <GlobalAssistant />
    </div>
  );
}