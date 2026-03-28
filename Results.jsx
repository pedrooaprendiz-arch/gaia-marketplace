// GAIA PRICING ENGINE - STRICT RULES
// HARD CAPS: Small ≤€12, Medium ≤€24, Large ≤€38

const VEHICLE_PRICING = { marketRatePerKm: 0.50, gaiaDiscount: 0.15 };

const BOX_PRICING = {
  small: { maxWeight: 5, minPrice: 8, midPrice: 10, maxPrice: 12 },
  medium: { maxWeight: 15, minPrice: 16, midPrice: 20, maxPrice: 24 },
  large: { minWeight: 15, maxWeight: 30, minPrice: 26, midPrice: 32, maxPrice: 38 }
};

function getBoxPriceByDistance(size, distanceKm) {
  const config = BOX_PRICING[size];
  if (!config) return 0;
  if (distanceKm < 200) return config.minPrice;
  if (distanceKm < 1000) return config.midPrice;
  return config.maxPrice;
}

const PALLET_PRICING = {
  baseRate: 0.00012,
  minPrice: 25,
  loadModifiers: { partial: 0.90, standard: 1.00, full: 1.10 }
};

const MOVING_PRICING = {
  boxPrice: 10,
  largeItemPrice: 80,
  handling: { stairs: 0.10, fragile: 0.15 }
};

export const GAIA_UI = {
  savingsLabel: "Save up to 15% vs market average",
  networkLabel: "Smart Logistics Network",
  routeLabel: "Optimized Route",
  matchLabel: "Best Match",
  verifiedLabel: "Verified Carrier",
  capacityLabel: "Using existing transport flow",
  buttonPrimary: "Find Smart Capacity",
  buttonSecondary: "Select",
};

export const GAIA_BOX_UI = {
  title: "GAIA Box",
  subtitle: "Flexible micro-shipment service",
  options: [
    { name: "Small Box", description: "Up to 5kg", priceRange: "€8-€12", tag: "Best for documents" },
    { name: "Medium Box", description: "Up to 15kg", priceRange: "€16-€24", tag: "Most popular" },
    { name: "Large Box", description: "From 15kg until 30kg", priceRange: "€26-€38", tag: "Best value" }
  ],
  estimateLabel: "Estimated total",
  routeBlock: { title: "Optimized Route", description: "Using existing transport flow" }
};

export const GAIA_PALLET_UI = {
  title: "Pallet Transport",
  subtitle: "B2B freight optimized via shared capacity",
  fields: { pallets: "Number of Pallets", weight: "Total Weight (kg)" },
  estimateLabel: "Estimated transport cost",
  pricePerUnit: "per pallet",
  routeBlock: { title: "Optimized Route", description: "Using existing transport flow" }
};

export const GAIA_MOVING_UI = {
  title: "Moving Service",
  subtitle: "Smart relocation powered by logistics network",
  features: ["Full relocation support", "Optimized route matching", "Up to 15% savings vs market"],
  fields: { boxes: "Standard Boxes", largeItems: "Large Items / Furniture" },
  estimateLabel: "Estimated moving cost",
  routeBlock: { title: "Optimized Route", description: "Using existing transport flow" }
};

export const GAIA_CTA = {
  transporter: { title: "Are you a transporter?", subtitle: "Publish your routes and monetize unused capacity" },
  network: { title: "Join GAIA Network", subtitle: "Access new demand and optimize your operations" }
};

function roundToNearest(value, nearest = 1) {
  return Math.round(value / nearest) * nearest;
}

export function calculateVehiclePrice({ distanceKm = 0, vehicleType = "car", quantity = 1 }) {
  const marketPrice = distanceKm * VEHICLE_PRICING.marketRatePerKm * quantity;
  const gaiaPrice = marketPrice * (1 - VEHICLE_PRICING.gaiaDiscount);
  return {
    min: roundToNearest(gaiaPrice, 1),
    max: roundToNearest(marketPrice, 1),
    marketPrice: roundToNearest(marketPrice, 1),
    gaiaPrice: roundToNearest(gaiaPrice, 1)
  };
}

export function calculateBoxPrice({ smallQty = 0, mediumQty = 0, largeQty = 0, distanceKm = 0, handling = [] }) {
  const smallPrice = getBoxPriceByDistance('small', distanceKm);
  const mediumPrice = getBoxPriceByDistance('medium', distanceKm);
  const largePrice = getBoxPriceByDistance('large', distanceKm);
  
  const totalBase = (smallQty * smallPrice) + (mediumQty * mediumPrice) + (largeQty * largePrice);
  if (totalBase === 0) return { min: 0, max: 0 };
  
  let handlingFactor = 1.0;
  if (handling.includes('stairs')) handlingFactor += MOVING_PRICING.handling.stairs;
  if (handling.includes('fragile')) handlingFactor += MOVING_PRICING.handling.fragile;
  
  let adjustedTotal = totalBase * handlingFactor;
  const maxPossibleTotal = (smallQty * BOX_PRICING.small.maxPrice) + (mediumQty * BOX_PRICING.medium.maxPrice) + (largeQty * BOX_PRICING.large.maxPrice);
  adjustedTotal = Math.min(adjustedTotal, maxPossibleTotal * handlingFactor);
  
  return { min: roundToNearest(adjustedTotal, 1), max: roundToNearest(adjustedTotal * 1.15, 1) };
}

