"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AiMarkdownRenderer from "@/components/ai/AiMarkdownRenderer";
import {
  Send,
  Bot,
  User,
  Loader2,
  ShoppingCart,
  Package,
  UtensilsCrossed,
  RotateCcw,
  Plus,
  Minus,
  Check,
  Flame,
  Star,
  Sparkles,
  Phone,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShoppingBag,
  Heart,
  Store,
  Bike,
  ShieldCheck,
  Trash2,
  ArrowRight,
  ExternalLink,
  Banknote,
  LayoutDashboard,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useCart } from "@/contexts/CartContext";
import { IGlobalFoodItem } from "@/types/restaurant";
import { 
  getUserFavoritesApi, 
  toggleFavoriteApi, 
  removeFavoriteApi 
} from "@/lib/api/favorite";
import { TFavoriteItem } from "@/types/favorite";
import { toast } from "react-toastify";
import { getRealTimeLocation, subscribeLocation, ILocationInfo, DEFAULT_INITIAL_LOCATION } from "@/lib/location";

/* ------------------------------------------------------------------ */
/*  Types & Interfaces                                                */
/* ------------------------------------------------------------------ */

interface RecommendedFood {
  id: string;
  restaurantId?: string;
  name: string;
  price: number;
  discountPrice?: number;
  restaurantName?: string;
  image?: string;
  rating?: number;
  isSpicy?: boolean;
  isVegetarian?: boolean;
  description?: string;
}

interface OrderStatusData {
  orderId: string;
  status: string;
  totalAmount?: number;
  riderName?: string;
  riderPhone?: string;
  eta?: string;
}

interface ActionButton {
  type: "ADD_TO_CART" | "CHECKOUT" | "TRACK_ORDER" | "NAVIGATE" | "CUSTOM" | string;
  foodId?: string;
  restaurantId?: string;
  name?: string;
  price?: number;
  image?: string;
  target?: string;
  label: string;
}

interface ActionExecuteDirective {
  action: "ADD_TO_CART" | "REMOVE_FROM_CART" | "CLEAR_CART" | "ADD_TO_FAVORITE" | "REMOVE_FROM_FAVORITE" | "CHECK_ORDERS" | "NAVIGATE";
  foodId?: string;
  foodName?: string;
  price?: number;
  restaurantId?: string;
  image?: string;
  quantity?: number;
  target?: string;
  label?: string;
}

interface ParsedMessageContent {
  cleanMarkdown: string;
  recommendedFoods: RecommendedFood[];
  orderStatus: OrderStatusData | null;
  actionButtons: ActionButton[];
  actionExecute: ActionExecuteDirective | null;
  cartAction?: any;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parsed?: ParsedMessageContent;
  timestamp: Date;
  feedback?: "like" | "dislike" | null;
  provider?: string;
  model?: string;
}

/* ------------------------------------------------------------------ */
/*  Parser Helper for Structured AI Tokens                            */
/* ------------------------------------------------------------------ */

function sanitizeFoodImage(img?: string): string {
  if (!img || typeof img !== "string" || !img.trim()) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80";
  }
  const trimmed = img.trim();
  if (trimmed.startsWith("data:image/")) {
    if (trimmed.length > 500) {
      return trimmed;
    }
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80";
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return trimmed;
  }
  return "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80";
}

