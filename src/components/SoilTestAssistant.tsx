import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send } from "lucide-react";
import { type LangKey } from "@/lib/i18n";

type ChatMessage = { role: "user" | "assistant"; text: string };

export type SoilAssistantSuggestion = { id: string; label: string };

export function SoilTestAssistant({
  suggestions,
  onAction,
  lang,
  tr,
}: {
  suggestions: SoilAssistantSuggestion[];
  onAction: (actionId: string) => Promise<string>;
  lang: LangKey;
  tr: (k: string, f: string) => string;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: tr(
        "soil.assistant.welcome",
        'Hi! I can control this page for you. Try: "Enable Camera", "Upload Photo", "Click Photo", "Analyze Photo", "Retake", "Stop Camera", "Go to Intro", or "Status".'
      ),
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  const pushMessage = (m: ChatMessage) => setMessages((prev) => [...prev, m]);

  const handleChatSubmit = async () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");
    pushMessage({ role: "user", text });

    const t = text.toLowerCase();
    let actionId = "";
    if ((t.includes("enable") || t.includes("start")) && t.includes("camera")) actionId = "enable_camera";
    else if (t.includes("upload") && (t.includes("photo") || t.includes("image"))) actionId = "upload_photo";
    else if ((t.includes("click") || t.includes("take") || t.includes("capture")) && (t.includes("photo") || t.includes("picture") || t.includes("shot"))) actionId = "click_photo";
    else if (t.includes("analyze")) actionId = "analyze_photo";
    else if (t.includes("retake")) actionId = "retake";
    else if (t.includes("stop") && t.includes("camera")) actionId = "stop_camera";
    else if (t.includes("intro") || (t.includes("go") && t.includes("back"))) actionId = "go_intro";
    else if (t.includes("status")) actionId = "status";

    if (actionId) {
      const reply = await onAction(actionId);
      pushMessage({ role: "assistant", text: reply });
      return;
    }

    pushMessage({
      role: "assistant",
      text: tr(
        "soil.assistant.help",
        'I can help with camera and analysis actions. Try: "Enable Camera", "Upload Photo", "Click Photo", "Analyze Photo", "Retake", "Stop Camera", "Go to Intro", or "Status".'
      ),
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!chatOpen && (
        <Button
          className="rounded-full size-12 p-0 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white"
          onClick={() => setChatOpen(true)}
          aria-label={tr("soil.assistant.open", "Open Assistant")}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      )}

      {chatOpen && (
        <div className="w-[320px] sm:w-[360px] rounded-2xl bg-white shadow-xl ring-1 ring-black/10 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-[oklch(0.98_0.01_120)]">
            <div className="text-sm font-semibold">{tr("soil.assistant.title", "Soil Test Assistant")}</div>
            <Button variant="ghost" size="sm" onClick={() => setChatOpen(false)}>
              {tr("common.close", "Close")}
            </Button>
          </div>

          <div className="px-3 pt-2 pb-1 border-b">
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <Button
                  key={s.id}
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={async () => {
                    const reply = await onAction(s.id);
                    pushMessage({ role: "assistant", text: reply });
                  }}
                >
                  {s.label}
                </Button>
              ))}
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
              className="flex-1 h-9 px-3 rounded-md border ring-0 outline-none text-sm"
              placeholder={tr("soil.assistant.input_placeholder", "Type a command…")}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleChatSubmit();
              }}
            />
            <Button onClick={handleChatSubmit} className="h-9">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SoilTestAssistant;