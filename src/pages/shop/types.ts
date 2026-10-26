export interface PriceTier {
  min: number;
  max: number;
  price: number;
}

export interface Wholesale {
  moq: number;
  tiers: PriceTier[];
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  factoryId: string;
  price: number;
  compareAt?: number;
  rating: number;
  reviews: number;
  image: string;
  /** Uploaded gallery (first = cover) when the factory provided one. */
  images?: string[];
  tags: string[];
  shortDesc: string;
  description: string;
  weight: string;
  hs: string;
  origin: string;
  stock: number;
  featured?: boolean;
  bestseller?: boolean;
  isNew?: boolean;
  wholesale?: Wholesale;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  count: number;
  image: string;
}

export interface Factory {
  id: string;
  name: string;
  city: string;
  since: number;
  rating: number;
  products: number;
  verified: boolean;
  blurb: string;
}

export interface CountryPort {
  code: string;
  name: string;
  ports: string[];
}

export interface FactoryExtra {
  cover: string;
  workshop: string;
  certifications: string[];
  markets: string[];
  responseTime: string;
  employees: string;
  area: string;
  address: string;
}

export type PromoKind = 'percent' | 'fixed' | 'shipping';

export interface Promo {
  code: string;
  label: string;
  description: string;
  kind: PromoKind;
  value: number;
  minSubtotal: number;
  /** Set when the code belongs to an ambassador marketing page. */
  ambassadorSlug?: string;
  factoryId?: string;
}

export interface OrderLineSnapshot {
  id: string;
  name: string;
  image: string;
  factoryName: string;
  qty: number;
  unit: number;
  total: number;
}

export interface OrderReturn {
  /** Return case number, e.g. RET-126. */
  id: string;
  requestedAt: number;
  /** damaged | size | notAsDescribed | other — resolved to a label in the UI. */
  reason: string;
  /** Credit note issued to the buyer for this return. */
  creditNoteNo: string;
  /** Which order lines went back, and how many units of each. */
  items: { id: string; qty: number }[];
  /** Handling or return-shipping deducted from the credit, in SAR. */
  restockingFee?: number;
  /** Buyer's free-text note submitted with the return request. */
  note?: string;
}

export interface Order {
  id: string;
  createdAt: number;
  status: string;
  tracking: string;
  eta: string;
  lines: OrderLineSnapshot[];
  count: number;
  subtotal: number;
  savings: number;
  discount: number;
  shippingCost: number;
  customs: number;
  /** VAT charged on the goods value (0 for a zero-rated export). */
  vat?: number;
  /** VAT rate applied to this order, e.g. 0 or 0.15. */
  vatRate?: number;
  /** Tax invoice number issued with the order. */
  invoiceNo?: string;
  /** Buyer's VAT registration number when the merchant is registered. */
  buyerVatNo?: string;
  total: number;
  weightKg: number;
  customerName: string;
  country: string;
  city: string;
  port: string;
  shippingMethod: string;
  incoterm: string;
  /** Who clears customs at destination: Safeer, the buyer, or the buyer's agent. */
  customsParty?: string;
  promoCode?: string;
  ambassadorName?: string;
  /** retail = single parcel; wholesale = consolidated deal. */
  channel?: 'retail' | 'wholesale';
  /** Amount actually charged, always in SAR (display currency may differ). */
  chargedSar?: number;
  /** Display currency the buyer saw prices in. */
  displayCurrency?: string;
  /** 'transfer' when the order awaits a bank transfer confirmed by finance. */
  paymentMode?: 'gateway' | 'transfer';
  /** Present when the order had a return and a credit note was issued. */
  returnInfo?: OrderReturn;
}

export interface ShippingEstimate {
  weightKg: number;
  shipping: number;
  customs: number;
  total: number;
  method?: 'express' | 'group' | 'sea' | 'air';
  zone?: string;
  /** Freight + customs as a share of the goods value. */
  share?: number;
  /** False when a retail route breaks the shipping-share target. */
  withinTarget?: boolean;
  belowMinOrder?: boolean;
  minOrder?: number;
  /** Destination return window in days after delivery — drives commission lock. */
  returnDays?: number;
  etaDays?: [number, number];
}