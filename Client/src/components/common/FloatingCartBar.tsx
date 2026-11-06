"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export default function FloatingCartBar() {
  const pathname = usePathname();
  const { totalItems, totalPrice, openCartDrawer } = useCart();

  // Hide on checkout, payment, or success pages to avoid clutter
  const hideOnPages = ["/checkout", "/order-success", "/payment"];
  const shouldHide = hideOnPages.some((p) => pathname.startsWith(p));

  if (totalItems <= 0 || shouldHide) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 350, damping: 26 }}
        className="fixed bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-8 z-40 md:w-auto md:min-w-[340px]"
      >
        <button
          type="button"
          onClick={openCartDrawer}
          className="swiggy-btn w-full flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#60B246] to-[#16A34A] hover:from-[#529E3C] hover:to-[#15803D] text-white shadow-[0_10px_28px_rgba(96,178,70,0.45)] border border-emerald-400/30 backdrop-blur-md cursor-pointer transition-all"
          aria-label="View shopping cart"
        >
          {/* Left: Items count & price */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">
                {totalItems} {totalItems === 1 ? "Item" : "Items"} Added
              </p>
              <p className="text-base font-black tracking-tight text-white">
                ₹{totalPrice.toLocaleString("en-IN")}
                <span className="text-xs font-normal text-emerald-100 ml-1.5 opacity-90">
                  plus taxes
                </span>
              </p>
            </div>
          </div>

          {/* Right: View Cart CTA */}
          <div className="flex items-center gap-2 pl-3 border-l border-white/20">
            <span className="text-xs sm:text-sm font-extrabold tracking-wider uppercase text-white">
              View Cart
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25 text-white">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
