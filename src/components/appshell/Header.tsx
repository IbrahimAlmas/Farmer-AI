import { Button } from "@/components/ui/button";
import { LogoDropdown } from "@/components/LogoDropdown";
import { Home } from "lucide-react";
import { motion } from "framer-motion";
import { ui } from "@/lib/i18n";
import LanguageSelect from "@/components/LanguageSelect";

type HeaderProps = {
  pathname: string;
  title?: string;
  currentLang: string;
  myCommunity?: { community?: { name: string; image?: string } } | null;
  isCommunity: boolean;
  isCommunityCreate: boolean;
  isLearnMoreSection: boolean;
  hideTopBar: boolean;
  scrollProgress: number;
  onNavigate: (path: string) => void;
};

export function AppHeader({
  pathname,
  title,
  currentLang,
  myCommunity,
  isCommunity,
  isCommunityCreate,
  isLearnMoreSection,
  hideTopBar,
  scrollProgress,
  onNavigate,
}: HeaderProps) {
  if (hideTopBar) return null;

  return (
    <motion.header
      className="sticky top-0 z-40"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="px-4 pt-[env(safe-area-inset-top)]" />
      <div className="mx-auto w-full max-w-6xl">
        <motion.div
          className="mx-3 md:mx-0 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 relative overflow-hidden"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between px-4 py-3 relative">
            <LogoDropdown />
            {["/learn-more", "/our-team", "/our-mission", "/future-plan"].includes(pathname) ? (
              <div className="flex-1 flex items-center justify-center gap-2">
                <Button
                  variant={pathname === "/our-team" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-xl px-3 py-2"
                  onClick={() => onNavigate("/our-team")}
                >
                  {ui(currentLang as any, "Our Team" as any)}
                </Button>
                <Button
                  variant={pathname === "/our-mission" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-xl px-3 py-2"
                  onClick={() => onNavigate("/our-mission")}
                >
                  {ui(currentLang as any, "Our Mission" as any)}
                </Button>
                <Button
                  variant={pathname === "/future-plan" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-xl px-3 py-2"
                  onClick={() => onNavigate("/future-plan")}
                >
                  {ui(currentLang as any, "Future Plan" as any)}
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
              {isLearnMoreSection ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl px-3 py-2"
                  onClick={() => onNavigate("/dashboard")}
                  aria-label="Home"
                >
                  <Home className="h-4 w-4 mr-2" />
                  {ui(currentLang as any, "Home" as any)}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  {isCommunity && myCommunity?.community && (
                    <motion.button
                      onClick={() => onNavigate("/community")}
                      className="flex items-center gap-2 rounded-xl border bg-card/70 hover:bg-card/90 transition-colors px-2.5 py-1.5"
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
                          if (t.src !== "/logo.png") t.src = "/logo.png";
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
                      className="rounded-xl px-3 py-2"
                      onClick={() => onNavigate("/community/create")}
                      aria-label="Create Community"
                    >
                      {ui(currentLang as any, "Create Community" as any)}
                    </Button>
                  )}
                  {isCommunityCreate && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl px-3 py-2"
                      onClick={() => onNavigate("/community")}
                      aria-label="Back to Community"
                    >
                      {ui(currentLang as any, "Community" as any)}
                    </Button>
                  )}
                  <LanguageSelect size="sm" />
                </div>
              )}
            </div>
          </div>
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
  );
}

export default AppHeader;
