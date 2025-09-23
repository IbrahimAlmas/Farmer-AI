import { motion, AnimatePresence } from "framer-motion";
import { ui } from "@/lib/i18n";
import VoiceButton from "@/components/VoiceButton";

type DockItem = { path: string; icon: any; label: string };

type DockProps = {
  visible: boolean;
  setVisible: (v: boolean) => void;
  leftItems: DockItem[];
  rightItems: DockItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  currentLang: string;
  isWhiteTheme?: boolean;
  onTranscript: (text: string) => Promise<void> | void;
  transcribe: (args: {
    audio: ArrayBuffer;
    language?: string;
    contentType?: string;
    filename?: string;
  }) => Promise<string>;
  language: string;
  hide?: boolean;
};

export function AppDock({
  visible,
  setVisible,
  leftItems,
  rightItems,
  currentPath,
  onNavigate,
  currentLang,
  isWhiteTheme,
  onTranscript,
  transcribe,
  language,
  hide,
}: DockProps) {
  if (hide) return null;

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 h-14 z-40 hidden md:block"
        onMouseEnter={() => setVisible(true)}
      />
      <AnimatePresence>
        {visible && (
          <motion.div
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            className="fixed left-1/2 -translate-x-1/2 z-40 hidden md:block bottom-12"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-primary/5 rounded-[22px] blur-2xl scale-110 animate-glow-pulse" />
            <div className="relative flex items-end gap-5 rounded-[22px] border bg-white/60 backdrop-blur-md text-[oklch(0.35_0.03_120)] shadow-[0_28px_80px_-20px_rgba(0,0,0,0.25)] ring-1 ring-black/5 px-6 py-3">
              {leftItems.map((item) => {
                const isActive = currentPath === item.path;
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.path}
                    onClick={() => onNavigate(item.path)}
                    aria-label={ui(currentLang as any, item.label as any)}
                    aria-current={isActive ? "page" : undefined}
                    className="group relative grid place-items-center"
                    whileHover={{
                      scale: 1.25,
                      y: -8,
                      rotate: isActive ? 0 : 5,
                      transition: { duration: 0.2 },
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div
                      className={`grid place-items-center size-16 rounded-3xl transition-all duration-150 glow-sweep
                      ${
                        isActive
                          ? "bg-primary/20 text-primary shadow-[0_0_36px_-6px_theme(colors.primary/55)] ring-2 ring-primary/30"
                          : "text-[oklch(0.45_0.03_120)] hover:text-[oklch(0.3_0.03_120)]"
                      }
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
                      {ui(currentLang as any, item.label as any)}
                    </span>
                  </motion.button>
                );
              })}

              <div className="h-16 w-px bg-black/10 mx-2 shrink-0" aria-hidden />

              <div
                className="group relative grid place-items-center shrink-0"
                aria-label={ui(currentLang as any, "Voice" as any)}
                title={ui(currentLang as any, "Voice" as any)}
              >
                <motion.div
                  className="grid place-items-center size-16 rounded-3xl transition-all duration-150 text-[oklch(0.45_0.03_120)] hover:text-[oklch(0.3_0.03_120)] hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.12)]"
                  whileHover={{ scale: 1.25, y: -8, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.95 }}
                >
                  <VoiceButton
                    embedInDock
                    className="relative"
                    onTranscript={onTranscript}
                    transcribe={transcribe}
                    language={language}
                  />
                </motion.div>
                <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/70 px-2 py-0.5 text-[11px] text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  {ui(currentLang as any, "Voice" as any)}
                </span>
              </div>

              <div className="h-16 w-px bg-black/10 mx-2 shrink-0" aria-hidden />

              {rightItems.map((item) => {
                const isActive = currentPath === item.path;
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.path}
                    onClick={() => onNavigate(item.path)}
                    aria-label={ui(currentLang as any, item.label as any)}
                    aria-current={isActive ? "page" : undefined}
                    className="group relative grid place-items-center"
                    whileHover={{
                      scale: 1.25,
                      y: -8,
                      rotate: isActive ? 0 : -5,
                      transition: { duration: 0.2 },
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div
                      className={`grid place-items-center size-16 rounded-3xl transition-all duration-150 glow-sweep
                      ${
                        isActive
                          ? "bg-primary/20 text-primary shadow-[0_0_36px_-6px_theme(colors.primary/55)] ring-2 ring-primary/30"
                          : "text-[oklch(0.45_0.03_120)] hover:text-[oklch(0.3_0.03_120)]"
                      }
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
                      {ui(currentLang as any, item.label as any)}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AppDock;