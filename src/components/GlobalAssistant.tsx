import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Compass, Camera as CameraIcon, Upload, Wand2, Image as ImageIcon, Home, ListChecks } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

type ChatMessage = { role: "user" | "assistant"; text: string };

export function GlobalAssistant() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Open chat by default on the home page
  const [open, setOpen] = useState(pathname === "/");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text:
        'Hi! I can control the app. Try: "Open Soil Test", "Open Tasks", "Enable Camera", "Upload Photo", "Click Photo", or "Analyze Photo".',
    },
  ]);
  const [input, setInput] = useState("");

  // Add: draggable floating position state (persisted)
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    try {
      const saved = localStorage.getItem("ga_pos");
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default: bottom-right offset
    return { x: window.innerWidth - 88, y: window.innerHeight - 88 };
  });
  const draggingRef = useRef(false);
  const offsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  // Add: drag threshold + start and moved refs to distinguish click vs drag
  const startRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const movedRef = useRef(false);

  // Add: Clamp helper to keep the widget on-screen and a resize handler
  const clampPos = (x: number, y: number) => {
    const maxX = Math.max(8, window.innerWidth - 64);
    const maxY = Math.max(8, window.innerHeight - 64);
    return { x: Math.max(8, Math.min(x, maxX)), y: Math.max(8, Math.min(y, maxY)) };
  };

  useEffect(() => {
    // Clamp position on mount and when window resizes (prevents being stuck off-screen)
    const handleResize = () => {
      setPos((p) => clampPos(p.x, p.y));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const startDrag: React.MouseEventHandler<HTMLDivElement> = (e) => {
    // Start pointer tracking; only treat as drag if movement exceeds a small threshold
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    offsetRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    startRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;
    draggingRef.current = false;

    const onMove = (me: MouseEvent) => {
      const dist = Math.hypot(me.clientX - startRef.current.x, me.clientY - startRef.current.y);
      if (dist > 4 && !draggingRef.current) {
        draggingRef.current = true;
      }
      if (draggingRef.current) {
        movedRef.current = true;
        const x = me.clientX - offsetRef.current.dx;
        const y = me.clientY - offsetRef.current.dy;
        setPos(clampPos(x, y));
      }
    };

    const onUp = () => {
      // Persist position
      try {
        const p = clampPos(pos.x, pos.y);
        localStorage.setItem("ga_pos", JSON.stringify(p));
      } catch {}
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);

      // If not moved significantly, treat as a click: open chat
      if (!movedRef.current) {
        setOpen(true);
      }
      draggingRef.current = false;
      movedRef.current = false;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const push = (m: ChatMessage) => setMessages((prev) => [...prev, m]);

  // Map natural language to action ids
  const parseIntent = (text: string): string => {
    const t = text.toLowerCase().trim();

    // Navigation
    if (t.includes("open") && (t.includes("soil") || t.includes("soil test"))) return "go:soil-test";
    if (t.includes("open") && t.includes("tasks")) return "go:tasks";
    if (t.includes("open") && (t.includes("home") || t.includes("landing"))) return "go:/";
    if (t.includes("open") && t.includes("dashboard")) return "go:/dashboard";

    // SoilTest actions
    if ((t.includes("enable") || t.includes("start")) && t.includes("camera")) return "soil:enable_camera";
    if (t.includes("upload") && (t.includes("photo") || t.includes("image"))) return "soil:upload_photo";
    if ((t.includes("click") || t.includes("take") || t.includes("capture")) && (t.includes("photo") || t.includes("picture"))) return "soil:click_photo";
    if (t.includes("analyze")) return "soil:analyze_photo";
    if (t.includes("retake")) return "soil:retake";
    if (t.includes("stop") && t.includes("camera")) return "soil:stop_camera";

    if (t === "help" || t.includes("?")) return "help";
    if (t.includes("status")) return "status";
    return "";
  };

  const doIntent = async (intent: string) => {
    // Navigation
    if (intent.startsWith("go:")) {
      const target = intent.slice(3);
      if (target.startsWith("/")) {
        navigate(target);
      } else if (target === "soil-test") navigate("/soil-test");
      else if (target === "tasks") navigate("/tasks");
      else navigate("/");
      return "Navigating…";
    }

    // Soil page actions: dispatch global event
    if (intent.startsWith("soil:")) {
      const actionId = intent.replace("soil:", "");
      window.dispatchEvent(new CustomEvent("assistant:action", { detail: { actionId } }));
      // Replace replaceAll to support older TS lib targets
      return `Executing soil action: ${actionId.split("_").join(" ")}`;
    }

    if (intent === "help") {
      return 'Try: "Open Soil Test", "Open Tasks", "Enable Camera", "Upload Photo", "Click Photo", "Analyze Photo", "Retake", "Stop Camera".';
    }

    if (intent === "status") {
      return `You are on ${pathname}. I can navigate or trigger actions on supported pages.`;
    }

    return `I didn't recognize that. Type "help" to see options.`;
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    push({ role: "user", text });
    const intent = parseIntent(text);
    if (intent) {
      const reply = await doIntent(intent);
      push({ role: "assistant", text: reply });
    } else {
      push({
        role: "assistant",
        text:
          'I can help with navigation and soil actions. Try: "Open Soil Test", "Open Tasks", "Enable Camera", "Upload Photo", "Click Photo", "Analyze Photo".',
      });
    }
  };

  const suggestionActions: Array<{ id: string; label: string; icon?: React.ComponentType<any> }> = useMemo(
    () => [
      { id: "go:/", label: "Home", icon: Home },
      { id: "go:soil-test", label: "Open Soil Test", icon: ImageIcon },
      { id: "go:tasks", label: "Open Tasks", icon: ListChecks },
      { id: "soil:enable_camera", label: "Enable Camera", icon: CameraIcon },
      { id: "soil:upload_photo", label: "Upload Photo", icon: Upload },
      { id: "soil:click_photo", label: "Click Photo", icon: CameraIcon },
      { id: "soil:analyze_photo", label: "Analyze Photo", icon: Wand2 },
    ],
    []
  );

  return (
    <div
      className="fixed z-[100]"
      style={{ left: pos.x, top: pos.y }}
    >
      {!open && (
        <div
          onMouseDown={startDrag}
          className="cursor-grab active:cursor-grabbing"
          aria-label="Drag chat button"
          title="Drag me"
        >
          <Button
            className="rounded-full size-18 p-0 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <MessageSquare className="h-8 w-8" />
          </Button>
        </div>
      )}

      {open && (
        <div className="w-[320px] sm:w-[360px] rounded-2xl bg-white shadow-xl ring-1 ring-black/10 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-[oklch(0.98_0.01_120)]">
            <div className="text-sm font-semibold text-[oklch(0.22_0.02_120)]">Assistant</div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => navigate("/")}
                title="Go Home"
              >
                <Compass className="h-4 w-4" />
                <span className="text-[oklch(0.22_0.02_120)]">Home</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>

          <div className="px-3 pt-2 pb-1 border-b">
            <div className="flex flex-wrap gap-2">
              {suggestionActions.map((s) => {
                const Icon = s.icon;
                return (
                  <Button
                    key={s.id}
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={async () => {
                      const reply = await doIntent(s.id);
                      push({ role: "assistant", text: reply });
                    }}
                  >
                    {Icon ? <Icon className="h-3.5 w-3.5 mr-1.5" /> : null}
                    {s.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="h-56 overflow-y-auto px-3 py-2 space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "assistant"
                    ? "bg-[oklch(0.98_0.01_120)] text-[oklch(0.22_0.02_120)]"
                    : "bg-emerald-600 text-white ml-auto"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 p-2 border-t bg-white">
            <input
              className="flex-1 h-9 px-3 rounded-md border ring-0 outline-none text-sm text-[oklch(0.22_0.02_120)] placeholder:text-[oklch(0.5_0.02_120)]"
              placeholder="Type a command…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />
            <Button onClick={handleSend} className="h-9">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalAssistant;