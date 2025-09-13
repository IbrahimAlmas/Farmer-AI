import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import VoiceButton from "@/components/VoiceButton";
import { SupportedLanguages, langFromGeolocation, langFromNavigator, localeFromLang, t, type LangKey } from "@/lib/i18n";
import { Loader2, MapPin } from "lucide-react";

type Phase = "detect" | "intro" | "ask_tutorial" | "tutorial" | "done";

export default function Onboarding() {
  const [phase, setPhase] = useState<Phase>("detect");
  const [lang, setLang] = useState<LangKey>("en");
  const [detecting, setDetecting] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [userResponse, setUserResponse] = useState<string | null>(null);

  const transcribe = useAction(api.voice.stt);
  const speak = useAction(api.voice.tts);

  const translate = useMemo(() => t(lang), [lang]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Detect language on first mount
  useEffect(() => {
    (async () => {
      setDetecting(true);
      // Try geolocation → fallback to navigator
      const guess = (await langFromGeolocation()) ?? langFromNavigator();
      setLang(guess);
      setDetecting(false);
      setPhase("intro");
    })();
  }, []);

  // Speak a welcome message when entering intro
  useEffect(() => {
    if (phase !== "intro") return;
    (async () => {
      setPlaying(true);
      try {
        const text = `${translate("title.welcome")} ${translate("prompt.name")}`;
        const base64 = await speak({ text, language: `${localeFromLang(lang)}` });
        playBase64(base64);
        // After greeting, ask tutorial
        setPhase("ask_tutorial");
      } catch (e) {
        console.error("TTS failed", e);
        setPhase("ask_tutorial");
      } finally {
        setPlaying(false);
      }
    })();
  }, [phase, lang, speak, translate]);

  function playBase64(b64: string) {
    const src = `data:audio/mp3;base64,${b64}`;
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    audioRef.current.src = src;
    audioRef.current.play().catch(() => {});
  }

  // Handle transcript from mic (accent adaption can be modeled later with provider options)
  function handleTranscript(text: string) {
    setUserResponse(text);
    const yesWords = new Set(["yes", "haan", "haanji", "ஆமா", "ஆம்", "hanji", "haan ji", "haa"]);
    const noWords = new Set(["no", "nahi", "இல்லை"]);
    const tLower = text.trim().toLowerCase();
    const saidYes = [...yesWords].some((w) => tLower.includes(w));
    const saidNo = [...noWords].some((w) => tLower.includes(w));
    if (phase === "ask_tutorial") {
      if (saidYes) startTutorial();
      else if (saidNo) setPhase("done");
    }
  }

  function startTutorial() {
    setPhase("tutorial");
    // A short spoken intro to the tutorial
    (async () => {
      try {
        const base64 = await speak({
          text: translate("prompt.tutorial"),
          language: `${localeFromLang(lang)}`,
        });
        playBase64(base64);
      } catch (e) {
        console.error(e);
      }
    })();
  }

  const languagePicker = (
    <div className="flex flex-wrap gap-2 justify-center">
      {SupportedLanguages.map((l) => (
        <Button
          key={l.key}
          variant={l.key === lang ? "default" : "outline"}
          size="sm"
          onClick={() => setLang(l.key)}
        >
          {l.label}
        </Button>
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col"
    >
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="flex justify-center">
            <img
              src="./logo.svg"
              alt="Farmer AI"
              width={80}
              height={80}
              className="rounded-lg mb-6 mt-10"
            />
          </div>

          <Card className="border">
            {phase === "detect" && (
              <>
                <CardHeader className="text-center">
                  <CardTitle className="text-lg tracking-tight font-bold">
                    {translate("ui.detecting")}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>GPS + device locale</span>
                  </CardDescription>
                </CardHeader>
              </>
            )}

            {phase !== "detect" && (
              <>
                <CardHeader className="text-center">
                  <CardTitle className="text-xl tracking-tight font-bold">
                    {translate("title.welcome")}
                  </CardTitle>
                  <CardDescription>{translate("prompt.name")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-sm mb-2">{translate("ui.pickLanguage")}</div>
                    {languagePicker}
                    <div className="flex justify-center mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          setDetecting(true);
                          const guess = (await langFromGeolocation()) ?? langFromNavigator();
                          setLang(guess);
                          setDetecting(false);
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        {detecting ? "..." : "Detect from GPS"}
                      </Button>
                    </div>
                  </div>

                  {phase === "ask_tutorial" && (
                    <div className="flex items-center justify-center gap-3">
                      <Button onClick={startTutorial}>{translate("choice.yes")}</Button>
                      <Button variant="outline" onClick={() => setPhase("done")}>
                        {translate("choice.no")}
                      </Button>
                    </div>
                  )}

                  {phase === "tutorial" && (
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground text-center">
                        {translate("prompt.tutorial")}
                      </div>
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full aspect-video rounded-md border overflow-hidden bg-muted flex items-center justify-center"
                      >
                        {/* Simple animated tutorial panels */}
                        <motion.div
                          className="text-center p-4"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div className="font-semibold mb-1">1) {translate("ui.mic.hold")}</div>
                          <div className="text-xs">Push-to-talk mic below</div>
                        </motion.div>
                      </motion.div>
                      <div className="flex justify-center">
                        <Button onClick={() => setPhase("done")}>Finish</Button>
                      </div>
                    </div>
                  )}

                  {phase === "done" && (
                    <div className="text-center text-sm">
                      Onboarding complete. Use the mic to talk to your assistant anytime.
                    </div>
                  )}
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>

      <VoiceButton
        className="z-50"
        disabled={playing}
        onTranscript={handleTranscript}
        transcribe={({ audio, language }) =>
          transcribe({ audio, language: language ?? `${localeFromLang(lang)}` })
        }
        language={`${localeFromLang(lang)}`}
      />

      <audio ref={audioRef} hidden />
    </motion.div>
  );
}
