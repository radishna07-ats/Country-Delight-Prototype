import type { Product } from "./types";

// Prototype catalogue. Names and pack sizes follow what is visible in the recorded app (S3);
// prices are ILLUSTRATIVE and tags are prototype attributes — production would read
// Country Delight's catalogue API (see 05_Product_Architecture/Integration_Requirements.md).

const milk = (o: Partial<Product> & Pick<Product, "id" | "name" | "short" | "price" | "mrp">): Product => ({
  size: "450 ml", category: "milk", art: { kind: "pouch", color: "#1F8FD1", accent: "#F2C230" },
  tags: [], allergens: ["milk"], diet: "veg", subscribable: true, frequencies: ["daily", "alternate", "weekly", "once"],
  inStockTomorrow: true, description: "", aliases: [], ...o,
} as Product);

export const CATALOGUE: Product[] = [
  milk({ id: "cow-milk", name: "Cow Milk", short: "cow milk", price: 48, mrp: 48, vipPrice: 36, tags: ["everyday"],
    description: "Fresh cow milk, delivered every morning.", aliases: ["cow milk", "milk", "doodh", "milk packet", "regular milk", "gaay"] }),
  milk({ id: "buffalo-milk", name: "Buffalo Milk", short: "buffalo milk", price: 56.5, mrp: 62, art: { kind: "pouch", color: "#2E7DB6", accent: "#D9480F" },
    tags: ["creamy"], description: "Thick, creamy buffalo milk.", aliases: ["buffalo milk", "bhains", "bhains ka doodh"] }),
  milk({ id: "low-fat-cow-milk", name: "Low Fat Cow Milk", short: "low fat cow milk", price: 45, mrp: 45, art: { kind: "pouch", color: "#3AA0D8", accent: "#2FA84F" },
    tags: ["low_fat", "heart_health"], description: "Lighter everyday cow milk.", aliases: ["low fat milk", "toned milk"] }),
  milk({ id: "low-malai-milk", name: "Low Malai Milk (Made From Buffalo Milk)", short: "low malai milk", price: 47, mrp: 47, art: { kind: "pouch", color: "#C0392B", accent: "#F2C230" },
    tags: ["low_fat"], description: "Murrah buffalo milk without the extra cream.", aliases: ["low malai", "malai milk"] }),
  milk({ id: "hp-cow-milk", name: "High Protein Cow Milk (Natural)", short: "high protein milk", price: 60, mrp: 64, art: { kind: "pouch", color: "#1E9E5A", accent: "#F2C230", label: "HIGH PROTEIN" },
    tags: ["high_protein", "fitness"], badge: "HIGH PROTEIN", description: "Cow milk tagged High Protein in the catalogue.", aliases: ["protein milk", "high protein milk"] }),
  milk({ id: "a2-cow-milk", name: "A2 Cow Milk (Tetrapack)", short: "A2 cow milk", size: "1 L", price: 140, mrp: 140, art: { kind: "tetra", color: "#F4F1E8", accent: "#2FA84F" },
    tags: ["a2"], description: "A2 cow milk in a 1 litre pack.", aliases: ["a2 milk", "a2"] }),
  { id: "coconut-water", name: "Tender Coconut", short: "coconut water", size: "1 pc", price: 110, mrp: 110, vipPrice: 97, category: "milk",
    art: { kind: "coconut", color: "#7CB342", accent: "#C5E1A5" }, tags: ["hydration", "fitness", "vegan"], allergens: [], diet: "vegan",
    subscribable: true, frequencies: ["daily", "alternate", "weekly", "once"], inStockTomorrow: true, description: "Fresh tender coconut.", aliases: ["coconut", "nariyal", "coconut water"] },
  { id: "taaza-paneer", name: "Taaza Paneer", short: "paneer", size: "180 g", price: 109.5, mrp: 117, category: "dairy",
    art: { kind: "block", color: "#FFE7A6", accent: "#C99A2E" }, tags: ["high_protein", "fitness"], allergens: ["milk"], diet: "veg",
    subscribable: true, frequencies: ["daily", "alternate", "weekly", "once"], inStockTomorrow: true, description: "Soft fresh paneer.", aliases: ["paneer", "cottage cheese"] },
  { id: "hp-paneer", name: "Taaza Paneer — High Protein", short: "high protein paneer", size: "200 g", price: 129, mrp: 140, category: "dairy",
    art: { kind: "block", color: "#FFE3A0", accent: "#1E9E5A", label: "HIGH PROTEIN" }, tags: ["high_protein", "fitness"], allergens: ["milk"], diet: "veg",
    subscribable: true, frequencies: ["daily", "alternate", "weekly", "once"], inStockTomorrow: true, badge: "HIGH PROTEIN", description: "Paneer tagged High Protein in the catalogue.", aliases: ["protein paneer"] },
  { id: "low-fat-dahi", name: "Low Fat Dahi", short: "dahi", size: "400 g", price: 58, mrp: 62, vipPrice: 46, category: "dairy",
    art: { kind: "tub", color: "#FFFFFF", accent: "#2FA84F" }, tags: ["gut_health", "low_fat"], allergens: ["milk"], diet: "veg",
    subscribable: true, frequencies: ["daily", "alternate", "weekly", "once"], inStockTomorrow: true, description: "Set curd made with low fat milk.", aliases: ["dahi", "curd", "yogurt"] },
  { id: "greek-yogurt", name: "Greek Yogurt — Plain", short: "greek yogurt", size: "200 g", price: 79, mrp: 85, category: "dairy",
    art: { kind: "cup", color: "#F7FBFF", accent: "#3F7FBF" }, tags: ["high_protein", "gut_health", "fitness"], allergens: ["milk"], diet: "veg",
    subscribable: true, frequencies: ["daily", "alternate", "weekly", "once"], inStockTomorrow: true, description: "Thick strained yogurt.", aliases: ["greek yogurt", "greek yoghurt"] },
  { id: "probiotic-lassi", name: "Probiotic Chaach", short: "chaach", size: "200 ml", price: 25, mrp: 30, category: "dairy",
    art: { kind: "bottle", color: "#F3FAF0", accent: "#2FA84F" }, tags: ["gut_health"], allergens: ["milk"], diet: "veg",
    subscribable: true, frequencies: ["daily", "alternate", "weekly", "once"], inStockTomorrow: true, description: "Spiced buttermilk.", aliases: ["chaach", "buttermilk", "lassi"] },
  { id: "desi-ghee", name: "Desi Danedar Ghee", short: "ghee", size: "850 ml", price: 689, mrp: 849, category: "staples",
    art: { kind: "jar", color: "#F6C445", accent: "#B7791F" }, tags: [], allergens: ["milk"], diet: "veg",
    subscribable: false, frequencies: ["once"], inStockTomorrow: true, description: "Danedar cow ghee.", aliases: ["ghee"] },
  { id: "brown-eggs", name: "Farm Brown Eggs", short: "eggs", size: "6 pcs", price: 72, mrp: 80, category: "breakfast",
    art: { kind: "eggs", color: "#D9A066", accent: "#F3E1C7" }, tags: ["high_protein", "fitness"], allergens: ["egg"], diet: "egg",
    subscribable: true, frequencies: ["daily", "alternate", "weekly", "once"], inStockTomorrow: true, description: "Brown eggs, pack of six.", aliases: ["eggs", "anda", "ande"] },
  { id: "wholewheat-bread", name: "Whole Wheat Bread", short: "bread", size: "400 g", price: 55, mrp: 60, category: "breakfast",
    art: { kind: "bread", color: "#C8874A", accent: "#F2D3A8" }, tags: ["fibre"], allergens: ["gluten"], diet: "vegan",
    subscribable: true, frequencies: ["daily", "alternate", "weekly", "once"], inStockTomorrow: true, description: "Whole wheat sandwich bread.", aliases: ["bread", "brown bread"] },
  { id: "idli-batter", name: "Idli Dosa Batter", short: "idli dosa batter", size: "450 g", price: 52, mrp: 56, category: "breakfast",
    art: { kind: "batter", color: "#FFFFFF", accent: "#E67E22" }, tags: ["gut_health"], allergens: [], diet: "vegan",
    subscribable: true, frequencies: ["daily", "alternate", "weekly", "once"], inStockTomorrow: true, description: "Fermented rice and urad batter.", aliases: ["batter", "idli batter", "dosa batter"] },
  { id: "peanut-butter", name: "Peanut Butter — Unsweetened", short: "peanut butter", size: "340 g", price: 199, mrp: 229, category: "staples",
    art: { kind: "jar", color: "#B5793A", accent: "#F2D3A8" }, tags: ["high_protein", "fitness"], allergens: ["peanut"], diet: "vegan",
    subscribable: false, frequencies: ["once"], inStockTomorrow: true, description: "Roasted peanuts, no added sugar.", aliases: ["peanut butter"] },
  { id: "almonds", name: "California Almonds", short: "almonds", size: "200 g", price: 239, mrp: 280, category: "snacks",
    art: { kind: "nuts", color: "#B07A4B", accent: "#E9CBA7" }, tags: ["high_protein", "fitness", "heart_health"], allergens: ["nuts"], diet: "vegan",
    subscribable: false, frequencies: ["once"], inStockTomorrow: true, description: "Whole almonds.", aliases: ["almonds", "badam"] },
  { id: "roasted-chana", name: "Roasted Chana — Salted", short: "roasted chana", size: "100 g × 3", price: 120, mrp: 150, category: "snacks",
    art: { kind: "bag", color: "#E9A23B", accent: "#7A4E1D" }, tags: ["high_protein", "fitness", "low_sugar"], allergens: [], diet: "vegan",
    subscribable: false, frequencies: ["once"], inStockTomorrow: true, description: "Roasted Bengal gram.", aliases: ["chana", "roasted chana"] },
  { id: "isabgol", name: "Isabgol Psyllium Husk", short: "isabgol", size: "45 g", price: 85, mrp: 109, category: "staples",
    art: { kind: "bag", color: "#E8F3E2", accent: "#2FA84F" }, tags: ["gut_health"], allergens: [], diet: "vegan",
    subscribable: false, frequencies: ["once"], inStockTomorrow: true, description: "Psyllium husk.", aliases: ["isabgol"] },
  { id: "banana", name: "Banana (Robusta)", short: "bananas", size: "3–4 pcs", price: 38.7, mrp: 49, category: "fruits",
    art: { kind: "banana", color: "#F7D63E", accent: "#8A6D1A" }, tags: ["fitness", "vegan"], allergens: [], diet: "vegan",
    subscribable: true, frequencies: ["daily", "alternate", "weekly", "once"], inStockTomorrow: true, description: "Ripe robusta bananas.", aliases: ["banana", "kela", "bananas"] },
  { id: "papaya", name: "Papaya (Ripe)", short: "papaya", size: "1–1.5 kg", price: 122.45, mrp: 155, category: "fruits",
    art: { kind: "papaya", color: "#F39C34", accent: "#3E7B27" }, tags: ["gut_health", "vegan"], allergens: [], diet: "vegan",
    subscribable: true, frequencies: ["weekly", "once"], inStockTomorrow: true, description: "Ripe papaya.", aliases: ["papaya", "papita"] },
  { id: "spinach", name: "Spinach (Palak)", short: "spinach", size: "250 g", price: 32, mrp: 40, category: "veggies",
    art: { kind: "leafy", color: "#2E8B3E", accent: "#8BC34A" }, tags: ["vegan", "heart_health"], allergens: [], diet: "vegan",
    subscribable: true, frequencies: ["alternate", "weekly", "once"], inStockTomorrow: false, description: "Fresh spinach.", aliases: ["spinach", "palak"] },
  { id: "atta", name: "Chakki Atta", short: "atta", size: "5 kg", price: 289, mrp: 340, category: "staples",
    art: { kind: "bag", color: "#F5E6C8", accent: "#B7791F" }, tags: [], allergens: ["gluten"], diet: "vegan",
    subscribable: false, frequencies: ["once"], inStockTomorrow: true, description: "Whole wheat chakki atta.", aliases: ["atta", "flour"] },
  // Illustrative "Health & Nutrition" items added so the in-app operator demo can run a price-constrained,
  // rating-based search ("protein powder under ₹2,000, best rated"). Not observed in Country Delight's app.
  { id: "whey-1kg", name: "Whey Protein Powder — Unflavoured", short: "whey protein", size: "1 kg", price: 1899, mrp: 2199, category: "nutrition",
    art: { kind: "powder", color: "#1F4D2B", accent: "#F2C230", label: "WHEY" }, tags: ["high_protein", "fitness"], allergens: ["milk"], diet: "veg",
    subscribable: false, frequencies: ["once"], inStockTomorrow: true, description: "Unflavoured whey protein concentrate.", aliases: ["whey", "whey protein", "protein powder"] },
  { id: "plant-protein", name: "Plant Protein Powder — Chocolate", short: "plant protein", size: "500 g", price: 1299, mrp: 1499, category: "nutrition",
    art: { kind: "powder", color: "#6B4A2B", accent: "#9CCB4A", label: "PLANT" }, tags: ["high_protein", "fitness", "vegan"], allergens: ["soy"], diet: "vegan",
    subscribable: false, frequencies: ["once"], inStockTomorrow: true, description: "Pea and soy protein blend.", aliases: ["plant protein", "vegan protein", "protein powder"] },
  { id: "whey-2kg", name: "Whey Protein Powder — Chocolate", short: "chocolate whey", size: "2 kg", price: 3499, mrp: 3999, category: "nutrition",
    art: { kind: "powder", color: "#3B2A1E", accent: "#E0A93B", label: "WHEY" }, tags: ["high_protein", "fitness"], allergens: ["milk"], diet: "veg",
    subscribable: false, frequencies: ["once"], inStockTomorrow: true, description: "Chocolate whey protein, 2 kg tub.", aliases: ["chocolate whey", "protein powder"] },
];

