"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Download, X, Share2, PlusSquare, Smartphone, Check } from "lucide-react";
import { usePwaInstall } from "./usePwaInstall";

const DISMISS_KEY = "foodflow_pwa_dismiss_until";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function PwaInstallPrompt() {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    showIOSModal,
    setShowIOSModal,
    triggerInstall,
  } = usePwaInstall();

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if dismissed
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      return;
    }

    // Delay banner showing so user can first see the home screen
    const timer = setTimeout(() => {
      if (!isInstalled && (isInstallable || isIOS)) {
        setVisible(true);
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, isIOS]);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(
      DISMISS_KEY,
      (Date.now() + DISMISS_DURATION_MS).toString()
    );
  };

  const handleInstallClick = async () => {
    const outcome = await triggerInstall();
    if (outcome === "accepted") {
      setVisible(false);
    }
  };

  return (
    <>
      {/* ── Desktop & Mobile Banner ── */}
      {visible && !isInstalled && (
        <aside
          aria-label="PWA install banner"
          className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-40 max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg p-4 sm:p-4.5 rounded-3xl shadow-2xl border border-orange-500/20 shadow-orange-500/10 flex items-center gap-3.5 animate-in slide-in-from-bottom-6 duration-300"
        >
          {/* App Icon */}
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-md shrink-0 bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/40 p-1 flex items-center justify-center">
            <Image
              src="/icons/icon-96x96.png"
              alt="FoodFlow App"
              width={44}
              height={44}
              className="object-contain"
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                Food Flow App
              </span>
              <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400">
                Fast & Light
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              Install for instant orders & offline menu
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-xs font-semibold shadow-md shadow-orange-600/20 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss install banner"
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* ── iOS Installation Modal ── */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 text-center relative animate-in slide-in-from-bottom-8 duration-300">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-orange-500/10 flex items-center justify-center text-orange-600">
              <Smartphone className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Install Food Flow on iOS
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Install Food Flow on your iPhone or iPad home screen for full-screen ordering:
            </p>

            <div className="space-y-3 text-left mb-6">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  1. Tap the <strong>Share</strong> button at the bottom of Safari.
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  2. Scroll down and tap <strong>Add to Home Screen</strong>.
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  3. Tap <strong>Add</strong> in the top-right corner.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
            >
              Got It!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
