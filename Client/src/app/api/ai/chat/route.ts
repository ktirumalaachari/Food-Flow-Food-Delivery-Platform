import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getApiBaseUrl } from "@/lib/api/config";

interface LiveFoodItem {
  id: string;
  name: string;
  category: string;
  price: number;
  discountPrice?: number;
  restaurantName: string;
  image: string;
  rating: number;
  isSpicy?: boolean;
  isVegetarian?: boolean;
}

const DEFAULT_FOODS: LiveFoodItem[] = [
  {
    id: "6a97d8cd4aaa90349edd225e",
    name: "Garden Fresh Veggie Delight Pizza",
    category: "Pizza",
    price: 320,
    discountPrice: 300,
    restaurantName: "Bombay Kitchen",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    isSpicy: true,
    isVegetarian: true,
  },
  {
    id: "6ae44e19633c4aa05311afe0",
    name: "Classic Italian Penne Arbiata",
    category: "Pasta",
    price: 249,
    discountPrice: 219,
    restaurantName: "Bombay Kitchen",
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    isSpicy: true,
    isVegetarian: true,
  },
  {
    id: "6a995a28faa211f0f111ee0f",
    name: "CijBurger",
    category: "Burgers",
    price: 270,
    discountPrice: 249,
    restaurantName: "Burger Hub",
    image: "https://t4.ftcdn.net/jpg/03/03/11/75/240_F_303117572_kZlWa7FDjRJXFdi7YoP17gPRCDmoI8Qt.jpg",
    rating: 4.7,
    isSpicy: true,
  },
  {
    id: "6a9d6f5fe414fd9dc3340e24",
    name: "Authentic Dum Biriyani",
    category: "Biryani",
    price: 628,
    discountPrice: 598,
    restaurantName: "Aasife Biriyani",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    isSpicy: true,
  },
  {
    id: "6a9985545ceac4f1d45c05b9",
    name: "Green Herb & Sprout Salad",
    category: "Healthy",
    price: 180,
    discountPrice: 170,
    restaurantName: "Olive Restaurant",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    rating: 4.6,
    isSpicy: false,
    isVegetarian: true,
  },
  {
    id: "6a9da3acfa01ed4627ae37fe",
    name: "Nandan Classic Paneer Makhani Pizza",
    category: "Pizza",
    price: 360,
    discountPrice: 330,
    restaurantName: "Bombay Kitchen",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    isSpicy: true,
    isVegetarian: true,
  },
];

async function getLiveFoodsFromDb(): Promise<LiveFoodItem[]> {
  try {
    const db = await getDb();
    const rawFoods = await db
      .collection("food")
      .find({})
      .project({
        _id: 1,
        name: 1,
        category: 1,
        price: 1,
        discountPrice: 1,
        restaurantName: 1,
        image: 1,
        rating: 1,
        isSpicy: 1,
        isVegetarian: 1,
      })
      .limit(20)
      .toArray();

    if (rawFoods && rawFoods.length > 0) {
      return rawFoods.map((f: any) => ({
        id: String(f._id),
        name: f.name || "Delicious Dish",
        category: f.category || "Dishes",
        price: Number(f.price) || 0,
        discountPrice: f.discountPrice ? Number(f.discountPrice) : undefined,
        restaurantName: f.restaurantName || "FoodFlow Kitchen",
        image:
          f.image && typeof f.image === "string" && !f.image.startsWith("data:")
            ? f.image
            : "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
        rating: Number(f.rating) || 4.8,
        isSpicy: Boolean(f.isSpicy),
        isVegetarian: Boolean(f.isVegetarian),
      }));
    }
  } catch (err) {
    console.warn("[Client AI Chat] DB food retrieval error, using curated menu:", err);
  }
  return DEFAULT_FOODS;
}

