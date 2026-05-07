// ...existing code from aiService.js...
// ─────────────────────────────────────────────────────────────────────────────
// services/aiService.js
// AI Category Auto-Suggest — Emerging Technology requirement
//
// Called from AddPostScreen after user pauses typing the post title (1s debounce)
// Sends the title to Claude Haiku API
// Returns exactly one word: 'Food' | 'Item' | 'Tip' | null
//
// Fails silently — if the API is unavailable or returns an unexpected value,
// null is returned and the user can select the category manually
// ─────────────────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = ["Food", "Item", "Tip"];

// ─────────────────────────────────────────────────────────────────────────────
// SUGGEST CATEGORY FROM POST TITLE
//
// title   : the post title string typed by the user
// Returns : 'Food' | 'Item' | 'Tip' | null
// ─────────────────────────────────────────────────────────────────────────────
export const suggestCategory = async (
  title: string,
): Promise<"Food" | "Item" | "Tip" | null> => {
  // Don't bother with very short titles — not enough context
  if (!title || title.trim().length < 3) return null;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", // Fastest + cheapest for classification
        max_tokens: 10, // We only need one word back
        messages: [
          {
            role: "user",
            content: `You are a category classifier for a Filipino campus budget-finds app called Sulit Spot.

Categories and when to use them:
- Food  → anything about food, drinks, snacks, meals, canteen, turo-turo, eateries, restaurants
- Item  → school supplies, products, goods, merchandise, secondhand items, gadgets, clothes
- Tip   → money-saving advice, discount strategies, promos, coupons, hacks, general tips

Post title: "${title.trim()}"

Reply with ONLY one word — no punctuation, no explanation: Food, Item, or Tip.`,
          },
        ],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const raw = data?.content?.[0]?.text?.trim() ?? "";

    // Match case-insensitively against valid categories
    const category = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === raw.toLowerCase(),
    );

    return (category as "Food" | "Item" | "Tip") || null;
  } catch {
    // Network failure, API key missing, or unexpected error — fail silently
    return null;
  }
};
