"use client";

import React from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { usePwaInstall } from "./usePwaInstall";

interface PwaInstallButtonProps {
  className?: string;
  variant?: "pill" | "outline" | "solid";
  showIfInstalled?: boolean;
}

export default function PwaInstallButton({
  className = "",
  variant = "pill",
  showIfInstalled = false,
}: PwaInstallButtonProps) {
  const [mounted, setMounted] = React.useState(false);
  const { isInstalled, isInstallable, isIOS, triggerInstall } = usePwaInstall();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (isInstalled && !showIfInstalled) {
    return null;
  }

  if (isInstalled && showIfInstalled) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        App Installed
      </span>
    );
  }

  // If neither installable nor iOS, keep available for user to trigger or test
  const getStyles = () => {
    switch (variant) {
      case "outline":
        return "border border-orange-500/40 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30";
      case "solid":
        return "bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20";
      case "pill":
      default:
        return "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm";
    }
  };

  return (
    <button
      onClick={() => triggerInstall()}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer ${getStyles()} ${className}`}
      title="Install Food Flow App on your device"
    >
      <Download className="w-3.5 h-3.5 animate-bounce" />
      <span>Install App</span>
    </button>
  );
}