function parseMessageContent(raw: string): ParsedMessageContent {
  let text = raw;
  let recommendedFoods: RecommendedFood[] = [];
  let orderStatus: OrderStatusData | null = null;
  let actionButtons: ActionButton[] = [];
  let actionExecute: ActionExecuteDirective | null = null;
  let cartAction: any = null;

  // 1. Action Execute block: ```action_execute ... ```
  const actionExecRegex = /```(?:action_execute|json:action)?\s*(\{\s*"action"[\s\S]*?\}\s*)\s*```?/i;
  const actionExecMatch = text.match(actionExecRegex);
  if (actionExecMatch) {
    try {
      actionExecute = JSON.parse(actionExecMatch[1].trim());
    } catch (e) {
      console.warn("Could not parse action execute JSON", e);
    }
    text = text.replace(actionExecRegex, "").trim();
  }

  // 2. Cart action block: ```cart_action ... ```
  const cartBlockRegex = /```(?:cart_action|json:cart)?\s*(\{\s*[\s\S]*?"(?:ADD_TO_CART|type)"[\s\S]*?\}\s*)\s*```?/i;
  const cartMatch = text.match(cartBlockRegex);
  if (cartMatch) {
    try {
      cartAction = JSON.parse(cartMatch[1].trim());
    } catch (e) {
      console.warn("Could not parse cart action JSON", e);
    }
    text = text.replace(cartBlockRegex, "").trim();
  }

  // 3. Food Recommendations block: ```food_recommendations ... ```
  const foodBlockRegex = /```(?:food_recommendations|json:foods|json)?\s*(\[[\s\S]*?\])\s*```?/i;
  const foodMatch = text.match(foodBlockRegex);
  if (foodMatch) {
    try {
      const parsed = JSON.parse(foodMatch[1].trim());
      if (Array.isArray(parsed)) {
        recommendedFoods = parsed.map((f: any) => ({
          ...f,
          image: sanitizeFoodImage(f.image),
        }));
      }
    } catch (e) {
      console.warn("Could not parse food recommendations JSON", e);
    }
    text = text.replace(foodBlockRegex, "").trim();
  }

  // 3b. Fallback: Parse individual food objects if array is truncated, unclosed, or lacks codeblocks
  if (recommendedFoods.length === 0) {
    const objectRegex = /\{[^{}]*?"id"\s*:\s*"([^"]+)"[^{}]*?"name"\s*:\s*"([^"]+)"[^{}]*?\}/g;
    let match;
    while ((match = objectRegex.exec(raw)) !== null) {
      try {
        const item = JSON.parse(match[0]);
        if (item && item.id && item.name) {
          recommendedFoods.push({
            ...item,
            image: sanitizeFoodImage(item.image),
          });
        }
      } catch {
        // ignore
      }
    }
  }

  // 4. Order Status block: ```order_status ... ```
  const orderBlockRegex = /```(?:order_status|json:order|json)?\s*(\{\s*"orderId"[\s\S]*?\}\s*)\s*```?/i;
  const orderMatch = text.match(orderBlockRegex);
  if (orderMatch) {
    try {
      orderStatus = JSON.parse(orderMatch[1].trim());
    } catch (e) {
      console.warn("Could not parse order status JSON", e);
    }
    text = text.replace(orderBlockRegex, "").trim();
  }

  // 5. Action buttons block: ```action_buttons ... ```
  const actionBlockRegex = /```(?:action_buttons|json:actions|json)?\s*(\[\s*\{[\s\S]*?"type"[\s\S]*?\}\s*\])\s*```?/i;
  const actionMatch = text.match(actionBlockRegex);
  if (actionMatch) {
    try {
      const parsed = JSON.parse(actionMatch[1].trim());
      if (Array.isArray(parsed)) {
        actionButtons = parsed;
      }
    } catch (e) {
      console.warn("Could not parse action buttons JSON", e);
    }
    text = text.replace(actionBlockRegex, "").trim();
  }

  // 6. Aggressive cleanup: Strip any remaining raw JSON array or codeblock remnant so text is always 100% clean
  text = text
    .replace(/```(?:action_execute|cart_action|food_recommendations|order_status|action_buttons|json)?[\s\S]*/gi, "")
    .replace(/\[\s*\{\s*"id"[\s\S]*/gi, "")
    .replace(/\{\s*"orderId"[\s\S]*/gi, "")
    .replace(/\[\s*\{\s*"type"[\s\S]*/gi, "")
    .trim();

  return {
    cleanMarkdown: text,
    recommendedFoods,
    orderStatus,
    actionButtons,
    actionExecute,
    cartAction,
  };
}

/* ------------------------------------------------------------------ */
/*  Role Helper & Preset Prompts                                       */
/* ------------------------------------------------------------------ */

type AppRole = "customer" | "restaurant" | "rider" | "admin" | "guest";

function getNormalizedRole(rawRole?: string): AppRole {
  if (typeof window !== "undefined") {
    try {
      const restData = localStorage.getItem("foodflow_restaurant_data");
      if (restData) return "restaurant";
    } catch {
      // ignore
    }
  }

  if (!rawRole) return "guest";
  const r = rawRole.toLowerCase();
  if (r.includes("restaurant") || r.includes("partner")) return "restaurant";
  if (r.includes("rider") || r.includes("delivery")) return "rider";
  if (r.includes("admin")) return "admin";
  if (r.includes("customer")) return "customer";
  return "customer";
}

const ROLE_PRESET_PROMPTS: Record<AppRole, Array<{ label: string; icon: string; query: string }>> = {
  customer: [
    { label: "🍔 Spicy Combo under ₹500", icon: "Flame", query: "My budget is ₹500, suggest a delicious spicy meal package for 2." },
    { label: "❤️ Favorite Dishes", icon: "Heart", query: "Show the list of dishes saved in my favorites." },
    { label: "🛒 Cart & Total Summary", icon: "ShoppingCart", query: "What items are in my cart and what is the total cost including delivery?" },
    { label: "📦 Live Order Tracking", icon: "Package", query: "Show me the live status and delivery partner details for my active order." },
    { label: "🏷️ Discount Vouchers", icon: "Sparkles", query: "What active coupon codes and discounts are available right now?" },
  ],
  restaurant: [
    { label: "📦 Active Live Orders", icon: "Package", query: "Show active and in-progress orders for my restaurant." },
    { label: "🍕 Menu & Dish Items", icon: "UtensilsCrossed", query: "Display my current restaurant menu and available dishes." },
    { label: "💰 Sales & Revenue Summary", icon: "Banknote", query: "Summarize total sales revenue and orders fulfilled." },
    { label: "📝 Dish Description Writer", icon: "Sparkles", query: "Write a mouthwatering gourmet description for a new premium dish." },
    { label: "⚙️ Restaurant Dashboard", icon: "Store", query: "Take me to the restaurant order management dashboard." },
  ],
  rider: [
    { label: "🛵 Express Delivery Tips", icon: "Bike", query: "What are the best tips to deliver piping hot meals safely during peak hours?" },
    { label: "💰 Earnings & Payout Guide", icon: "Sparkles", query: "How are rider delivery payouts, bonuses, and incentives calculated?" },
    { label: "📍 Customer Address Guide", icon: "Phone", query: "What should I do if a customer address or landmark is difficult to locate?" },
  ],
  admin: [
    { label: "📊 Platform Summary", icon: "ShieldCheck", query: "Give me an active summary of current restaurants, riders, and platform orders." },
    { label: "🛡️ Partner Guidelines", icon: "Store", query: "What are the rules and verification policies for new restaurants and riders?" },
  ],
  guest: [
    { label: "🔥 Top Trending Dishes", icon: "Sparkles", query: "Show me the most popular and top-rated dishes on FoodFlow." },
    { label: "🚀 How to Order?", icon: "ShoppingBag", query: "How do I create an account and place an order on FoodFlow?" },
    { label: "🏪 Restaurant Partner Join", icon: "Store", query: "What is the procedure to join FoodFlow as a restaurant owner?" },
  ],
};

/* ------------------------------------------------------------------ */
/*  Main Navbar AI Assistant Page Component                           */
/* ------------------------------------------------------------------ */

export default function AIAssistantPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items: cartItems, addItem, removeItem, clearCart, openCartDrawer } = useCart();

  const user = session?.user as { id?: string; name?: string; email?: string; role?: string } | undefined;
  const [userRole, setUserRole] = useState<AppRole>(() => getNormalizedRole(user?.role));
  const userId = user?.id;
  const userEmail = user?.email;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const [favorites, setFavorites] = useState<TFavoriteItem[]>([]);
  const [favoriteMap, setFavoriteMap] = useState<Record<string, boolean>>({});
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // Real-Time Location & Mood & Suggested Prompts
  const [locationInfo, setLocationInfo] = useState<ILocationInfo>(DEFAULT_INITIAL_LOCATION);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [suggestedChips, setSuggestedChips] = useState<Array<{ id: string; label: string; message: string }>>([
    { id: "1", label: "🔥 Top Spicy Cravings", message: "What are the best spicy food options available near me?" },
    { id: "2", label: "💰 ₹500 Combo (2 Persons)", message: "My budget is ₹500, suggest a delicious combo meal for 2." },
    { id: "3", label: "⚡ Fastest Delivery", message: "Which delicious dishes can be delivered fastest to my area?" },
    { id: "4", label: "🥗 Healthy Diet Meals", message: "Show me high-protein and healthy diet options." },
    { id: "5", label: "🌙 Late-Night Bites", message: "Suggest some tasty late-night snacks or light meals." },
    { id: "6", label: "🎉 Party Platter for 4", message: "Recommend a grand food platter for 4-5 people." },
  ]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyLoadedRef = useRef(false);

  // Sync user role on mount or session changes
  useEffect(() => {
    setUserRole(getNormalizedRole(user?.role));
  }, [user?.role]);

  // Sync real-time location and settings on mount
  useEffect(() => {
    setLocationInfo(getRealTimeLocation());

    const unsubscribe = subscribeLocation(() => {
      setLocationInfo(getRealTimeLocation());
    });

    fetch("/api/ai/settings")
      .then((r) => r.json())
      .then((res) => {
        if (res?.data?.preSuggestedPrompts && Array.isArray(res.data.preSuggestedPrompts) && res.data.preSuggestedPrompts.length > 0) {
          setSuggestedChips(res.data.preSuggestedPrompts);
        }
      })
      .catch(() => {});

    return unsubscribe;
  }, []);

  // Load chat history from localStorage on mount & sanitize language
  useEffect(() => {
    try {
      const storageKey = session?.user?.id ? `foodflow_ai_history_${session.user.id}` : "foodflow_ai_history_guest";
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let hasNonEnglish = false;
          const rehydrated: ChatMessage[] = parsed.map((m: any) => {
            let content = String(m.content || "");
            if (/[\u0980-\u09FF]/.test(content) || content.includes("স্বাগতম") || content.includes("ফুড")) {
              hasNonEnglish = true;
              content = "Welcome to FoodFlow! 🍔 I am your smart AI Food Guide. Let me know your budget or favorite food, and I can find great food from top restaurants for you!";
            }
            return {
              ...m,
              content,
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
              parsed: m.role === "assistant" ? parseMessageContent(content) : undefined,
            };
          });
          setMessages(rehydrated);
          if (hasNonEnglish) {
            localStorage.setItem(storageKey, JSON.stringify(rehydrated.slice(-50)));
          }
        }
      }
    } catch (e) {
      console.warn("Could not load chat history from localStorage", e);
    } finally {
      historyLoadedRef.current = true;
    }
  }, [session?.user?.id]);

  // Persist chat history to localStorage whenever messages change
  useEffect(() => {
    if (!historyLoadedRef.current) return;
    try {
      const storageKey = session?.user?.id ? `foodflow_ai_history_${session.user.id}` : "foodflow_ai_history_guest";
      if (messages.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(messages.slice(-50)));
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (e) {
      console.warn("Could not save chat history to localStorage", e);
    }
  }, [messages, session?.user?.id]);

  // Auto-scroll ONLY inside chat container on new message (prevents outer page/window from jumping)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  // Load User Favorites
  const loadUserFavorites = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await getUserFavoritesApi(userId, userEmail);
      if (res.success && Array.isArray(res.data)) {
        setFavorites(res.data);
        const map: Record<string, boolean> = {};
        res.data.forEach((fav) => {
          map[fav.foodId] = true;
        });
        setFavoriteMap(map);
      }
    } catch {
      // ignore
    }
  }, [userId, userEmail]);

  useEffect(() => {
    loadUserFavorites();
  }, [loadUserFavorites]);

  // Initialize Welcome Message on First Load if no history exists
  useEffect(() => {
    if (messages.length === 0) {
      let initialGreeting = "";
      if (userRole === "restaurant") {
        initialGreeting = `Welcome **${user?.name || "Restaurant Partner"}**! 🏪 I am your **FoodFlow Restaurant Assistant**.\n\nYou can ask me to check active orders, inspect menus, or analyze sales and revenue.`;
      } else if (userRole === "rider") {
        initialGreeting = `Welcome **${user?.name || "Delivery Partner"}**! 🛵 I am your delivery route and earnings guide. Ask me about active trips, daily earnings, or help.`;
      } else if (userRole === "admin") {
        initialGreeting = `Welcome **Admin Panel Manager**! 🛡️ Ready to assist with platform overview, configuration, and monitoring.`;
      } else {
        initialGreeting = `Welcome **${user?.name || "Customer"}**! 👋 I am your **FoodFlow AI Super Assistant**.\n\nTell me your cravings, ask to add items to your cart, track live orders, or explore top-rated restaurants! 🍔`;
      }

      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: "assistant",
          content: initialGreeting,
          parsed: parseMessageContent(initialGreeting),
          timestamp: new Date(),
        },
      ]);
    }
  }, [userRole, user?.name, messages.length]);

  // Execute Agentic Action Directive
  const executeAgentAction = useCallback(
    async (actionObj: ActionExecuteDirective) => {
      if (!actionObj || !actionObj.action) return;

      switch (actionObj.action) {
        case "ADD_TO_CART": {
          if (userRole !== "restaurant" && actionObj.foodId) {
            const foodPayload: IGlobalFoodItem = {
              _id: actionObj.foodId,
              restaurantId: actionObj.restaurantId || "foodflow-kitchen",
              name: actionObj.foodName || "Food Item",
              price: actionObj.price || 0,
              discountPrice: undefined,
              image: actionObj.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80",
              restaurantName: "FoodFlow Kitchen",
              description: "",
              category: "Dishes",
              status: "available",
              isAvailable: true,
              restaurantSlug: "foodflow",
              restaurantLogo: "",
              restaurantIsOpen: true,
              restaurantRating: 4.8,
              restaurantReviewCount: 15,
            };
            addItem(foodPayload, actionObj.quantity || 1);
            setAddedItems((prev) => ({ ...prev, [actionObj.foodId!]: true }));
            toast.success(`'${actionObj.foodName || "Dish"}' added to cart! 🛒`);
            setTimeout(() => {
              setAddedItems((prev) => ({ ...prev, [actionObj.foodId!]: false }));
            }, 2500);
          }
          break;
        }

        case "REMOVE_FROM_CART": {
          if (actionObj.foodId) {
            removeItem(actionObj.foodId);
            toast.info(`'${actionObj.foodName || "Dish"}' removed from cart.`);
          }
          break;
        }

        case "CLEAR_CART": {
          clearCart();
          toast.info("Your cart has been cleared.");
          break;
        }

        case "ADD_TO_FAVORITE": {
          if (actionObj.foodId && userId) {
            const res = await toggleFavoriteApi(actionObj.foodId, userId, userEmail);
            if (res.success) {
              setFavoriteMap((prev) => ({ ...prev, [actionObj.foodId!]: true }));
              toast.success(`'${actionObj.foodName || "Dish"}' added to favorites! ❤️`);
              loadUserFavorites();
            }
          }
          break;
        }

        case "REMOVE_FROM_FAVORITE": {
          if (actionObj.foodId && userId) {
            const res = await removeFavoriteApi(actionObj.foodId, userId, userEmail);
            if (res.success) {
              setFavoriteMap((prev) => ({ ...prev, [actionObj.foodId!]: false }));
              toast.info(`'${actionObj.foodName || "Dish"}' removed from favorites.`);
              loadUserFavorites();
            }
          }
          break;
        }

        case "NAVIGATE": {
          if (actionObj.target) {
            toast.info(`Navigating... 🚀`);
            setTimeout(() => {
              router.push(actionObj.target!);
            }, 800);
          }
          break;
        }

        default:
          break;
      }
    },
    [userRole, addItem, removeItem, clearCart, userId, userEmail, loadUserFavorites, router]
  );

  // Send Message & Process Agent Flow
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          chatHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userId: session?.user?.id || user?.id,
          userEmail: session?.user?.email || user?.email,
          userName: session?.user?.name || user?.name,
          userRole: userRole,
          userLocation: {
            zoneName: locationInfo.zoneName || locationInfo.upazila || locationInfo.district || locationInfo.city || "Berhampur, Odisha",
            currentZoneId: locationInfo.currentZoneId,
            candidateZoneIds: locationInfo.candidateZoneIds,
            lat: locationInfo.lat,
            lng: locationInfo.lng,
            city: locationInfo.city,
            district: locationInfo.district,
            upazila: locationInfo.upazila,
            area: locationInfo.area,
            isInsideServiceArea: locationInfo.isInsideServiceArea,
          },
          userMood: selectedMood,
          cartItems: cartItems.map((item) => ({
            id: item.foodItem?._id || (item as any)?.foodId || (item as any)?.id,
            name: item.foodItem?.name || (item as any)?.name || "Food Item",
            price: item.foodItem?.discountPrice || item.foodItem?.price || (item as any)?.price || 0,
            quantity: item.quantity || 1,
          })),
        }),
      });

      const data = await response.json();

      if (data.userRole && data.userRole !== userRole) {
        setUserRole(data.userRole as AppRole);
      }

      if (data.success && data.reply) {
        const parsed = parseMessageContent(data.reply);

        // If AI emitted an autonomous action execution directive, execute it automatically!
        if (parsed.actionExecute) {
          executeAgentAction(parsed.actionExecute);
        }

        // Auto-execute Cart Action if payload contains cartAction
        const cartActionToRun = data.cartAction || parsed.cartAction;
        if (cartActionToRun && (cartActionToRun.type === "ADD_TO_CART" || cartActionToRun.action === "ADD_TO_CART") && cartActionToRun.food) {
          const item = cartActionToRun.food;
          const foodItemPayload: IGlobalFoodItem = {
            _id: item.id || item._id,
            restaurantId: item.restaurantId || "foodflow-kitchen",
            name: item.name,
            price: item.price,
            discountPrice: item.discountPrice,
            image: item.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80",
            restaurantName: item.restaurantName || "FoodFlow Kitchen",
            restaurantSlug: (item.restaurantName || "foodflow").toLowerCase().replace(/\s+/g, "-"),
            restaurantLogo: "",
            restaurantIsOpen: true,
            restaurantRating: item.rating || 4.8,
            restaurantReviewCount: 24,
            description: item.description || "",
            category: item.category || "Dishes",
            status: "available",
            isAvailable: true,
            isSpicy: Boolean(item.isSpicy),
            isVegetarian: Boolean(item.isVegetarian),
          };

          const qty = Number(item.quantity) || 1;
          addItem(foodItemPayload, qty);
          setAddedItems((prev) => ({ ...prev, [foodItemPayload._id]: true }));
          toast.success(`'${foodItemPayload.name}' successfully added to your cart! 🛒`);
          setTimeout(() => {
            setAddedItems((prev) => ({ ...prev, [foodItemPayload._id]: false }));
          }, 2500);
        }

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          parsed,
          timestamp: new Date(),
          provider: data.provider,
          model: data.model,
        };
        console.log(`🤖 [FoodFlow AI Debug] Service: ${assistantMessage.provider} | Model: ${assistantMessage.model}`);
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorText = `⚠️ Sorry, failed to process request: ${data.error || "Please try again shortly."}`;
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: errorText,
            parsed: parseMessageContent(errorText),
            timestamp: new Date(),
          },
        ]);
      }
    } catch {
      const errMessage = "⚠️ Network issue detected. Please check your connection and try again.";
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: errMessage,
          parsed: parseMessageContent(errMessage),
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quantity helpers
  const handleQuantityChange = (id: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta),
    }));
  };

  // Add to cart directly from Card
  const handleAddToCart = (food: RecommendedFood) => {
    const qty = quantities[food.id] || 1;
    const foodItemPayload: IGlobalFoodItem = {
      _id: food.id,
      restaurantId: food.restaurantId || "foodflow-kitchen",
      name: food.name,
      price: food.price,
      discountPrice: food.discountPrice,
      image: food.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80",
      restaurantName: food.restaurantName || "FoodFlow Kitchen",
      restaurantSlug: (food.restaurantName || "foodflow").toLowerCase().replace(/\s+/g, "-"),
      restaurantLogo: "",
      restaurantIsOpen: true,
      restaurantRating: food.rating || 4.8,
      restaurantReviewCount: 24,
      description: food.description || "",
      category: "Dishes",
      status: "available",
      isAvailable: true,
      isSpicy: food.isSpicy,
      isVegetarian: food.isVegetarian,
    };

    addItem(foodItemPayload, qty);
    setAddedItems((prev) => ({ ...prev, [food.id]: true }));
    toast.success(`'${food.name}' added to cart! 🛒`);

    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [food.id]: false }));
    }, 2500);
  };

  // Toggle favorite on Card
  const handleToggleFavorite = async (food: RecommendedFood) => {
    if (!userId) {
      toast.warn("Please log in to save favorites.");
      router.push("/auth/login");
      return;
    }

    try {
      const isCurrentlyFav = favoriteMap[food.id];
      if (isCurrentlyFav) {
        const res = await removeFavoriteApi(food.id, userId, userEmail);
        if (res.success) {
          setFavoriteMap((prev) => ({ ...prev, [food.id]: false }));
          toast.info(`'${food.name}' removed from favorites.`);
          loadUserFavorites();
        }
      } else {
        const res = await toggleFavoriteApi(food.id, userId, userEmail);
        if (res.success) {
          setFavoriteMap((prev) => ({ ...prev, [food.id]: true }));
          toast.success(`'${food.name}' added to favorites! ❤️`);
          loadUserFavorites();
        }
      }
    } catch {
      toast.error("Error updating favorites.");
    }
  };

  // Purchase directly (Add to cart & Checkout)
  const handlePurchaseNow = (food: RecommendedFood) => {
    const qty = quantities[food.id] || 1;
    const foodItemPayload: IGlobalFoodItem = {
      _id: food.id,
      restaurantId: food.restaurantId || "foodflow-kitchen",
      name: food.name,
      price: food.price,
      discountPrice: food.discountPrice,
      image: food.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80",
      restaurantName: food.restaurantName || "FoodFlow Kitchen",
      restaurantSlug: (food.restaurantName || "foodflow").toLowerCase().replace(/\s+/g, "-"),
      restaurantLogo: "",
      restaurantIsOpen: true,
      restaurantRating: food.rating || 4.8,
      restaurantReviewCount: 24,
      description: food.description || "",
      category: "Dishes",
      status: "available",
      isAvailable: true,
      isSpicy: food.isSpicy,
      isVegetarian: food.isVegetarian,
    };

    addItem(foodItemPayload, qty);
    toast.success(`'${food.name}' added! Redirecting to checkout... 🚀`);
    router.push(userId ? "/dashboard/customer/checkout" : "/checkout");
  };

  // Copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.info("Copied to clipboard! 📋");
  };

  // Message feedback
  const handleFeedback = (msgId: string, type: "like" | "dislike") => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback: m.feedback === type ? null : type } : m))
    );
    toast.success("Thank you for your feedback! ❤️");
  };

  // Speech Recognition (Voice Input)
  const toggleListening = () => {
    if (typeof window === "undefined") return;
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Voice input is not supported in your browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "bn-BD";
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Text-To-Speech (Speech Synthesis)
  const handleSpeak = (msgId: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Voice output is not supported.");
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_~[\]()]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "bn-BD";
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Reset Chat & Clear Saved History
  const handleResetChat = () => {
    setMessages([]);
    try {
      const storageKey = session?.user?.id ? `foodflow_ai_history_${session.user.id}` : "foodflow_ai_history_guest";
      localStorage.removeItem(storageKey);
      toast.info("Chat history cleared. Started new session.");
    } catch {}
  };

  return (
    <div className="min-h-[calc(100vh-70px)] bg-gray-50/70 text-gray-900 flex flex-col transition-colors">
      
      {/* Top Header Banner matching Navbar style */}
      <div className="border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-[65px] z-20 px-4 py-3 sm:px-8 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          
          {/* Title & Role Status */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/20">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-gray-900">
                  FoodFlow AI Assistant
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 capitalize flex items-center gap-1">
                  {userRole === "restaurant" && <Store className="h-3 w-3" />}
                  {userRole === "rider" && <Bike className="h-3 w-3" />}
                  {userRole === "admin" && <ShieldCheck className="h-3 w-3" />}
                  Role: {userRole}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Autonomous Agent Active
                </span>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                  <MapPin className="h-3 w-3 text-emerald-600 animate-pulse" />
                  <span className="truncate max-w-[130px] sm:max-w-[200px]">
                    {locationInfo.zoneName || locationInfo.district || locationInfo.city || "All Zones"}
                  </span>
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {userRole === "restaurant" 
                  ? "Restaurant Live Orders, Menu Management & Sales Assistant" 
                  : "Smart Recommendations, Cart & Favorites Management Assistant"}
              </p>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Clear Conversation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>

            {userRole === "restaurant" ? (
              <Link
                href="/dashboard/restaurant/orders"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs font-bold text-orange-600 hover:bg-orange-100 transition-colors"
              >
                <Package className="h-3.5 w-3.5" />
                <span>Order Dashboard</span>
              </Link>
            ) : (
              <button
                onClick={openCartDrawer}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs font-bold text-orange-600 hover:bg-orange-100 transition-colors cursor-pointer"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Cart ({cartItems.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col px-3 sm:px-6 py-4">
        
        {/* Interactive Role-Based Quick Preset Chips */}
        <div className="mb-3 overflow-x-auto pb-1 flex items-center gap-2 select-none no-scrollbar">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 shrink-0 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-orange-500" /> Suggestions:
          </span>
          {ROLE_PRESET_PROMPTS[userRole]?.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt.query)}
              className="shrink-0 px-3 py-1.5 rounded-full bg-white hover:bg-orange-50 hover:border-orange-300 text-gray-700 text-xs font-medium border border-gray-200 shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>{prompt.label}</span>
            </button>
          ))}
        </div>

        {/* Message Feed Card */}
        <div 
          ref={chatContainerRef}
          className="flex-1 bg-white rounded-3xl border border-gray-200/90 shadow-sm p-4 sm:p-6 overflow-y-auto flex flex-col space-y-4 min-h-[56vh] max-h-[66vh]"
        >
          
          {/* Minimal Empty State when no messages */}
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto select-none">
              <div className="h-14 w-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs mb-3">
                <Bot className="h-7 w-7" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                FoodFlow AI Food Concierge
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-sm mb-6">
                Tell me your budget, cravings, or favorite dishes to get instant recommendations!
              </p>

              {/* Pre-Suggested Quick Prompt Chips */}
              <div className="w-full max-w-lg">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Tap to quick start
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestedChips.map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => handleSendMessage(chip.message)}
                      className="px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-orange-50 hover:border-orange-300 border border-gray-200 text-xs font-semibold text-gray-700 hover:text-orange-600 transition cursor-pointer shadow-2xs"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === "user";
            const parsed = message.parsed;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className="shrink-0 pt-0.5">
                  {isUser ? (
                    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold shadow-xs text-sm">
                      {user?.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                    </div>
                  ) : (
                    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-xs">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3.5 shadow-2xs ${
                    isUser
                      ? "bg-orange-500 text-white rounded-tr-xs"
                      : "bg-gray-50 border border-gray-200/80 text-gray-900 rounded-tl-xs"
                  }`}
                >
                  {isUser ? (
                    <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  ) : (
                    <div>
                      {/* Rich AI Markdown Rendering */}
                      <AiMarkdownRenderer content={parsed?.cleanMarkdown || message.content} />

                      {/* 1. Recommended Food Cards (Only for Customer / Guest role) */}
                      {userRole !== "restaurant" && parsed?.recommendedFoods && parsed.recommendedFoods.length > 0 && (
                        <div className="mt-3.5 space-y-2.5">
                          <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                            <UtensilsCrossed className="h-3.5 w-3.5 text-orange-500" />
                            Suggested Dishes ({parsed.recommendedFoods.length}):
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {parsed.recommendedFoods.map((food) => {
                              const qty = quantities[food.id] || 1;
                              const isAdded = addedItems[food.id];
                              const isFav = favoriteMap[food.id];
                              const hasDiscount = Boolean(food.discountPrice && food.discountPrice < food.price);

                              return (
                                <div
                                  key={food.id}
                                  className="group flex gap-3 p-2.5 rounded-2xl border border-gray-200 bg-white hover:border-orange-400 hover:shadow-xs transition-all"
                                >
                                  {/* Image */}
                                  <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                                    <img
                                      src={food.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80"}
                                      alt={food.name}
                                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80";
                                      }}
                                    />
                                    {food.isSpicy && (
                                      <span className="absolute top-1 left-1 bg-red-500/90 text-white p-0.5 rounded-full text-[9px]">
                                        <Flame className="h-2.5 w-2.5" />
                                      </span>
                                    )}
                                    {/* Favorite Button on Image */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleFavorite(food)}
                                      className="absolute top-1 right-1 p-1 rounded-full bg-white/90 hover:bg-white text-gray-500 hover:text-red-500 shadow-xs transition-all cursor-pointer"
                                      title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                                    >
                                      <Heart className={`h-3.5 w-3.5 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                                    </button>
                                  </div>

                                  {/* Info */}
                                  <div className="flex-1 flex flex-col justify-between min-w-0">
                                    <div>
                                      <div className="flex items-center justify-between gap-1">
                                        <h4 className="text-xs font-bold text-gray-900 truncate">
                                          {food.name}
                                        </h4>
                                        {food.rating && (
                                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded">
                                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                                            {food.rating}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-gray-500 truncate">
                                        {food.restaurantName || "FoodFlow Kitchen"}
                                      </p>
                                    </div>

                                    {/* Price & Actions */}
                                    <div className="flex items-center justify-between gap-1 mt-1.5 flex-wrap">
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs font-bold text-orange-600">
                                          ₹{hasDiscount ? food.discountPrice : food.price}
                                        </span>
                                        {hasDiscount && (
                                          <span className="text-[10px] text-gray-400 line-through">
                                            ₹{food.price}
                                          </span>
                                        )}
                                      </div>

                                      {/* Quantity & Cart Button */}
                                      <div className="flex items-center gap-1 flex-wrap">
                                        <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50">
                                          <button
                                            type="button"
                                            onClick={() => handleQuantityChange(food.id, -1)}
                                            className="p-1 text-gray-500 hover:text-orange-600 text-xs cursor-pointer"
                                            title="Decrease quantity"
                                          >
                                            <Minus className="h-2.5 w-2.5" />
                                          </button>
                                          <span className="text-[10px] font-bold px-1.5">{qty}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleQuantityChange(food.id, 1)}
                                            className="p-1 text-gray-500 hover:text-orange-600 text-xs cursor-pointer"
                                            title="Increase quantity"
                                          >
                                            <Plus className="h-2.5 w-2.5" />
                                          </button>
                                        </div>

                                        {/* Add to Cart button */}
                                        <button
                                          type="button"
                                          onClick={() => handleAddToCart(food)}
                                          className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            isAdded
                                              ? "bg-emerald-500 text-white"
                                              : "bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200"
                                          }`}
                                          title="Add to Cart"
                                        >
                                          {isAdded ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                                        </button>

                                        {/* Purchase / Buy Now button */}
                                        <button
                                          type="button"
                                          onClick={() => handlePurchaseNow(food)}
                                          className="px-2 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-[11px] font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                                          title="Buy Now / Order"
                                        >
                                          <ShoppingBag className="h-3 w-3" />
                                          <span>Order Now</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 2. Order Status Widget */}
                      {parsed?.orderStatus && (
                        <div className="mt-3.5 p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                              <Package className="h-4 w-4 text-orange-500" />
                              Order ID: <span className="font-mono text-orange-600">{parsed.orderStatus.orderId}</span>
                            </span>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                              {parsed.orderStatus.status}
                            </span>
                          </div>

                          {/* Progress timeline */}
                          <div className="grid grid-cols-4 gap-1 my-3 text-center">
                            {["Placed", "Preparing", "On the Way", "Delivered"].map((step, idx) => {
                              const currentStatus = parsed.orderStatus?.status?.toLowerCase() || "";
                              const isCompleted =
                                (idx === 0 && Boolean(currentStatus)) ||
                                (idx === 1 && (currentStatus.includes("prep") || currentStatus.includes("confirm") || currentStatus.includes("way") || currentStatus.includes("deliver"))) ||
                                (idx === 2 && (currentStatus.includes("way") || currentStatus.includes("out") || currentStatus.includes("deliver"))) ||
                                (idx === 3 && currentStatus.includes("deliver"));

                              return (
                                <div key={step} className="flex flex-col items-center">
                                  <div
                                    className={`h-2 w-full rounded-full mb-1 transition-all ${
                                      isCompleted ? "bg-orange-500" : "bg-gray-200"
                                    }`}
                                  />
                                  <span
                                    className={`text-[9px] font-semibold truncate ${
                                      isCompleted ? "text-orange-600 font-bold" : "text-gray-400"
                                    }`}
                                  >
                                    {step}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Rider Info & Amount */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                            {parsed.orderStatus.riderName && (
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <span className="font-semibold">Delivery Partner:</span>
                                <span>{parsed.orderStatus.riderName}</span>
                                {parsed.orderStatus.riderPhone && (
                                  <a
                                    href={`tel:${parsed.orderStatus.riderPhone}`}
                                    className="text-orange-600 hover:underline flex items-center gap-0.5 ml-1 font-bold"
                                  >
                                    <Phone className="h-3 w-3" />
                                    {parsed.orderStatus.riderPhone}
                                  </a>
                                )}
                              </div>
                            )}
                            {parsed.orderStatus.totalAmount && (
                              <div className="font-bold text-gray-900">
                                Total: <span className="text-orange-600">₹{parsed.orderStatus.totalAmount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 3. Universal Action Buttons (Works for Restaurant & Customer) */}
                      {parsed?.actionButtons && parsed.actionButtons.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-gray-200/60">
                          {parsed.actionButtons.map((btn, idx) => {
                            const target = btn.target || (btn.type === "CHECKOUT" ? "/checkout" : btn.type === "TRACK_ORDER" ? "/dashboard/customer/orders" : null);

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  if (target) {
                                    router.push(target);
                                  } else if (btn.type === "CHECKOUT") {
                                    router.push(userId ? "/dashboard/customer/checkout" : "/checkout");
                                  } else if (btn.type === "TRACK_ORDER") {
                                    router.push(userRole === "restaurant" ? "/dashboard/restaurant/orders" : "/dashboard/customer/orders");
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                              >
                                {userRole === "restaurant" ? <Store className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                                <span>{btn.label}</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Message Footer Utilities */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200/60 text-gray-400 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px]">
                            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {message.provider && (
                            <span
                              className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600 uppercase tracking-wider flex items-center gap-1 shadow-2xs"
                              title={`Served by ${message.provider} (${message.model || "default"})`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {message.provider} • {message.model || "model"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Speak TTS */}
                          <button
                            type="button"
                            onClick={() => handleSpeak(message.id, parsed?.cleanMarkdown || message.content)}
                            className={`p-1 rounded-md hover:bg-gray-200/60 transition-colors cursor-pointer ${
                              speakingMsgId === message.id ? "text-orange-500 font-bold" : "text-gray-400"
                            }`}
                            title="Listen with voice"
                          >
                            {speakingMsgId === message.id ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                          </button>

                          {/* Copy */}
                          <button
                            type="button"
                            onClick={() => handleCopy(parsed?.cleanMarkdown || message.content)}
                            className="p-1 rounded-md hover:bg-gray-200/60 transition-colors cursor-pointer"
                            title="Copy"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                          {/* Like */}
                          <button
                            type="button"
                            onClick={() => handleFeedback(message.id, "like")}
                            className={`p-1 rounded-md hover:bg-gray-200/60 transition-colors cursor-pointer ${
                              message.feedback === "like" ? "text-emerald-500" : ""
                            }`}
                            title="Helpful"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </button>

                          {/* Dislike */}
                          <button
                            type="button"
                            onClick={() => handleFeedback(message.id, "dislike")}
                            className={`p-1 rounded-md hover:bg-gray-200/60 transition-colors cursor-pointer ${
                              message.feedback === "dislike" ? "text-rose-500" : ""
                            }`}
                            title="Not helpful"
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-xs">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-100 rounded-2xl rounded-bl-sm">
                <span className="h-2 w-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-orange-500 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-orange-500 animate-bounce [animation-delay:300ms]" />
                <span className="text-xs text-gray-500 font-medium ml-1">AI is thinking and processing details...</span>
              </div>
            </div>
          )}
        </div>

        {/* Mood / Craving Quick Pills */}
        <div className="mt-3 px-3 py-1.5 bg-white rounded-xl border border-gray-200/80 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 shrink-0 flex items-center gap-1">
            <Flame className="h-3 w-3 text-orange-500" /> Mood:
          </span>
          {[
            { id: "spicy", label: "🌶️ Spicy Cravings", prompt: "I want something hot and spicy, show me the best options." },
            { id: "cheat_day", label: "🍔 Comfort / Cheat Day", prompt: "Today is cheat day! Recommend some amazing burgers or pizzas." },
            { id: "healthy", label: "🥗 Healthy / Diet", prompt: "Show me high-protein and healthy diet options." },
            { id: "late_night", label: "🌙 Late Night", prompt: "Suggest some delicious late-night snacks." },
            { id: "budget", label: "💰 Budget Combo", prompt: "Suggest a great combo meal for 2 within ₹500." },
            { id: "party", label: "🎉 Party Platter", prompt: "Recommend a grand food platter for 4-5 people." },
          ].map((pill) => {
            const isSelected = selectedMood === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  setSelectedMood(isSelected ? null : pill.id);
                  handleSendMessage(pill.prompt);
                }}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-orange-500 text-white shadow-xs"
                    : "bg-gray-100 hover:bg-orange-50 text-gray-700 hover:text-orange-600 border border-gray-200/60"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Input Bar & Controls */}
        <div className="mt-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-2 sm:p-3 flex items-center gap-2">
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            }`}
            title={isListening ? "Listening... Click to stop" : "Voice input"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          {/* Text Input Area */}
          <textarea
            ref={inputRef}
            rows={1}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              userRole === "restaurant"
                ? "Ask about active orders, menu management, or dishes..."
                : "Ask for food recommendations, cart updates, or orders..."
            }
            className="flex-1 max-h-24 resize-none bg-transparent px-2 py-1.5 text-sm outline-none text-gray-900 placeholder:text-gray-400"
          />

          {/* Send Button */}
          <button
            type="button"
            disabled={!inputMessage.trim() || isLoading}
            onClick={() => handleSendMessage()}
            className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs shrink-0"
            title="Send Message"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
