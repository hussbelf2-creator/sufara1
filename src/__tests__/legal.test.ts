import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LEGAL_DOCS, REQUIRED_FOR, legalValues } from '@/config/legal';
import { DEFAULT_CONFIG } from '@/config/platform';
import ar from '@/i18n/local/ar/legal';
import en from '@/i18n/local/en/legal';

/* The database decides who must accept which version; the site shows them.
   Both must name the same versions, and the texts must not hard-code figures
   that live in the commercial settings. */

const migrations = readdirSync('supabase/migrations').sort().map((f) => readFileSync(`supabase/migrations/${f}`, 'utf8')).join('\n');

describe('legal documents', () => {
  it('every document version exists in the migrations', () => {
    Object.entries(LEGAL_DOCS).forEach(([key, d]) => {
      expect(migrations).toContain(`('${key}', '${d.version}', '${d.effective}'`);
    });
  });

  it('agreements are required for their panels', () => {
    expect(REQUIRED_FOR.ambassador).toContain('ambassador');
    expect(REQUIRED_FOR.factory).toContain('factory');
    expect(REQUIRED_FOR.buyer).toEqual(['terms', 'privacy']);
  });

  it('agreements quote the live settings', () => {
    const v = legalValues(DEFAULT_CONFIG);
    expect(v.retailTake).toBe('18%');
    expect(v.tierElite).toBe('8%');
    expect(v.wholesaleAmb).toBe('2%');
    expect(v.returnsDomestic).toBe(7);
  });

  it('every placeholder in the texts has a value', () => {
    const keys = new Set(Object.keys(legalValues(DEFAULT_CONFIG)));
    for (const doc of [ar, en]) {
      const text = JSON.stringify(doc);
      const used = [...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).filter((k) => k !== 'count');
      used.forEach((k) => expect(keys.has(k), `missing value for {{${k}}}`).toBe(true));
    }
  });

  it('both languages carry the same sections', () => {
    (['terms', 'privacy', 'returns', 'ambassador', 'factory'] as const).forEach((d) => {
      const ids = (x: { legal: Record<string, unknown> }) => ((x.legal[d] as { sections: { id: string }[] }).sections).map((s) => s.id);
      expect(ids(en)).toEqual(ids(ar));
    });
  });

  it('no stale fixed return window in the returns policy', () => {
    expect(JSON.stringify(ar.legal.returns)).not.toContain('١٤ يومًا من تاريخ الاستلام');
    expect(JSON.stringify(en.legal.returns)).not.toContain('within 14 days of the delivery');
  });
});
