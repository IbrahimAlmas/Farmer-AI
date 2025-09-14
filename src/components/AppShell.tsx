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
import { useEffect, useState } from "react";

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

  const hideTopBar = location.pathname === "/dashboard";
  const isLearnMoreSection = ["/learn-more", "/our-team", "/our-mission", "/future-plan"].includes(location.pathname);
  const isOurTeam = location.pathname === "/our-team";
  const isCommunity = location.pathname === "/community";
  const isCommunityCreate = location.pathname === "/community/create";

  // Add: live time and scroll progress
  const [now, setNow] = useState<Date>(new Date());
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

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
      {/* Top Bar - hidden on dashboard */}
      {!hideTopBar && (
        <header className="sticky top-0 z-40">
          <div className="px-4 pt-[env(safe-area-inset-top)]" />
          <div className="mx-auto w-full max-w-2xl">
            {/* Updated glass header - cleaner, floating pill */}
            <div className="mx-3 md:mx-0 rounded-2xl border bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/70 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)] ring-1 ring-black/5">
              <div className="flex items-center justify-between px-4 py-3">
                <LogoDropdown />
                {/* Replace title with contextual nav for Learn More section pages */}
                {[ "/learn-more", "/our-team", "/our-mission", "/future-plan" ].includes(location.pathname) ? (
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <Button
                      variant={location.pathname === "/our-team" ? "secondary" : "ghost"}
                      size="sm"
                      className="rounded-xl px-3 py-2"
                      onClick={() => navigate("/our-team")}
                    >
                      Our Team
                    </Button>
                    <Button
                      variant={location.pathname === "/our-mission" ? "secondary" : "ghost"}
                      size="sm"
                      className="rounded-xl px-3 py-2"
                      onClick={() => navigate("/our-mission")}
                    >
                      Our Mission
                    </Button>
                    <Button
                      variant={location.pathname === "/future-plan" ? "secondary" : "ghost"}
                      size="sm"
                      className="rounded-xl px-3 py-2"
                      onClick={() => navigate("/future-plan")}
                    >
                      Future Plan
                    </Button>
                  </div>
                ) : (
                  <h1 className="text-[15px] sm:text-base font-semibold tracking-wide truncate flex-1 text-center">
                    {title || "KrishiMitra"}
                  </h1>
                )}
                <div className="w-auto">
                  {/* Show Home button on Learn More pages; otherwise show language selector + optional community action */}
                  {isLearnMoreSection ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl px-3 py-2"
                      onClick={() => navigate("/dashboard")}
                      aria-label="Home"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Home
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {/* Added: current community chip in header on community page (and visible if membership exists) */}
                      {isCommunity && myCommunity?.community && (
                        <button
                          onClick={() => navigate("/community")}
                          className="flex items-center gap-2 rounded-xl border bg-card/70 hover:bg-card/90 transition-colors px-2.5 py-1.5"
                          aria-label="Current Community"
                          title={myCommunity.community.name}
                        >
                          <img
                            src={myCommunity.community.image ?? "/assets/Logo_.png"}
                            alt={myCommunity.community.name}
                            className="h-6 w-6 rounded-lg object-cover"
                            onError={(e) => {
                              const t = e.currentTarget as HTMLImageElement;
                              if (t.src !== '/logo.png') t.src = '/logo.png';
                              t.onerror = null;
                            }}
                          />
                          <span className="text-xs font-medium truncate max-w-[120px]">
                            {myCommunity.community.name}
                          </span>
                        </button>
                      )}
                      {isCommunity && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-xl px-3 py-2"
                          onClick={() => {
                            navigate("/community/create");
                          }}
                          aria-label="Create Community"
                        >
                          Create Community
                        </Button>
                      )}
                      {/* New: Show a back-to-community button on the Create page */}
                      {isCommunityCreate && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl px-3 py-2"
                          onClick={() => navigate("/community")}
                          aria-label="Back to Community"
                        >
                          Community
                        </Button>
                      )}
                      {/* New: Live clock pill (dynamic element) */}
                      <div
                        className="hidden sm:flex items-center gap-2 rounded-xl border bg-card/70 px-2.5 py-1.5 text-xs text-muted-foreground"
                        title="Live time"
                        aria-label="Live time"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500/50 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="tabular-nums">
                          {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>
                      <LanguageSelect size="sm" />
                    </div>
                  )}
                </div>
              </div>
              {/* subtle gradient bar enhanced with scroll progress */}
              <div className="relative h-[2px] w-full">
                <div className="absolute inset-0 bg-muted/60" />
                <div
                  className="h-full bg-[linear-gradient(90deg,theme(colors.primary/60),theme(colors.cyan.400/60),theme(colors.primary/60))] transition-[width] duration-200"
                  style={{ width: `${scrollProgress}%` }}
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-24">
        {children}
      </main>

      {/* Bottom Navigation (mobile-first) */}
      {!isOurTeam && (
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
                      className={`relative flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-16 rounded-2xl transition-[background,transform,color] ${
                        isActive ? "text-primary bg-primary/10 shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      } hover:scale-[1.02]`}
                      onClick={() => navigate(item.path)}
                      aria-label={tr(item.label)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className="h-[22px] w-[22px]" />
                      <span className="text-[11px] leading-none">{tr(item.label)}</span>
                      {/* Active indicator: animated underline */}
                      {isActive && (
                        <span className="mt-1 h-1 w-6 rounded-full bg-primary/80 animate-pulse" aria-hidden />
                      )}
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
                      {moreItems.some((m) => m.path === location.pathname) && (
                        <span className="mt-1 h-1 w-6 rounded-full bg-primary/80 animate-pulse" aria-hidden />
                      )}
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
      )}

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