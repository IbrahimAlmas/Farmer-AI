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
import { motion, AnimatePresence } from "framer-motion";
import { localeFromLang, type LangKey, ui } from "@/lib/i18n";
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
  const tts = useAction(api.voice.tts);

  const hideTopBar = location.pathname === "/dashboard";
  const isLearnMoreSection = ["/learn-more", "/our-team", "/our-mission", "/future-plan"].includes(location.pathname);
  const isOurTeam = location.pathname === "/our-team";
  const isCommunity = location.pathname === "/community";
  const isCommunityCreate = location.pathname === "/community/create";

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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Bar - hidden on dashboard */}
      {!hideTopBar && (
        <motion.header 
          className="sticky top-0 z-40"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="px-4 pt-[env(safe-area-inset-top)]" />
          <div className="mx-auto w-full max-w-6xl">
            {/* Enhanced glass header with animations */}
            <motion.div 
              className="mx-3 md:mx-0 rounded-[22px] panel-glass bg-white/10 backdrop-blur-xl supports-[backdrop-filter]:bg-white/10 gradient-border animate-gradient-shift ring-2 ring-emerald-400/35 shadow-[0_0_40px_-10px_theme(colors.emerald.400/45)] relative overflow-visible border-beam"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              {/* Subtle moving green beam around header (blunt, rounded edge) */}
              <div
                className="pointer-events-none absolute -inset-[2px] rounded-[24px] opacity-45 bg-[conic-gradient(from_0deg,theme(colors.emerald.400)_0%,theme(colors.green.300)_25%,transparent_40%,transparent_60%,theme(colors.green.300)_75%,theme(colors.emerald.400)_100%)] animate-ring-rotate"
                aria-hidden
              />
              {/* Gentle glossy green glow behind border */}
              <div
                className="pointer-events-none absolute -inset-[3px] rounded-[26px] blur-xl opacity-80 bg-[linear-gradient(90deg,theme(colors.emerald.400/20),theme(colors.green.300/14),theme(colors.emerald.400/20))] animate-gradient-shift"
                aria-hidden
              />
              <div className="flex items-center justify-between px-4 py-3 relative">
                <LogoDropdown />
                {/* Replace title with contextual nav for Learn More section pages */}
                {[ "/learn-more", "/our-team", "/our-mission", "/future-plan" ].includes(location.pathname) ? (
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <Button
                      variant={location.pathname === "/our-team" ? "secondary" : "ghost"}
                      size="sm"
                      className="rounded-xl px-3 py-2 magnetic-hover"
                      onClick={() => navigate("/our-team")}
                    >
                      {ui(currentLang, "Our Team")}
                    </Button>
                    <Button
                      variant={location.pathname === "/our-mission" ? "secondary" : "ghost"}
                      size="sm"
                      className="rounded-xl px-3 py-2 magnetic-hover"
                      onClick={() => navigate("/our-mission")}
                    >
                      {ui(currentLang, "Our Mission")}
                    </Button>
                    <Button
                      variant={location.pathname === "/future-plan" ? "secondary" : "ghost"}
                      size="sm"
                      className="rounded-xl px-3 py-2 magnetic-hover"
                      onClick={() => navigate("/future-plan")}
                    >
                      {ui(currentLang, "Future Plan")}
                    </Button>
                  </div>
                ) : (
                  <motion.h1 
                    className="text-[15px] sm:text-base font-semibold tracking-wide truncate flex-1 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {title || "KrishiMitra"}
                  </motion.h1>
                )}
                <div className="w-auto">
                  {/* Show Home button on Learn More pages; otherwise show language selector + optional community action */}
                  {isLearnMoreSection ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl px-3 py-2 magnetic-hover"
                      onClick={() => navigate("/dashboard")}
                      aria-label="Home"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      {ui(currentLang, "Home")}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {/* Added: current community chip in header on community page (and visible if membership exists) */}
                      {isCommunity && myCommunity?.community && (
                        <motion.button
                          onClick={() => navigate("/community")}
                          className="flex items-center gap-2 rounded-xl border bg-card/70 hover:bg-card/90 transition-colors px-2.5 py-1.5 magnetic-hover"
                          aria-label="Current Community"
                          title={myCommunity.community.name}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
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
                        </motion.button>
                      )}
                      {isCommunity && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-xl px-3 py-2 magnetic-hover"
                          onClick={() => {
                            navigate("/community/create");
                          }}
                          aria-label="Create Community"
                        >
                          {ui(currentLang, "Create Community")}
                        </Button>
                      )}
                      {/* New: Show a back-to-community button on the Create page */}
                      {isCommunityCreate && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl px-3 py-2 magnetic-hover"
                          onClick={() => navigate("/community")}
                          aria-label="Back to Community"
                        >
                          {ui(currentLang, "Community")}
                        </Button>
                      )}
                      <LanguageSelect size="sm" />
                    </div>
                  )}
                </div>
              </div>
              {/* Enhanced gradient bar with scroll progress (make slightly thicker) */}
              <div className="relative h-[3px] w-full">
                <div className="absolute inset-0 bg-muted/60" />
                <motion.div
                  className="h-full bg-[linear-gradient(90deg,theme(colors.primary/60),theme(colors.cyan.400/60),theme(colors.primary/60))] animate-gradient-shift"
                  style={{ width: `${scrollProgress}%` }}
                  transition={{ duration: 0.2 }}
                  aria-hidden
                />
              </div>
            </motion.div>
          </div>
        </motion.header>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-24">
        {children}
      </main>

      {/* Enhanced Mac-style Dock (desktop) */}
      {!isOurTeam && (
        <>
          {/* Reveal zone to pop the dock when cursor hits bottom */}
          <div
            className="fixed inset-x-0 bottom-0 h-14 z-40 hidden md:block"
            onMouseEnter={() => setDockVisible(true)}
          />
          <AnimatePresence>
            {dockVisible && (
              <motion.div
                onMouseEnter={() => setDockVisible(true)}
                onMouseLeave={() => setDockVisible(false)}
                className="fixed left-1/2 -translate-x-1/2 z-40 hidden md:block bottom-12"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Ambient glow behind dock */}
                <div className="absolute inset-0 bg-primary/5 rounded-[22px] blur-2xl scale-110 animate-glow-pulse" />
                
                <div className="relative flex items-end gap-5 rounded-[22px] border bg-white text-[oklch(0.35_0.03_120)] shadow-[0_28px_80px_-20px_rgba(0,0,0,0.25)] ring-1 ring-black/5 px-6 py-3">
                  {/* Left side items */}
                  {leftItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        aria-label={ui(currentLang, item.label as any)}
                        aria-current={isActive ? "page" : undefined}
                        className="group relative grid place-items-center"
                        whileHover={{ 
                          scale: 1.25, 
                          y: -8,
                          rotate: isActive ? 0 : 5,
                          transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div
                          className={`grid place-items-center size-16 rounded-3xl transition-all duration-150 glow-sweep
                          ${isActive ? "bg-primary/20 text-primary shadow-[0_0_36px_-6px_theme(colors.primary/55)] ring-2 ring-primary/30" : "text-[oklch(0.45_0.03_120)] hover:text-[oklch(0.3_0.03_120)]"}
                          hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.12)] ring-0 active:ring-2 active:ring-primary/50`}
                        >
                          <Icon className="h-7 w-7" />
                          {isActive && (
                            <motion.span
                              className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-primary/90 shadow-[0_0_12px_theme(colors.primary/60)]"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              aria-hidden
                            />
                          )}
                        </div>
                        <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/70 px-2 py-0.5 text-[11px] text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                          {ui(currentLang, item.label as any)}
                        </span>
                      </motion.button>
                    );
                  })}

                  {/* Left Divider */}
                  <div className="h-16 w-px bg-black/10 mx-2 shrink-0" aria-hidden />

                  {/* Enhanced Embedded Voice Button centered */}
                  <div
                    className="group relative grid place-items-center shrink-0"
                    aria-label={ui(currentLang, "Voice")}
                    title={ui(currentLang, "Voice")}
                  >
                    <motion.div 
                      className="grid place-items-center size-16 rounded-3xl transition-all duration-150 text-[oklch(0.45_0.03_120)] hover:text-[oklch(0.3_0.03_120)] hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.12)]"
                      whileHover={{ 
                        scale: 1.25, 
                        y: -8,
                        transition: { duration: 0.2 }
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <VoiceButton
                        embedInDock
                        className="relative"
                        onTranscript={handleVoiceCommand}
                        transcribe={({ audio, language, contentType, filename }) =>
                          transcribe({ audio, language: language ?? localeFromLang(currentLang), contentType, filename })
                        }
                        language={localeFromLang(currentLang)}
                      />
                    </motion.div>
                    <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/70 px-2 py-0.5 text-[11px] text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                      {ui(currentLang, "Voice")}
                    </span>
                  </div>

                  {/* Right Divider */}
                  <div className="h-16 w-px bg-black/10 mx-2 shrink-0" aria-hidden />

                  {/* Right side items */}
                  {rightItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        aria-label={ui(currentLang, item.label as any)}
                        aria-current={isActive ? "page" : undefined}
                        className="group relative grid place-items-center"
                        whileHover={{ 
                          scale: 1.25, 
                          y: -8,
                          rotate: isActive ? 0 : -5,
                          transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div
                          className={`grid place-items-center size-16 rounded-3xl transition-all duration-150 glow-sweep
                          ${isActive ? "bg-primary/20 text-primary shadow-[0_0_36px_-6px_theme(colors.primary/55)] ring-2 ring-primary/30" : "text-[oklch(0.45_0.03_120)] hover:text-[oklch(0.3_0.03_120)]"}
                          hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.12)] ring-0 active:ring-2 active:ring-primary/50`}
                        >
                          <Icon className="h-7 w-7" />
                          {isActive && (
                            <motion.span
                              className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-primary/90 shadow-[0_0_12px_theme(colors.primary/60)]"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              aria-hidden
                            />
                          )}
                        </div>
                        <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/70 px-2 py-0.5 text-[11px] text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                          {ui(currentLang, item.label as any)}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}