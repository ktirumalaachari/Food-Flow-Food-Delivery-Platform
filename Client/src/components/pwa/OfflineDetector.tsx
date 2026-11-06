"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";

export default function OfflineDetector() {
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!mounted || (isOnline && !showReconnected)) {
    return null;
  }

  return (
    <div className="fixed top-0 inset-x-0 z-[100] transition-all duration-300">
      {!isOnline && (
        <aside
          aria-label="Offline status banner"
          className="bg-amber-600 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-2 mx-auto">
            <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
            <span>
              <strong>You're currently offline.</strong> Serving cached content. Live orders & updates will resume once connected.
            </span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-amber-700/80 hover:bg-amber-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </aside>
      )}

      {showReconnected && (
        <aside
          aria-label="Online status banner"
          className="bg-emerald-600 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <Wifi className="w-4 h-4" />
          <span>
            <strong>Connection restored!</strong> You are back online.
          </span>
        </aside>
      )}
    </div>
  );
}
