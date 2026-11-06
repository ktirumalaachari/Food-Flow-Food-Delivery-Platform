import React from 'react';

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  burgers: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
  'bbq & grill': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
  bbq: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
  grill: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
  chinese: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80',
  desserts: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  dessert: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  drinks: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
  drink: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
  healthy: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  sushi: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
  indian: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
  'indian & tandoori': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
  thai: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
};

/**
 * Returns a fallback image URL according to category or dish name keywords
 */
export function getCategoryFallbackImage(category?: string, name?: string): string {
  const catKey = (category || '').toLowerCase().trim();
  if (catKey && CATEGORY_FALLBACK_IMAGES[catKey]) {
    return CATEGORY_FALLBACK_IMAGES[catKey];
  }

  // Check matching by name keyword
  const nameKey = (name || '').toLowerCase();
  if (nameKey.includes('biryani') || nameKey.includes('pulao') || nameKey.includes('rice') || nameKey.includes('tehari')) {
    return CATEGORY_FALLBACK_IMAGES['biryani'];
  }
  if (nameKey.includes('pizza')) {
    return CATEGORY_FALLBACK_IMAGES['pizza'];
  }
  if (nameKey.includes('burger')) {
    return CATEGORY_FALLBACK_IMAGES['burger'];
  }
  if (nameKey.includes('pasta') || nameKey.includes('alfredo') || nameKey.includes('spaghetti') || nameKey.includes('fettuccine')) {
    return CATEGORY_FALLBACK_IMAGES['pasta'];
  }
  if (nameKey.includes('bbq') || nameKey.includes('grill') || nameKey.includes('tikka') || nameKey.includes('tandoori') || nameKey.includes('kebab') || nameKey.includes('pakoda')) {
    return CATEGORY_FALLBACK_IMAGES['bbq & grill'];
  }
  if (nameKey.includes('noodle') || nameKey.includes('chow') || nameKey.includes('dim sum') || nameKey.includes('manchurian') || nameKey.includes('chinese')) {
    return CATEGORY_FALLBACK_IMAGES['chinese'];
  }
  if (nameKey.includes('cake') || nameKey.includes('brownie') || nameKey.includes('dessert') || nameKey.includes('sweet') || nameKey.includes('pudding') || nameKey.includes('tiramisu')) {
    return CATEGORY_FALLBACK_IMAGES['desserts'];
  }
  if (nameKey.includes('coffee') || nameKey.includes('tea') || nameKey.includes('lassi') || nameKey.includes('drink') || nameKey.includes('juice') || nameKey.includes('mojito')) {
    return CATEGORY_FALLBACK_IMAGES['drinks'];
  }
  if (nameKey.includes('salad') || nameKey.includes('thali') || nameKey.includes('dosa') || nameKey.includes('veg')) {
    return CATEGORY_FALLBACK_IMAGES['healthy'];
  }
  if (nameKey.includes('sushi') || nameKey.includes('roll')) {
    return CATEGORY_FALLBACK_IMAGES['sushi'];
  }

  return CATEGORY_FALLBACK_IMAGES.default;
}

/**
 * Validates whether an image URL is obviously broken (empty, typo domains, etc.)
 */
export function isBrokenImageUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed) return true;
  // Known broken domain typos or empty placeholders
  if (trimmed.includes('i.ibb.co.com')) return true;
  if (trimmed.includes('example.com') || trimmed === 'placeholder') return true;
  return false;
}

/**
 * Safe image resolver that supplies a valid URL upfront if the stored one is broken
 */
export function resolveFoodImage(image?: string, category?: string, name?: string): string {
  if (isBrokenImageUrl(image)) {
    return getCategoryFallbackImage(category, name);
  }
  return image!;
}

/**
 * Standard onError image handler to prevent infinite loops and ensure dishes always show enticing food photos
 */
export function handleFoodImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  category?: string,
  name?: string
): void {
  const target = e.target as HTMLImageElement;
  if (!target) return;

  const stage = target.dataset.fallbackStage || '0';
  if (stage === '0') {
    target.dataset.fallbackStage = '1';
    target.src = getCategoryFallbackImage(category, name);
  } else if (stage === '1') {
    target.dataset.fallbackStage = '2';
    target.src = CATEGORY_FALLBACK_IMAGES.default;
  }
}
