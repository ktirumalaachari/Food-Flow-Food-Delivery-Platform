"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { WifiOff, RefreshCw, Home, Phone, ShoppingBag } from "lucide-react";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setChecking(true);
    try {
      await fetch("/api/stats", { method: "HEAD", cache: "no-store" });
      setIsOnline(true);
      window.location.href = "/";
    } catch {
      setIsOnline(false);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-xl shadow-orange-500/5 text-center">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold mb-6 transition-all duration-300">
          {isOnline ? (
            <span className="bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
              Back Online — Redirecting...
            </span>
          ) : (
            <span className="bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500"></span>
              No Internet Connection
            </span>
          )}
        </div>

        {/* Icon */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 mb-6 shadow-inner ring-1 ring-orange-500/20">
          <WifiOff className="w-10 h-10 animate-pulse" />
        </div>

        {/* Title & Desc */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          You're Currently Offline
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
          Food Flow couldn't reach the server. Please check your mobile data or Wi-Fi network. Cached parts of your session will still be available.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-semibold shadow-lg shadow-orange-600/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking Connection..." : "Retry Connection"}
          </button>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-all"
          >
            <Home className="w-4 h-4" />
            Go to Cached Home
          </Link>
        </div>

        {/* Quick Help */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-around text-xs text-gray-500 dark:text-gray-400">
          <Link
            href="/dashboard/customer/orders"
            className="flex items-center gap-1.5 hover:text-orange-600 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            My Orders
          </Link>
          <span className="text-gray-300 dark:text-gray-700">•</span>
          <a
            href="tel:+9118002023344"
            className="flex items-center gap-1.5 hover:text-orange-600 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            Helpline: 1800-202-3344
          </a>
        </div>
      </div>
    </div>
  );
}
