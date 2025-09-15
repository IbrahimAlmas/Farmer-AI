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

  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Add: Mac-style Dock visibility and items (desktop)
  const [dockVisible, setDockVisible] = useState(false);
  const dockItems = [...navItems, ...moreItems];

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
          <div className="mx-auto w-full max-w-6xl">
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

      {/* Mac-style Dock (desktop) */}
      {!isOurTeam && (
        <>
          {/* Reveal zone to pop the dock when cursor hits bottom */}
          <div
            className="fixed inset-x-0 bottom-0 h-12 z-40 hidden md:block"
            onMouseEnter={() => setDockVisible(true)}
          />
          <div
            onMouseEnter={() => setDockVisible(true)}
            onMouseLeave={() => setDockVisible(false)}
            className={`fixed left-1/2 -translate-x-1/2 z-40 hidden md:block transition-all duration-300 ${
              dockVisible ? "opacity-100 translate-y-0 bottom-10" : "opacity-0 translate-y-6 pointer-events-none bottom-6"
            }`}
          >
            <div className="flex items-end gap-4 rounded-[22px] border bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/70 shadow-[0_28px_80px_-20px_rgba(0,0,0,0.6)] px-5 py-3">
              {dockItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    aria-label={tr(item.label)}
                    aria-current={isActive ? "page" : undefined}
                    className="group relative grid place-items-center"
                  >
                    <div
                      className={`grid place-items-center size-16 rounded-3xl transition-all duration-150
                      ${isActive ? "bg-primary/20 text-primary shadow-[0_0_36px_-6px_theme(colors.primary/55)] ring-2 ring-primary/30" : "text-foreground/80 hover:text-foreground"}
                      hover:scale-110 active:scale-95 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.55)] ring-0 active:ring-2 active:ring-primary/50`}
                    >
                      <Icon className="h-7 w-7" />
                      {isActive && (
                        <span
                          className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-primary/90 shadow-[0_0_12px_theme(colors.primary/60)]"
                          aria-hidden
                        />
                      )}
                    </div>
                    <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/70 px-2 py-0.5 text-[11px] text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                      {tr(item.label)}
                    </span>
                  </button>
                );
              })}
              {/* Divider before voice */}
              <div className="h-10 w-px bg-border/40 mx-2" aria-hidden />
              {/* Embedded Voice Button inside Dock */}
              <div
                className="group relative grid place-items-center"
                aria-label="Voice"
                title="Voice"
              >
                <div className="grid place-items-center size-16 rounded-3xl transition-all duration-150 text-foreground/80 hover:text-foreground hover:scale-110 active:scale-95 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.55)]">
                  <VoiceButton
                    embedInDock
                    className="relative"
                    onTranscript={handleVoiceCommand}
                    transcribe={({ audio, language, contentType, filename }) =>
                      transcribe({ audio, language: language ?? localeFromLang(currentLang), contentType, filename })
                    }
                    language={localeFromLang(currentLang)}
                  />
                </div>
                <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/70 px-2 py-0.5 text-[11px] text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  Voice
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}