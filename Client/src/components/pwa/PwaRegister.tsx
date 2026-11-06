"use client";

import { useEffect, useState } from "react";
import { RefreshCw, CheckCircle2 } from "lucide-react";

export default function PwaRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        setRegistration(reg);

        // Check for updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New update available
                setUpdateAvailable(true);
              }
            });
          }
        });

        // Listen for controllerchange (page refresh after skipWaiting)
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      } catch (err) {
        console.warn("[PWA] Service worker registration error:", err);
      }
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
      return () => window.removeEventListener("load", registerSW);
    }
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    } else {
      window.location.reload();
    }
  };

  if (!updateAvailable) return null;

  return (
    <aside
      aria-label="App update notification"
      className="fixed bottom-20 md:bottom-6 right-4 z-50 max-w-sm bg-gray-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-gray-800 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
          <RefreshCw className="w-5 h-5 animate-spin" />
        </div>
        <div>
          <p className="text-xs font-semibold text-white">Update Ready</p>
          <p className="text-[11px] text-gray-400">
            A new version of FoodFlow is available.
          </p>
        </div>
      </div>
      <button
        onClick={handleUpdate}
        className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
      >
        Refresh
      </button>
    </aside>
  );
}
