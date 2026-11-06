/**
 * Grocery Utilities for Restaurant Ingredients & Aggregation
 */

export interface IAisleGroup {
  category: string;
  aisleName: string;
  icon: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    displayQuantity: string;
    unit: string;
    dishes: string[];
    isChecked?: boolean;
  }>;
}

export const GROCERY_AISLES = [
  { id: 'produce', name: 'Produce (Vegetables & Fresh Herbs)', icon: '🥦' },
  { id: 'meat', name: 'Meat & Poultry', icon: '🍗' },
  { id: 'seafood', name: 'Fish & Seafood', icon: '🐟' },
  { id: 'dairy', name: 'Dairy, Eggs & Chilled', icon: '🧀' },
  { id: 'grains', name: 'Grains, Rice, Flour & Pulses', icon: '🌾' },
  { id: 'spices', name: 'Spices, Herbs & Seasonings', icon: '🧂' },
  { id: 'oils', name: 'Oils, Sauces & Condiments', icon: '🍶' },
  { id: 'bakery', name: 'Bakery & Baking Supplies', icon: '🍞' },
  { id: 'beverages', name: 'Beverages, Sweeteners & Syrups', icon: '☕' },
  { id: 'packaging', name: 'Packaging & Kitchen Supplies', icon: '📦' },
  { id: 'pantry', name: 'General Pantry Staples', icon: '🥫' },
];

export const classifyIngredient = (ingredientName: string): string => {
  const lower = (ingredientName || '').toLowerCase().trim();

  // Meat & Poultry
  if (
    /\b(chicken|beef|mutton|lamb|goat|duck|turkey|veal|kheema|mince|sausage|bacon|pork|meat|wings|drumstick|thigh|breast|patty)\b/i.test(
      lower
    )
  ) {
    return 'Meat & Poultry';
  }

  // Seafood
  if (
    /\b(fish|salmon|tuna|prawn|prawns|shrimp|shrimps|crab|squid|lobster|rohu|rui|katla|hilsa|ilish|tilapia|bhetki|pomfret|calamari|seafood)\b/i.test(
      lower
    )
  ) {
    return 'Fish & Seafood';
  }

  // Dairy & Eggs
  if (
    /\b(milk|yogurt|curd|dahi|ghee|butter|paneer|cheese|mozzarella|cheddar|cream|heavy cream|sour cream|egg|eggs|dim|condensed milk|whipping cream|mayo)\b/i.test(
      lower
    )
  ) {
    return 'Dairy, Eggs & Chilled';
  }

  // Produce
  if (
    /\b(onion|onions|pyaj|tomato|tomatoes|potato|potatoes|alu|garlic|lasun|ginger|ada|coriander|dhaniya|mint|pudina|chili|chillies|chilli|morich|lemon|lime|capsicum|bell pepper|carrot|cabbage|cauliflower|cucumber|spinach|palak|mushroom|mushrooms|lettuce|herb|vegetable|vegetables|peas|green peas|eggplant|brinjal|begun|zucchini|broccoli|radish|okra|bhindi|curry leaves|lemongrass|spring onion|scallion|banana|apple|mango|orange|lime juice|lemon juice)\b/i.test(
      lower
    )
  ) {
    return 'Produce (Vegetables & Fresh Herbs)';
  }

  // Grains & Pulses
  if (
    /\b(rice|basmati|polao|chinigura|kalijeera|dal|daal|lentil|lentils|chickpeas|chana|gram|flour|atta|maida|semolina|suji|cornstarch|corn flour|noodle|noodles|pasta|spaghetti|macaroni|oats|breadcrumbs|besan|vermicelli|shemai|quinoa)\b/i.test(
      lower
    )
  ) {
    return 'Grains, Rice, Flour & Pulses';
  }

  // Spices
  if (
    /\b(salt|pepper|black pepper|turmeric|haldi|chili powder|mirch|garam masala|masala|cumin|jeera|coriander powder|cardamom|elaichi|cinnamon|dalchini|clove|cloves|laung|bay leaf|bay leaves|tej pata|mustard seed|fenugreek|methi|kasuri methi|saffron|kesar|zafran|paprika|oregano|rosemary|thyme|nutmeg|jaiphal|mace|javitri|star anise|chaat masala|biryani masala|tandoori masala|allspice|cajun|fennel|saunf)\b/i.test(
      lower
    )
  ) {
    return 'Spices, Herbs & Seasonings';
  }

  // Oils & Condiments
  if (
    /\b(oil|mustard oil|soybean oil|olive oil|vegetable oil|sunflower oil|sesame oil|canola oil|soy sauce|soya sauce|vinegar|ketchup|tomato paste|tomato puree|chili sauce|hot sauce|mayonnaise|mustard paste|kasundi|fish sauce|oyster sauce|bbq sauce|sweet chili|tahini|honey)\b/i.test(
      lower
    )
  ) {
    return 'Oils, Sauces & Condiments';
  }

  // Bakery
  if (
    /\b(bread|bun|buns|burger bun|naan|roti|paratha|tortilla|pita|yeast|baking powder|baking soda|vanilla|vanilla extract|cocoa|cocoa powder|chocolate|dough)\b/i.test(
      lower
    )
  ) {
    return 'Bakery & Baking Supplies';
  }

  // Beverages & Sweeteners
  if (
    /\b(sugar|brown sugar|jaggery|gur|tea|chai|green tea|coffee|espresso|syrup|caramel|juice|soda|club soda|sparkling water|tonic|drink mix)\b/i.test(
      lower
    )
  ) {
    return 'Beverages, Sweeteners & Syrups';
  }

  // Packaging
  if (
    /\b(box|container|foil|aluminum foil|cling film|paper bag|plastic bag|napkin|tissue|spoon|fork|knife|straw|cup|bowl|takeaway|disposable)\b/i.test(
      lower
    )
  ) {
    return 'Packaging & Kitchen Supplies';
  }

  return 'General Pantry Staples';
};

