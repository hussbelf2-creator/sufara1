export type PanelKey = 'buyer' | 'ambassador' | 'factory' | 'admin';

export type PanelDef = {
  key: PanelKey;
  icon: string;
  mark: string;
  needsCompany: boolean;
  demoName: string;
  demoSub: string;
};

export const PANEL_ORDER: PanelKey[] = ['buyer', 'ambassador', 'factory', 'admin'];

export const PANELS: Record<PanelKey, PanelDef> = {
  buyer: {
    key: 'buyer',
    icon: 'ri-shopping-bag-3-line',
    mark: 'ri-store-2-line',
    needsCompany: false,
    demoName: 'سارة العتيبي',
    demoSub: 'الرياض · مستوى ذهبي',
  },
  ambassador: {
    key: 'ambassador',
    icon: 'ri-share-forward-2-line',
    mark: 'ri-qr-code-line',
    needsCompany: false,
    demoName: 'فهد الحربي',
    demoSub: 'جدة · سفير معتمد',
  },
  factory: {
    key: 'factory',
    icon: 'ri-store-3-line',
    mark: 'ri-building-4-line',
    needsCompany: true,
    demoName: 'مصنع النخبة',
    demoSub: 'الدمام · مالك المصنع',
  },
  admin: {
    key: 'admin',
    icon: 'ri-shield-user-line',
    mark: 'ri-lock-2-line',
    needsCompany: false,
    demoName: 'إدارة المنصة',
    demoSub: 'الرياض · مشرف عام',
  },
};

export function resolvePanel(value?: string | null): PanelDef {
  const key = (value ?? 'buyer') as PanelKey;
  return PANELS[key] ?? PANELS.buyer;
}

export function panelLabelKey(key: PanelKey) {
  return `dashboard.group.${key}`;
}