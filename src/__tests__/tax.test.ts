import { describe, expect, it } from 'vitest';
import { formatInvoiceNo, isIssuedInvoiceNo, proformaRef, taxForCountry } from '@/pages/shop/lib/tax';

describe('VAT', () => {
  it('zero-rates exports and charges 15% domestically', () => {
    expect(taxForCountry('eg', 1000)).toMatchObject({ rate: 0, amount: 0, exempt: true, reason: 'export' });
    expect(taxForCountry('SA', 1000)).toMatchObject({ rate: 0.15, amount: 150, exempt: false });
  });
});

describe('invoice numbers', () => {
  it('never lets the browser produce a tax invoice number', () => {
    const ref = proformaRef(new Date('2026-10-22'));
    expect(ref).toMatch(/^PRO-202610-[0-9A-F]{8}$/);
    expect(isIssuedInvoiceNo(ref)).toBe(false);
  });
  it('recognises a server-issued sequential number', () => {
    expect(formatInvoiceNo(2026, 42)).toBe('INV-2026-0000042');
    expect(isIssuedInvoiceNo('INV-2026-0000042')).toBe(true);
  });
});
