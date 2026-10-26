import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, backendReady } from '@/lib/supabase';
import { Card, Pill } from '@/pages/dashboard/components/ui';
import { promoCodes as seedCodes } from '@/mocks/shop';

/* Platform-funded promo codes (table promo_codes, admin-only RLS).
   Every value is clamped to the active cap before it is saved, and the
   server clamps again when an order is priced — the cap cannot be bypassed
   by a code, whatever value it was created with. */

interface Row {
  code: string;
  kind: 'percent' | 'fixed';
  value: number;
  min_subtotal: number;
  ends_at: string | null;
  max_uses: number | null;
  used: number;
  active: boolean;
}

const seedRows = (): Row[] => (seedCodes as { code: string; kind: string; value: number; minSubtotal: number }[])
  .filter((c) => c.kind === 'percent' || c.kind === 'fixed')
  .map((c) => ({
    code: c.code, kind: c.kind as Row['kind'], value: c.value, min_subtotal: c.minSubtotal,
    ends_at: null, max_uses: null, used: 0, active: true,
  }));

export default function PromoCodesCard({ capRate, demo, onToast }: { capRate: number; demo: boolean; onToast: (m: string) => void }) {
  const { t } = useTranslation();
  const L = (key: string, opts?: Record<string, unknown>) => t(`platform.promoCodes.${key}`, opts);
  const live = backendReady && !demo;
  const [rows, setRows] = useState<Row[]>(seedRows);
  const [draft, setDraft] = useState({ code: '', kind: 'percent' as Row['kind'], value: 4, min: 0, ends: '', maxUses: '' });

  const load = useCallback(async () => {
    if (!live) return;
    const { data, error } = await supabase.from('promo_codes').select('*').order('code');
    if (!error && data) setRows(data as Row[]);
  }, [live]);

  useEffect(() => { load(); }, [load]);

  const capPct = capRate * 100;

  const add = async () => {
    const code = draft.code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (code.length < 4) {
      onToast(L('codeTooShort'));
      return;
    }
    if (rows.some((r) => r.code === code)) {
      onToast(L('codeExists'));
      return;
    }
    const value = draft.kind === 'percent' ? Math.min(Math.max(0, draft.value), capPct) : Math.max(0, draft.value);
    const row: Row = {
      code, kind: draft.kind, value, min_subtotal: Math.max(0, draft.min),
      ends_at: draft.ends ? new Date(`${draft.ends}T23:59:59Z`).toISOString() : null,
      max_uses: draft.maxUses ? Math.max(1, Number(draft.maxUses)) : null, used: 0, active: true,
    };
    if (live) {
      const { error } = await supabase.from('promo_codes').insert(row);
      if (error) {
        onToast(error.message);
        return;
      }
      await load();
    } else {
      setRows((list) => [...list, row]);
    }
    setDraft({ code: '', kind: 'percent', value: 4, min: 0, ends: '', maxUses: '' });
    onToast(draft.kind === 'percent' && draft.value > capPct ? L('clamped', { cap: capPct }) : L('added', { code }));
  };

  const toggle = async (row: Row) => {
    if (live) {
      const { error } = await supabase.from('promo_codes').update({ active: !row.active }).eq('code', row.code);
      if (error) {
        onToast(error.message);
        return;
      }
    }
    setRows((list) => list.map((r) => (r.code === row.code ? { ...r, active: !r.active } : r)));
  };

  return (
    <Card className="mb" title={L('title')} sub={L('sub', { cap: capPct })}>
      <div className="grid c4" style={{ alignItems: 'end' }}>
        <div className="field">
          <label htmlFor="pc-code">{L('code')}</label>
          <input id="pc-code" dir="ltr" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="RAMADAN4" />
        </div>
        <div className="field">
          <label htmlFor="pc-kind">{L('kind')}</label>
          <select id="pc-kind" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as Row['kind'] })}>
            <option value="percent">{L('percent')}</option>
            <option value="fixed">{L('fixed')}</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="pc-value">{draft.kind === 'percent' ? L('valuePct') : L('valueSar')}</label>
          <input id="pc-value" type="number" dir="ltr" value={draft.value} onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) })} />
        </div>
        <div className="field">
          <label htmlFor="pc-min">{L('min')}</label>
          <input id="pc-min" type="number" dir="ltr" value={draft.min} onChange={(e) => setDraft({ ...draft, min: Number(e.target.value) })} />
        </div>
        <div className="field">
          <label htmlFor="pc-ends">{L('ends')}</label>
          <input id="pc-ends" type="date" dir="ltr" value={draft.ends} onChange={(e) => setDraft({ ...draft, ends: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="pc-max">{L('maxUses')}</label>
          <input id="pc-max" type="number" dir="ltr" value={draft.maxUses} onChange={(e) => setDraft({ ...draft, maxUses: e.target.value })} />
        </div>
        <div className="field">
          <button type="button" className="btn primary" onClick={add}><i className="ri-add-line" /> {L('add')}</button>
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>{L('code')}</th><th>{L('kind')}</th><th>{L('effective')}</th><th>{L('min')}</th><th>{L('usage')}</th><th>{L('ends')}</th><th /></tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const effective = r.kind === 'percent' ? `${Math.min(r.value, capPct)}%` : `${r.value} ${L('sar')}`;
              return (
                <tr key={r.code}>
                  <td className="strong" dir="ltr">{r.code}</td>
                  <td>{r.kind === 'percent' ? L('percent') : L('fixed')}</td>
                  <td>
                    {effective}
                    {r.kind === 'percent' && r.value > capPct && <div className="s small muted">{L('cappedFrom', { value: r.value })}</div>}
                    {r.kind === 'fixed' && <div className="s small muted">{L('fixedCap', { cap: capPct })}</div>}
                  </td>
                  <td>{r.min_subtotal}</td>
                  <td>{r.used}{r.max_uses ? ` / ${r.max_uses}` : ''}</td>
                  <td className="small">{r.ends_at ? r.ends_at.slice(0, 10) : '—'}</td>
                  <td>
                    <button type="button" className="btn ghost sm" onClick={() => toggle(r)}>
                      <Pill tone={r.active ? 'ok' : 'mute'}>{r.active ? L('active') : L('inactive')}</Pill>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