// ILLUSTRATIVE ratings (stars, number of ratings) used only by the prototype's search, sort and the agent's
// "best-rated" choice. Country Delight's app did not show product ratings in the recording.
const RATINGS: Record<string, [number, number]> = {
  "cow-milk": [4.5, 12840], "buffalo-milk": [4.4, 6210], "low-fat-cow-milk": [4.3, 3120], "low-malai-milk": [4.2, 1890], "hp-cow-milk": [4.4, 2260],
  "a2-cow-milk": [4.5, 980], "coconut-water": [4.1, 2750], "taaza-paneer": [4.6, 8930], "hp-paneer": [4.5, 1410], "low-fat-dahi": [4.4, 5120],
  "greek-yogurt": [4.3, 1180], "probiotic-lassi": [4.2, 940], "desi-ghee": [4.6, 4380], "brown-eggs": [4.3, 3650], "wholewheat-bread": [4.2, 2890],
  "idli-batter": [4.4, 3310], "peanut-butter": [4.3, 1270], "almonds": [4.4, 1960], "roasted-chana": [4.1, 720], isabgol: [4.2, 410],
  banana: [4.0, 4100], papaya: [3.9, 1630], spinach: [4.1, 2240], atta: [4.3, 2050], "whey-1kg": [4.6, 2140], "plant-protein": [4.3, 860], "whey-2kg": [4.7, 3010],
};
for (const p of CATALOGUE) { const r = RATINGS[p.id]; if (r) { p.rating = r[0]; p.reviews = r[1]; } }

