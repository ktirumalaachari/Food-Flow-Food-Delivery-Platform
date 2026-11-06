"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  UtensilsCrossed,
  Sparkles,
  ShoppingCart,
  ShoppingBag,
  User,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useSession } from "@/lib/auth-client";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems, openCartDrawer } = useCart();
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Do not show bottom nav inside admin or restaurant dashboard screens to avoid obscuring workspace controls
  if (pathname.startsWith("/dashboard/admin") || pathname.startsWith("/dashboard/restaurant")) {
    return null;
  }

  const user = session?.user;
  const isHome = pathname === "/";
  const isDishes = pathname === "/dishes" || pathname.startsWith("/restaurants");
  const isAi = pathname === "/ai" || pathname.startsWith("/ai");
  const isAccount = pathname.startsWith("/dashboard") || pathname.startsWith("/auth");

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 shadow-[0_-10px_35px_rgba(0,0,0,0.06)] px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Home */}
        <Link
          href="/"
          className="flex-1 flex flex-col items-center justify-center py-1 group cursor-pointer"
        >
          <motion.div
            whileTap={{ scale: 0.9 }}
            className={`flex flex-col items-center gap-1 ${
              isHome ? "text-[#FF6B35]" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div
              className={`p-1.5 rounded-2xl transition-all ${
                isHome ? "bg-orange-50 text-[#FF6B35] shadow-xs" : "bg-transparent"
              }`}
            >
              <Home className={`w-5 h-5 ${isHome ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            </div>
            <span className={`text-[10px] tracking-tight ${isHome ? "font-bold text-[#FF6B35]" : "font-medium text-gray-500"}`}>
              Home
            </span>
          </motion.div>
        </Link>

        {/* 2. Dishes / Explore */}
        <Link
          href="/dishes"
          className="flex-1 flex flex-col items-center justify-center py-1 group cursor-pointer"
        >
          <motion.div
            whileTap={{ scale: 0.9 }}
            className={`flex flex-col items-center gap-1 ${
              isDishes ? "text-[#FF6B35]" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div
              className={`p-1.5 rounded-2xl transition-all ${
                isDishes ? "bg-orange-50 text-[#FF6B35] shadow-xs" : "bg-transparent"
              }`}
            >
              <UtensilsCrossed className={`w-5 h-5 ${isDishes ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            </div>
            <span className={`text-[10px] tracking-tight ${isDishes ? "font-bold text-[#FF6B35]" : "font-medium text-gray-500"}`}>
              Dishes
            </span>
          </motion.div>
        </Link>

        {/* 3. AI Food Guide (Hero Center Tab) */}
        <Link
          href="/ai"
          className="flex-1 flex flex-col items-center justify-center py-1 group cursor-pointer"
        >
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={`relative p-2 rounded-2xl transition-all ${
                isAi
                  ? "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/30 scale-105"
                  : "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-600 border border-orange-200/60"
              }`}
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <span
              className={`text-[10px] tracking-tight ${
                isAi ? "font-bold text-[#FF6B35]" : "font-semibold text-gray-600"
              }`}
            >
              AI Guide
            </span>
          </motion.div>
        </Link>

        {/* 4. Cart Drawer Trigger */}
        <button
          type="button"
          onClick={openCartDrawer}
          className="flex-1 flex flex-col items-center justify-center py-1 group cursor-pointer focus:outline-none"
        >
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-[#FF6B35]"
          >
            <div className="relative p-1.5 rounded-2xl transition-all">
              <ShoppingCart className="w-5 h-5 stroke-[1.8] group-hover:text-[#FF6B35]" />
              {isMounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-[10px] font-extrabold text-white shadow-sm ring-2 ring-white animate-pop">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium text-gray-500 group-hover:text-[#FF6B35] tracking-tight">
              Cart
            </span>
          </motion.div>
        </button>

        {/* 5. Orders / Profile */}
        <Link
          href={
            user
              ? (user as any)?.role === "restaurant"
                ? "/dashboard/restaurant"
                : (user as any)?.role === "admin"
                ? "/dashboard/admin"
                : "/dashboard/customer/orders"
              : "/auth/login"
          }
          className="flex-1 flex flex-col items-center justify-center py-1 group cursor-pointer"
        >
          <motion.div
            whileTap={{ scale: 0.9 }}
            className={`flex flex-col items-center gap-1 ${
              isAccount ? "text-[#FF6B35]" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div
              className={`p-1.5 rounded-2xl transition-all ${
                isAccount ? "bg-orange-50 text-[#FF6B35] shadow-xs" : "bg-transparent"
              }`}
            >
              {user ? (
                <ShoppingBag className={`w-5 h-5 ${isAccount ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              ) : (
                <User className={`w-5 h-5 ${isAccount ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              )}
            </div>
            <span className={`text-[10px] tracking-tight ${isAccount ? "font-bold text-[#FF6B35]" : "font-medium text-gray-500"}`}>
              {user ? "Orders" : "Sign In"}
            </span>
          </motion.div>
        </Link>
      </div>
    </nav>
  );
}
