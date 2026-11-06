"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Flame,
  UtensilsCrossed,
  Soup,
  Cake,
  Coffee,
  Wheat,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Salad,
  Pizza as PizzaIcon,
} from "lucide-react";

const circularCategories = [
  {
    name: "Biryani",
    count: "150+ dishes",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80",
    offer: "Flat 20% OFF",
  },
  {
    name: "Pizza",
    count: "120+ dishes",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80",
    offer: "From ₹199",
  },
  {
    name: "Burgers",
    count: "95+ dishes",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
    offer: "BOGO Deals",
  },
  {
    name: "Chinese",
    count: "110+ dishes",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&q=80",
    offer: "Top Rated",
  },
  {
    name: "Rolls",
    count: "75+ dishes",
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80",
    offer: "Fast Delivery",
  },
  {
    name: "North Indian",
    count: "140+ dishes",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=400&q=80",
    offer: "Chef Special",
  },
  {
    name: "Pasta",
    count: "65+ dishes",
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=400&q=80",
    offer: "Authentic",
  },
  {
    name: "Desserts",
    count: "80+ dishes",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80",
    offer: "Sweet Bites",
  },
  {
    name: "Healthy",
    count: "50+ dishes",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80",
    offer: "Organic & Fresh",
  },
  {
    name: "Drinks",
    count: "45+ choices",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80",
    offer: "Chilled",
  },
];

const featuredCards = [
  {
    name: "Authentic Biryani Hubs",
    tagline: "Dum cooked to fragrant perfection with premium spices",
    category: "biryani",
    count: "150+ options",
    discount: "FLAT 40% OFF",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Artisan Wood-Fired Pizzas",
    tagline: "Crisp crust, gourmet mozzarella & sizzling toppings",
    category: "pizza",
    count: "120+ options",
    discount: "ITEMS AT ₹249",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Sizzling Gourmet Burgers",
    tagline: "Juicy grilled patties loaded with melted cheese & sauces",
    category: "burgers",
    count: "95+ options",
    discount: "BUY 1 GET 1",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Indo-Chinese Wok Special",
    tagline: "Fiery noodles, Manchurian, fried rice & dim sums",
    category: "chinese",
    count: "110+ options",
    discount: "UPTO ₹100 OFF",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
  },
];

export default function FoodCategories() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden bg-white py-12 sm:py-16 border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* ================= SWIGGY "WHAT'S ON YOUR MIND?" CAROUSEL ================= */}
        <div className="mb-14">
          <div className="flex items-center justify-between pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-[#FC8019] animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#FC8019]">
                  Live Food Discovery
                </span>
              </div>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#282C3F]">
                What&apos;s on your mind?
              </h2>
            </div>

            {/* Scroll Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                className="swiggy-btn flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer shadow-xs"
                aria-label="Scroll categories left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                className="swiggy-btn flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer shadow-xs"
                aria-label="Scroll categories right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Horizontal Scrolling Circular Category Track */}
          <div
            ref={scrollRef}
            className="flex items-start gap-5 sm:gap-7 overflow-x-auto no-scrollbar scroll-smooth py-3 px-1 -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {circularCategories.map((cat, idx) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.04 }}
                className="shrink-0"
              >
                <Link
                  href={`/dishes?category=${cat.name.toLowerCase()}`}
                  className="group flex flex-col items-center text-center cursor-pointer"
                >
                  {/* Circular Avatar with Swiggy Hover Ring */}
                  <div className="relative mb-2.5">
                    <div className="swiggy-cat-circle h-24 w-24 sm:h-32 sm:w-32 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-orange-400 via-amber-300 to-orange-500 shadow-md">
                      <div className="h-full w-full rounded-full overflow-hidden bg-white">
                        <img
                          src={cat.image}
                          alt={cat.name}
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.dataset.hasFallback) {
                              target.dataset.hasFallback = "true";
                              target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80";
                            }
                          }}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-115"
                        />
                      </div>
                    </div>

                    {/* Offer Tag Badge */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 py-0.5 shadow-sm border border-orange-200 text-[10px] font-extrabold text-[#FC8019]">
                      {cat.offer}
                    </div>
                  </div>

                  {/* Title & Count */}
                  <span className="text-sm sm:text-base font-bold text-[#282C3F] group-hover:text-[#FC8019] transition-colors duration-200">
                    {cat.name}
                  </span>
                  <span className="text-[11px] font-medium text-gray-400 mt-0.5">
                    {cat.count}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ================= FEATURED CUISINE COLLECTIONS ================= */}
        <div className="pt-6 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#686B78]">
                Curated Collections
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#282C3F] tracking-tight">
                Top Food Collections in Berhampur
              </h3>
            </div>
            <Link
              href="/dishes"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#FC8019] hover:text-[#FF5200] group"
            >
              See all cuisines &amp; dishes
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCards.map((card, idx) => (
              <motion.div
                key={card.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
              >
                <Link
                  href={`/dishes?category=${card.category}`}
                  className="group relative block overflow-hidden rounded-2xl bg-white border border-gray-200/80 shadow-xs swiggy-card"
                >
                  {/* Food Image with Ribbon */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <img
                      src={card.image}
                      alt={card.name}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.dataset.hasFallback) {
                          target.dataset.hasFallback = "true";
                          target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
                        }
                      }}
                      className="swiggy-img-zoom h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                    {/* Swiggy Discount Ribbon */}
                    <div className="absolute bottom-2.5 left-3">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white drop-shadow-md">
                        {card.discount}
                      </span>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-4">
                    <h4 className="text-base font-bold text-[#282C3F] group-hover:text-[#FC8019] transition-colors line-clamp-1">
                      {card.name}
                    </h4>
                    <p className="mt-1 text-xs text-[#686B78] line-clamp-2 leading-relaxed">
                      {card.tagline}
                    </p>

                    <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-gray-100 text-xs font-semibold">
                      <span className="text-gray-400">{card.count}</span>
                      <span className="text-[#FC8019] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Explore &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