const normalizeUnit = (u: string): string => {
  const clean = (u || '').toLowerCase().replace(/[.]+$/, '').trim();
  if (['g', 'gm', 'gram', 'grams'].includes(clean)) return 'g';
  if (['kg', 'kgs', 'kilo', 'kilogram', 'kilograms'].includes(clean)) return 'kg';
  if (['ml', 'milliliter', 'millilitre'].includes(clean)) return 'ml';
  if (['l', 'ltr', 'liter', 'liters', 'litre', 'litres'].includes(clean)) return 'L';
  if (['tbsp', 'tablespoon', 'tablespoons'].includes(clean)) return 'tbsp';
  if (['tsp', 'teaspoon', 'teaspoons'].includes(clean)) return 'tsp';
  if (['cup', 'cups'].includes(clean)) return 'cup';
  if (['pinch', 'pinches'].includes(clean)) return 'pinch';
  if (['pcs', 'pc', 'piece', 'pieces'].includes(clean)) return 'pcs';
  if (['pkt', 'packet', 'packets', 'pack', 'packs'].includes(clean)) return 'pkt';
  if (['clove', 'cloves'].includes(clean)) return 'cloves';
  if (['slice', 'slices'].includes(clean)) return 'slices';
  if (['can', 'cans'].includes(clean)) return 'can';
  if (['bunch', 'bunches'].includes(clean)) return 'bunch';
  return clean || 'pcs';
};

export const parseIngredientString = (
  raw: string
): { quantity: number; unit: string; name: string } => {
  if (!raw || typeof raw !== 'string') {
    return { quantity: 1, unit: 'unit', name: 'Ingredient' };
  }

  const cleaned = raw.trim();

  // Pattern 1: Leading quantity & unit
  const leadingMatch = cleaned.match(/^([\d./]+)\s*([a-zA-Z]+)?\s*[:\-–]?\s*(.*)$/);
  if (leadingMatch) {
    const rawVal = leadingMatch[1];
    let qty = 1;
    if (rawVal.includes('/')) {
      const parts = rawVal.split('/');
      if (parts.length === 2 && parseFloat(parts[1]) !== 0) {
        qty = parseFloat(parts[0]) / parseFloat(parts[1]);
      }
    } else {
      qty = parseFloat(rawVal) || 1;
    }

    const unitCandidate = (leadingMatch[2] || '').toLowerCase();
    const restName = (leadingMatch[3] || '').trim();

    const KNOWN_UNITS = [
      'g', 'gm', 'gram', 'grams', 'kg', 'kgs', 'kilo', 'kilogram',
      'ml', 'l', 'ltr', 'liter', 'tbsp', 'tsp', 'cup', 'pinch',
      'pcs', 'pc', 'piece', 'pieces', 'pkt', 'packet', 'pack',
      'clove', 'cloves', 'slice', 'slices', 'can', 'bunch'
    ];

    if (KNOWN_UNITS.includes(unitCandidate)) {
      return {
        quantity: qty,
        unit: normalizeUnit(unitCandidate),
        name: restName || cleaned,
      };
    }

    if (restName) {
      return {
        quantity: qty,
        unit: 'pcs',
        name: `${leadingMatch[2]} ${restName}`.trim(),
      };
    }
  }

  return {
    quantity: 1,
    unit: 'pcs',
    name: cleaned,
  };
};

export const formatDisplayQuantity = (quantity: number, unit: string): string => {
  const rounded = Math.round(quantity * 100) / 100;

  if (unit === 'g' && rounded >= 1000) {
    const inKg = Math.round((rounded / 1000) * 100) / 100;
    return `${inKg} kg`;
  }

  if (unit === 'ml' && rounded >= 1000) {
    const inL = Math.round((rounded / 1000) * 100) / 100;
    return `${inL} L`;
  }

  return `${rounded} ${unit}`;
};
