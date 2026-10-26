import { useState, type FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Card, PageHead, Pill, Toast } from '@/pages/dashboard/components/ui';
import { useRows } from './useLive';

/* WhatsApp templates: which notification kind goes out through which
   Meta-approved template, and in what order its variables are filled.
   A template stays off until Meta approves it; notify-dispatch then sends it
   only to numbers that opted in (account settings or checkout). */

interface Template { kind: string; template_name: string; lang: string; params: string[]; active: boolean; sample: string | null }

function useW() {
  const { t } = useTranslation();
  return (key: string, opts?: Record<string, unknown>) => t(`platform.wa.${key}`, opts);
}

function AdminWhatsApp() {
  const W = useW();
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 3200); };
  const { rows, error, reload } = useRows<Template>(() => supabase.from('whatsapp_templates').select('*').order('kind'));
  const [edit, setEdit] = useState<Record<string, Partial<Template>>>({});
  const [draft, setDraft] = useState({ kind: '', template_name: '', params: 'title,body' });

  const save = async (t: Template, patch: Partial<Template>) => {
    const { error: e } = await supabase.from('whatsapp_templates').update({ ...patch, updated_at: new Date().toISOString() }).eq('kind', t.kind);
    flash(e ? e.message : W('saved'));
    if (!e) { setEdit({ ...edit, [t.kind]: {} }); reload(); }
  };
  const add = async () => {
    const { error: e } = await supabase.from('whatsapp_templates').insert({
      kind: draft.kind.trim(), template_name: draft.template_name.trim(),
      params: draft.params.split(',').map((x) => x.trim()).filter(Boolean),
    });
    flash(e ? e.message : W('added'));
    if (!e) { setDraft({ kind: '', template_name: '', params: 'title,body' }); reload(); }
  };

  return (
    <>
      <PageHead eyebrow={W('eyebrow')} title={W('title')} sub={W('sub')} />
      <div className="note mb"><i className="ri-information-line" /><span>{W('howNote')}</span></div>
      {error && <div className="note mb"><i className="ri-error-warning-line" /><span>{error}</span></div>}
      <Card>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>{W('kind')}</th><th>{W('template')}</th><th>{W('params')}</th><th>{W('sample')}</th><th>{W('status')}</th></tr></thead>
            <tbody>
              {rows.map((t) => {
                const e = edit[t.kind] ?? {};
                const dirty = e.template_name !== undefined || e.params !== undefined;
                return (
                  <tr key={t.kind}>
                    <td className="strong">{W(`k_${t.kind.replace('.', '_')}`, { defaultValue: t.kind })}<div className="s small muted" dir="ltr">{t.kind}</div></td>
                    <td className="field" style={{ marginBottom: 0 }}>
                      <input aria-label={W('template')} dir="ltr" value={e.template_name ?? t.template_name} onChange={(ev) => setEdit({ ...edit, [t.kind]: { ...e, template_name: ev.target.value } })} />
                    </td>
                    <td className="field" style={{ marginBottom: 0 }}>
                      <input aria-label={W('params')} dir="ltr" value={(e.params ?? t.params).join(',')}
                        onChange={(ev) => setEdit({ ...edit, [t.kind]: { ...e, params: ev.target.value.split(',').map((x) => x.trim()) } })} />
                      {dirty && <button type="button" className="btn ghost sm" style={{ marginTop: 6 }} onClick={() => save(t, e)}>{W('save')}</button>}
                    </td>
                    <td className="small" style={{ maxWidth: 280, whiteSpace: 'pre-line' }}>{t.sample ?? '—'}</td>
                    <td>
                      <label className="switch">
                        <input type="checkbox" checked={t.active} onChange={(ev) => save(t, { active: ev.target.checked })} />
                        <span className="track" />
                        <span className="small">{t.active ? <Pill tone="ok">{W('on')}</Pill> : <Pill tone="mute">{W('off')}</Pill>}</span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="grid c4" style={{ alignItems: 'end', marginTop: 12 }}>
          <div className="field"><label htmlFor="wa-k">{W('kind')}</label><input id="wa-k" dir="ltr" placeholder="order.paid" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })} /></div>
          <div className="field"><label htmlFor="wa-t">{W('template')}</label><input id="wa-t" dir="ltr" placeholder="safeer_update" value={draft.template_name} onChange={(e) => setDraft({ ...draft, template_name: e.target.value })} /></div>
          <div className="field"><label htmlFor="wa-p">{W('params')}</label><input id="wa-p" dir="ltr" value={draft.params} onChange={(e) => setDraft({ ...draft, params: e.target.value })} /></div>
          <div className="field"><button type="button" className="btn primary" disabled={!draft.kind || !draft.template_name} onClick={add}><i className="ri-add-line" /> {W('add')}</button></div>
        </div>
        <div className="note" style={{ marginTop: 12 }}><i className="ri-braces-line" /><span>{W('paramsNote')}</span></div>
      </Card>
      <Toast message={toast} />
    </>
  );
}

export const liveMessagingViews: Record<string, Record<string, FunctionComponent>> = {
  admin: { 'admin-whatsapp': AdminWhatsApp },
};