export function calculatePalletPrice({ distanceKm = 0, palletQty = 1, weightKg = 500, loadType = "standard" }) {
  const basePrice = weightKg * distanceKm * PALLET_PRICING.baseRate;
  const priceWithMin = Math.max(basePrice, PALLET_PRICING.minPrice);
  const loadModifier = PALLET_PRICING.loadModifiers[loadType] || 1.0;
  const finalPrice = priceWithMin * loadModifier * palletQty;
  return { min: roundToNearest(finalPrice, 1), max: roundToNearest(finalPrice * 1.15, 1) };
}

export function calculateMovingPrice({ boxes = 0, largeItems = 0, handling = [], distanceKm = 0 }) {
  const basePrice = (boxes * MOVING_PRICING.boxPrice) + (largeItems * MOVING_PRICING.largeItemPrice);
  if (basePrice === 0) return { min: 0, max: 0 };
  
  let handlingFactor = 1.0;
  if (handling.includes('stairs')) handlingFactor += MOVING_PRICING.handling.stairs;
  if (handling.includes('fragile')) handlingFactor += MOVING_PRICING.handling.fragile;
  
  const finalPrice = basePrice * handlingFactor;
  return { min: roundToNearest(finalPrice, 1), max: roundToNearest(finalPrice * 1.15, 1) };
}

export function calculateGaiaPrice(type, params) {
  switch (type) {
    case "box": case "gaiabox": return calculateBoxPrice(params);
    case "pallet": return calculatePalletPrice(params);
    case "moving": case "volume": return calculateMovingPrice(params);
    case "vehicle": return calculateVehiclePrice(params);
    default: throw new Error("Invalid GAIA pricing type");
  }
}

export function getTransporterBoxEarnings(size, distanceKm) {
  return getBoxPriceByDistance(size, distanceKm);
}

export function calculateTransporterPalletEarnings({ distanceKm = 0, weightKg = 500, loadType = "standard", palletQty = 1 }) {
  return calculatePalletPrice({ distanceKm, weightKg, loadType, palletQty });
}

export function calculateTransporterMixedEarnings({ distanceKm = 0, fullPallets = 0, halfPallets = 0, weightKg = 500, loadType = "standard" }) {
  const fullPalletEarnings = calculatePalletPrice({ distanceKm, weightKg, loadType, palletQty: fullPallets });
  const halfPalletBasePrice = calculatePalletPrice({ distanceKm, weightKg, loadType, palletQty: 1 });
  const halfPalletTotal = (halfPalletBasePrice.min / 2) * halfPallets;
  return {
    min: roundToNearest(fullPalletEarnings.min + halfPalletTotal, 1),
    max: roundToNearest(fullPalletEarnings.max + (halfPalletBasePrice.max / 2) * halfPallets, 1)
  };
}

const CITY_DISTANCES = {
  'lisboa-madrid': 625, 'lisboa-paris': 1735, 'lisboa-berlin': 2850, 'lisboa-porto': 315,
  'porto-madrid': 595, 'porto-paris': 1455, 'madrid-paris': 1270,
  'madrid-berlin': 2310, 'paris-berlin': 1050, 'paris-amsterdam': 500,
  'berlin-amsterdam': 660, 'barcelona-paris': 1035, 'barcelona-madrid': 620,
  'milan-paris': 850, 'milan-berlin': 1040, 'london-paris': 460,
  'munich-berlin': 585, 'munich-vienna': 435, 'rome-milan': 575,
  'hamburg-bremen': 120, 'hamburg-berlin': 290, 'hamburg-porto': 2100,
  'hamburg-munich': 780, 'hamburg-paris': 880, 'hamburg-amsterdam': 460,
};

export function getDistance(from, to) {
  if (!from || !to) return 0;
  const key1 = `${from.toLowerCase().trim()}-${to.toLowerCase().trim()}`;
  const key2 = `${to.toLowerCase().trim()}-${from.toLowerCase().trim()}`;
  return CITY_DISTANCES[key1] || CITY_DISTANCES[key2] || 800;
}

export const BOX_WEIGHTS = { small: 5, medium: 15, large: 30 };
export const BOX_PRICE_TIERS = {
  small: { min: 8, mid: 10, max: 12 },
  medium: { min: 16, mid: 20, max: 24 },
  large: { min: 26, mid: 32, max: 38 }
};
export const PALLET_LOAD_TYPES = ['partial', 'standard', 'full'];
export const MOVING_HANDLING_OPTIONS = ['stairs', 'fragile'];
export const PALLET_MIN_PRICE = 25;
