import type { PanelKey } from './panels';

export type RegFieldKind = 'text' | 'select' | 'tel' | 'url' | 'email';

export type RegField = {
  name: string;
  icon: string;
  kind: RegFieldKind;
  required?: boolean;
  ltr?: boolean;
  half?: boolean;
  options?: string[];
  placeholder?: string;
};

/* Every sign-up collects the same three contact fields first, then a
   panel-specific block, so the admin team always receives a complete dossier. */
export const CONTACT_FIELDS: RegField[] = [
  { name: 'phone', icon: 'ri-smartphone-line', kind: 'tel', required: true, ltr: true, half: true, placeholder: '+966 55 000 0000' },
  { name: 'country', icon: 'ri-global-line', kind: 'select', required: true, half: true, options: ['sa', 'ae', 'kw', 'qa', 'bh', 'om', 'jo', 'eg', 'tr', 'ma', 'other'] },
  { name: 'city', icon: 'ri-map-pin-line', kind: 'text', required: true, half: true },
];

export const PANEL_FIELDS: Record<PanelKey, RegField[]> = {
  buyer: [
    { name: 'entity_type', icon: 'ri-user-settings-line', kind: 'select', required: true, half: true, options: ['individual', 'company'] },
    { name: 'company', icon: 'ri-building-4-line', kind: 'text', half: true },
    { name: 'industry', icon: 'ri-price-tag-3-line', kind: 'select', required: true, half: true, options: ['food', 'perfume', 'fashion', 'home', 'beauty', 'handicraft', 'packaging', 'other'] },
    { name: 'monthly_volume', icon: 'ri-shopping-cart-2-line', kind: 'select', required: true, half: true, options: ['v_under_10k', 'v_10_50k', 'v_50_200k', 'v_over_200k'] },
    { name: 'categories', icon: 'ri-list-check-2', kind: 'text', half: true },
    { name: 'cr_number', icon: 'ri-file-text-line', kind: 'text', ltr: true, half: true, placeholder: '1010xxxxxx' },
    { name: 'vat_number', icon: 'ri-receipt-line', kind: 'text', ltr: true, half: true, placeholder: '300xxxxxxxxxxx' },
    { name: 'national_id', icon: 'ri-id-card-line', kind: 'text', required: true, ltr: true, half: true, placeholder: '1xxxxxxxxx' },
    { name: 'job_title', icon: 'ri-briefcase-4-line', kind: 'text', half: true },
  ],
  ambassador: [
    { name: 'national_id', icon: 'ri-id-card-line', kind: 'text', required: true, ltr: true, half: true, placeholder: '1xxxxxxxxx' },
    { name: 'promo_channel', icon: 'ri-share-forward-2-line', kind: 'select', required: true, half: true, options: ['social', 'whatsapp', 'marketplaces', 'offline', 'network'] },
    { name: 'audience_size', icon: 'ri-group-2-line', kind: 'select', required: true, half: true, options: ['a_under_1k', 'a_1_10k', 'a_10_50k', 'a_over_50k'] },
    { name: 'experience', icon: 'ri-time-line', kind: 'select', required: true, half: true, options: ['x_new', 'x_1_3', 'x_3_5', 'x_over_5'] },
    { name: 'categories', icon: 'ri-list-check-2', kind: 'text', half: true },
    { name: 'payout_method', icon: 'ri-bank-card-line', kind: 'select', required: true, half: true, options: ['bank', 'wallet', 'credit'] },
    { name: 'iban', icon: 'ri-bank-line', kind: 'text', ltr: true, half: true, placeholder: 'SA00 0000 0000 0000' },
    { name: 'company', icon: 'ri-store-2-line', kind: 'text', half: true },
  ],
  factory: [
    { name: 'company', icon: 'ri-building-4-line', kind: 'text', required: true, half: true },
    { name: 'cr_number', icon: 'ri-file-text-line', kind: 'text', required: true, ltr: true, half: true, placeholder: '1010xxxxxx' },
    { name: 'vat_number', icon: 'ri-receipt-line', kind: 'text', ltr: true, half: true, placeholder: '300xxxxxxxxxxx' },
    { name: 'industry', icon: 'ri-price-tag-3-line', kind: 'select', required: true, half: true, options: ['food', 'perfume', 'fashion', 'home', 'beauty', 'handicraft', 'packaging', 'other'] },
    { name: 'employees', icon: 'ri-team-line', kind: 'select', required: true, half: true, options: ['e_under_10', 'e_10_50', 'e_50_200', 'e_over_200'] },
    { name: 'factory_area', icon: 'ri-building-2-line', kind: 'text', half: true, placeholder: '12,000 م²' },
    { name: 'annual_capacity', icon: 'ri-bar-chart-box-line', kind: 'text', half: true },
    { name: 'categories', icon: 'ri-list-check-2', kind: 'text', required: true, half: true },
    { name: 'website', icon: 'ri-link', kind: 'url', ltr: true, half: true, placeholder: 'https://' },
    { name: 'national_id', icon: 'ri-id-card-line', kind: 'text', required: true, ltr: true, half: true, placeholder: '1xxxxxxxxx' },
    { name: 'job_title', icon: 'ri-briefcase-4-line', kind: 'text', half: true },
  ],
  admin: [
    { name: 'job_title', icon: 'ri-briefcase-4-line', kind: 'text', required: true, half: true },
    { name: 'national_id', icon: 'ri-id-card-line', kind: 'text', required: true, ltr: true, half: true, placeholder: '1xxxxxxxxx' },
    { name: 'company', icon: 'ri-building-4-line', kind: 'text', half: true },
  ],
};

export function fieldsFor(panel: PanelKey): RegField[] {
  return PANEL_FIELDS[panel] ?? [];
}

/* Saudi verification is only meaningful for entities inside the Kingdom. */
export function isSaudi(country: string): boolean {
  return country === 'sa';
}