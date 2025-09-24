import { Toaster } from "@/components/ui/sonner";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import AuthPage from "@/pages/Auth.tsx";
import Onboarding from "@/pages/Onboarding.tsx";
import Dashboard from "@/pages/Dashboard.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";
import Landing from "./pages/Landing.tsx";
import NotFound from "./pages/NotFound.tsx";
import "./types/global.d.ts";
import LanguagePicker from "@/pages/LanguagePicker.tsx";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

/**
 * Initialize theme early and force dark mode now.
 * Also persist the preference so subsequent loads stay dark.
 */
(() => {
  try {
    const rootEl = document.documentElement;
    rootEl.classList.add("dark");
    try {
      localStorage.setItem("theme", "dark");
    } catch {}
  } catch {
    // Fallback: still enable dark by default
    document.documentElement.classList.add("dark");
  }
})();

import MyFarm from "@/pages/MyFarm.tsx";
import Tasks from "@/pages/Tasks.tsx";
import Market from "@/pages/Market.tsx";
import Learn from "@/pages/Learn.tsx";
import Community from "@/pages/Community.tsx";
import SoilTest from "@/pages/SoilTest.tsx";
import Settings from "@/pages/Settings.tsx";
import LearnMore from "@/pages/LearnMore.tsx";
import OurTeam from "@/pages/OurTeam.tsx";
import OurMission from "@/pages/OurMission.tsx";
import FuturePlan from "@/pages/FuturePlan.tsx";
import CommunityCreate from "@/pages/CommunityCreate.tsx";
import FarmModelViewer from "@/pages/FarmModelViewer.tsx";
import Reviews from "@/pages/Reviews.tsx";
import FarmNew from "@/pages/FarmNew.tsx";

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    // Only post to parent if inside an iframe
    const isEmbedded = window.self !== window.top;
    if (!isEmbedded) return;

    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    // Only listen to parent navigation messages if inside an iframe
    const isEmbedded = window.self !== window.top;
    if (!isEmbedded) return;

    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VlyToolbar />
    <InstrumentationProvider>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/auth" element={<AuthPage redirectAfterAuth="/dashboard" />} />
            <Route path="/my-farm" element={<MyFarm />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/market" element={<Market />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn-more" element={<LearnMore />} />
            <Route path="/our-team" element={<OurTeam />} />
            <Route path="/our-mission" element={<OurMission />} />
            <Route path="/future-plan" element={<FuturePlan />} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/create" element={<CommunityCreate />} />
            <Route path="/soil-test" element={<SoilTest />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/farms/new" element={<FarmNew />} />
            <Route path="/language" element={<LanguagePicker />} />
            <Route path="/farm/:id/model" element={<FarmModelViewer />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </InstrumentationProvider>
  </StrictMode>,
);