export const byId = (id: string) => CATALOGUE.find((p) => p.id === id)!;

/** Catalogue search used by the Products screen: every word must match the name, aliases, tags or category. */
export function searchCatalogue(q: string): Product[] {
  const words = q.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w && !["a", "an", "the", "some", "me", "for", "my", "our", "your"].includes(w));
  if (!words.length) return [];
  const stem = (w: string) => w.replace(/(es|s)$/, "");
  return CATALOGUE.filter((p) => {
    const hay = ` ${[p.name, ...p.aliases, ...p.tags.map((t) => t.replace(/_/g, " ")), p.category].join(" ").toLowerCase().replace(/[^a-z0-9\s]/g, " ")} `;
    return words.every((w) => hay.includes(` ${stem(w)}`) || hay.includes(` ${w}`));
  });
}

export const HEALTH_GOALS = [
  { id: "high_protein", label: "High Protein" },
  { id: "gut_health", label: "Gut Health" },
  { id: "heart_health", label: "Heart Health" },
  { id: "low_sugar", label: "Low Sugar" },
  { id: "low_fat", label: "Lighter options" },
] as const;

export const ALLERGENS = [
  { id: "milk", label: "Milk / lactose" },
  { id: "nuts", label: "Tree nuts" },
  { id: "peanut", label: "Peanuts" },
  { id: "gluten", label: "Gluten" },
  { id: "egg", label: "Egg" },
] as const;