function generateSmartFallback(
  message: string,
  liveFoods: LiveFoodItem[],
  locationName: string = "near you"
): { reply: string; provider: string; model: string } {
  const q = (message || "").toLowerCase().trim();

  // Pure greetings check
  const isGreetingOnly = /^(hi|hello|hey|namaste|good\s*(morning|afternoon|evening)|start|greetings)[\s!.]*$/i.test(q);
  if (isGreetingOnly) {
    return {
      reply: `Welcome to FoodFlow! 🍔 I am your smart AI Food Guide. What kind of delicious food are you craving today? You can ask for our spicy delights, biryani, pizzas, burgers, or healthy meals!`,
      provider: "local",
      model: "rule-engine",
    };
  }

  let matches: LiveFoodItem[] = [];
  let headline = `🍽️ Here are the top recommended dishes ${locationName}:`;

  if (q.includes("spicy") || q.includes("hot") || q.includes("chili") || q.includes("fiery") || q.includes("pepper")) {
    matches = liveFoods.filter(
      (f) =>
        f.isSpicy ||
        f.category.toLowerCase().includes("pizza") ||
        f.category.toLowerCase().includes("biryani") ||
        f.category.toLowerCase().includes("burger") ||
        f.category.toLowerCase().includes("pasta")
    );
    headline = `🔥 Here are the best spicy food options available ${locationName}! Packed with bold flavors and fiery zest:`;
  } else if (
    q.includes("biryani") ||
    q.includes("rice") ||
    q.includes("mutton") ||
    q.includes("chicken biryani")
  ) {
    matches = liveFoods.filter(
      (f) =>
        f.name.toLowerCase().includes("biryani") ||
        f.category.toLowerCase().includes("biryani")
    );
    headline = `🍛 Craving aromatic, slow-cooked Biryani? Here are our top biryani picks ${locationName}:`;
  } else if (q.includes("pizza") || q.includes("cheese") || q.includes("crust")) {
    matches = liveFoods.filter(
      (f) =>
        f.name.toLowerCase().includes("pizza") ||
        f.category.toLowerCase().includes("pizza")
    );
    headline = `🍕 Hot and cheesy! Here are our best freshly baked pizzas ${locationName}:`;
  } else if (q.includes("burger")) {
    matches = liveFoods.filter(
      (f) =>
        f.name.toLowerCase().includes("burger") ||
        f.category.toLowerCase().includes("burger")
    );
    headline = `🍔 Fresh and juicy! Here are the top burgers ${locationName}:`;
  } else if (
    q.includes("healthy") ||
    q.includes("salad") ||
    q.includes("diet") ||
    q.includes("protein")
  ) {
    matches = liveFoods.filter(
      (f) =>
        f.isVegetarian ||
        f.category.toLowerCase().includes("healthy") ||
        f.name.toLowerCase().includes("salad")
    );
    headline = `🥗 Fresh and nutritious! Here are our top healthy diet options ${locationName}:`;
  } else if (
    q.includes("budget") ||
    q.includes("cheap") ||
    q.includes("under") ||
    q.includes("₹") ||
    /\b\d{2,4}\b/.test(q)
  ) {
    const budgetMatch = q.match(/\b(\d{2,4})\b/);
    const budgetCap = budgetMatch ? parseInt(budgetMatch[1], 10) : 500;
    matches = liveFoods.filter((f) => (f.discountPrice || f.price) <= budgetCap);
    headline = `💰 Great food within budget! Here are delicious options under ₹${budgetCap} ${locationName}:`;
  }

  const recs = (matches.length > 0 ? matches : liveFoods).slice(0, 4);
  const dishList = recs
    .map((f) => `**${f.name}** (₹${f.discountPrice || f.price})`)
    .join(", ");

  const reply = `${headline}\n\nTop selections include ${dishList}. Tap **Add to Cart** or **Buy Now** on any card below to place your order directly!\n\n\`\`\`food_recommendations\n${JSON.stringify(
    recs,
    null,
    2
  )}\n\`\`\`\n\`\`\`action_buttons\n[{"type":"CHECKOUT","label":"Proceed to Checkout"}]\n\`\`\``;

  return {
    reply,
    provider: "local",
    model: "smart-concierge",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userMessage = (body.message || "").trim();
    const locationName =
      body.userLocation?.zoneName ||
      body.userLocation?.area ||
      body.userLocation?.city ||
      "near you";

    // 1. Try Express Backend Server First (Fast 8s timeout)
    const targetUrl = `${getApiBaseUrl()}/ai/chat`;

    try {
      const serverRes = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });

      if (serverRes.ok) {
        const data = await serverRes.json();
        // Ensure reply is not a generic welcome for a specific question
        if (
          data &&
          data.success &&
          data.reply &&
          !(
            data.provider === "local" &&
            data.reply.includes("Welcome to FoodFlow AI Assistant! What kind of delicious food") &&
            userMessage.length > 5
          )
        ) {
          return NextResponse.json(data);
        }
      }
    } catch (proxyErr) {
      console.warn("[Client AI Chat Proxy] Direct backend call timed out or failed, engaging failover engines:", proxyErr);
    }

    // 2. Fetch live foods from DB for rich context injection
    const liveFoods = await getLiveFoodsFromDb();
    const liveFoodsSummary = liveFoods
      .slice(0, 10)
      .map(
        (f) =>
          `- ${f.name} (₹${f.discountPrice || f.price}, Category: ${f.category}, Restaurant: ${
            f.restaurantName
          }, Spicy: ${f.isSpicy ? "Yes" : "No"})`
      )
      .join("\n");

    const systemPrompt = `You are FoodFlow AI, an intelligent, charming food concierge for FoodFlow delivery platform in India.
You communicate exclusively in fluent English.
Always recommend delicious food options available in the customer's area (${locationName}).
Prices MUST be in Indian Rupee format: ₹<amount>.
When recommending dishes, ALWAYS append an interactive JSON codeblock formatted EXACTLY like this:
\`\`\`food_recommendations
[
  {
    "id": "exact_food_id",
    "name": "Food Name",
    "price": 249,
    "discountPrice": 219,
    "restaurantName": "Restaurant Name",
    "image": "https://...",
    "rating": 4.8,
    "isSpicy": true
  }
]
\`\`\`

Here is our live menu data:
${JSON.stringify(liveFoods.slice(0, 8), null, 2)}`;

    // 3. Failover: GROQ (Ultra-fast, ~400ms latency)
    const groqKey = process.env.GROQ_API_KEY?.trim();
    if (groqKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "qwen/qwen3.8-27b",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage || "Recommend top dishes" },
            ],
            temperature: 0.6,
            max_tokens: 800,
          }),
          signal: AbortSignal.timeout(7000),
        });

        if (groqRes.ok) {
          const gData = await groqRes.json();
          const replyText = gData?.choices?.[0]?.message?.content;
          if (replyText && replyText.trim().length > 0) {
            return NextResponse.json({
              success: true,
              reply: replyText.trim(),
              provider: "groq",
              model: "qwen/qwen3.8-27b",
            });
          }
        }
      } catch (groqErr) {
        console.warn("[Client AI Chat] Groq failover error:", groqErr);
      }
    }

    // 4. Failover: OpenRouter (DeepSeek / Claude)
    const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();
    if (openrouterKey) {
      try {
        const openrouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openrouterKey}`,
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Food Flow Food Delivery",
          },
          body: JSON.stringify({
            model: process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage || "Recommend top dishes" },
            ],
            temperature: 0.6,
            max_tokens: 800,
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (openrouterRes.ok) {
          const oData = await openrouterRes.json();
          const replyText = oData?.choices?.[0]?.message?.content;
          if (replyText && replyText.trim().length > 0) {
            return NextResponse.json({
              success: true,
              reply: replyText.trim(),
              provider: "openrouter",
              model: process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat",
            });
          }
        }
      } catch (orErr) {
        console.warn("[Client AI Chat] OpenRouter failover error:", orErr);
      }
    }

    // 5. Failover: Gemini (gemini-2.5-flash)
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
        const gRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userMessage || "Recommend dishes" }] }],
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
          }),
          signal: AbortSignal.timeout(7000),
        });

        if (gRes.ok) {
          const gData = await gRes.json();
          const text = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim().length > 0) {
            return NextResponse.json({
              success: true,
              reply: text.trim(),
              provider: "gemini",
              model: "gemini-2.5-flash",
            });
          }
        }
      } catch (gErr) {
        console.warn("[Client AI Chat] Gemini fallback error:", gErr);
      }
    }

    // 6. Final Intelligent Local Concierge (Never sends a dumb static greeting to a specific food query)
    const smartFallback = generateSmartFallback(userMessage, liveFoods, locationName);
    return NextResponse.json({
      success: true,
      reply: smartFallback.reply,
      provider: smartFallback.provider,
      model: smartFallback.model,
    });
  } catch (error: any) {
    console.error("[Client AI Chat] Route handler critical error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to process chat",
        reply: "I am ready to help you discover great food! Please ask for spicy dishes, biryani, pizzas, or healthy meals.",
      },
      { status: 500 }
    );
  }
}
