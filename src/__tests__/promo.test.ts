import { describe, expect, it } from 'vitest';
import { computeDiscount, findAmbPromo, findPromo, registerAmbPromos, validatePromo } from '@/pages/shop/lib/promo';

describe('promo codes', () => {
  it('accepts a registered ambassador code exactly', () => {
    expect(findAmbPromo('ahmad-tamr4')?.slug).toBe('ahmad-jo-2481');
  });

  it('rejects any code invented from an ambassador prefix', () => {
    expect(findAmbPromo('AHMAD-ANYTHING')).toBeUndefined();
    expect(findPromo('AHMAD-FREE90')).toBeUndefined();
    expect(validatePromo('REEM-XYZ', 1000).ok).toBe(false);
  });

  it('caps a percent code at 4% whatever it claims', () => {
    registerAmbPromos([{ code: 'LEAK-10', slug: 'x', factoryId: 'hasa', discount: 10 }]);
    const promo = findPromo('LEAK-10');
    expect(promo?.value).toBe(4);
    expect(computeDiscount(promo ?? null, 1000)).toBe(40);
  });

  it('caps a fixed code at 4% of the goods value', () => {
    const fixed = { code: 'F', label: '', description: '', kind: 'fixed' as const, value: 500, minSubtotal: 0 };
    expect(computeDiscount(fixed, 1000)).toBe(40);
  });

  it('respects the minimum subtotal', () => {
    expect(validatePromo('UMRAH4', 200).ok).toBe(false);
    expect(validatePromo('UMRAH4', 300).ok).toBe(true);
  });

  it('does not apply to wholesale', () => {
    const r = validatePromo('SAFEER4', 5000, 'wholesale');
    expect(r.ok).toBe(false);
    expect(r.messageKey).toBe('shop.promo.msgChannel');
  });

  it('old over-cap codes are gone', () => {
    expect(findPromo('SIA10')).toBeUndefined();
    expect(findPromo('WELCOME15')).toBeUndefined();
  });
});
