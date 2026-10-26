import { useState } from 'react';
import type { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { useAmbassadorPages } from '@/hooks/useAmbassadorPages';
import { useCatalog } from '@/hooks/useCatalog';
import { Card, Pill, PageHead, Modal, Stat, Toast } from '@/pages/dashboard/components/ui';
import { QrDownloadModal } from '@/pages/dashboard/components/QrCode';
import { formatClicks, getVisitsInRange, type RangeKey } from '@/pages/ambassador-factory/lib/pageStats';

interface PageRow {
  id: string;
  factoryId: string;
  factory: string;
  city: string;
  status: string;
  statusLabel: string;
  tone: string;
  commission: string;
  code: string;
  link: string;
  clicks: string;
  orders: number;
  sales: string;
  earned: string;
  variant: string;
  since: string;
  baseClicks?: number;
}

/* Ambassador "my marketing pages": request a factory page (factory approves),
   then share its unique link + discount code. */
function AmbPages() {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const p = useAmbassadorPages();
  const { factories } = useCatalog();
  const ambSlug = d.ambassadorUser.code.toLowerCase();

  const [list, setList] = useState<PageRow[]>(() => p.ambFactoryPages.map((x) => ({ ...x })));
  const [open, setOpen] = useState(false);
  const [factoryId, setFactoryId] = useState('');
  const [variant, setVariant] = useState('full');
  const [note, setNote] = useState('');
  const [range, setRange] = useState<RangeKey>('all');
  const [qr, setQr] = useState<{ value: string; target: string } | null>(null);
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2200); };

  const taken = new Set(list.filter((x) => x.status !== 'rejected').map((x) => x.factoryId));
  const options = factories.filter((f) => !taken.has(f.id));

  /* Live clicks = seeded base (all-time only) + every visit recorded for the
     page here, filtered by the selected time range. */
  const publishedList = list.filter((x) => x.status === 'published');
  const liveClicks = (row: PageRow) => {
    const real = getVisitsInRange(ambSlug, row.factoryId, range);
    return range === 'all' ? (row.baseClicks ?? 0) + real : real;
  };
  const totalClicks = publishedList
    .reduce((sum, x) => sum + (x.baseClicks ?? 0) + getVisitsInRange(ambSlug, x.factoryId, 'all'), 0);
  const rangedClicks = publishedList
    .reduce((sum, x) => sum + getVisitsInRange(ambSlug, x.factoryId, range), 0);
  const shownClicks = range === 'all' ? totalClicks : rangedClicks;

  const copy = (text: string, msg: string) => {
    navigator.clipboard?.writeText(text).catch(() => undefined);
    flash(msg);
  };

  const submit = () => {
    if (!factoryId) { flash(t('dashboard.ambPages.factoryRequired')); return; }
    const f = factories.find((x) => x.id === factoryId);
    if (!f) return;
    setList((prev) => [
      {
        id: `PG-${Date.now()}`,
        factoryId: f.id,
        factory: f.name,
        city: f.city,
        status: 'pending',
        statusLabel: t('dashboard.ambPages.pendingHint'),
        tone: 'warn',
        commission: '—',
        code: '—',
        link: '—',
        clicks: '—',
        orders: 0,
        sales: '—',
        earned: '—',
        variant,
        since: t('dashboard.common.now'),
        baseClicks: 0,
      },
      ...prev,
    ]);
    setOpen(false);
    setFactoryId('');
    setVariant('full');
    setNote('');
    flash(t('dashboard.ambPages.sentToast'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.ambPages.eyebrow')}
        title={t('dashboard.ambPages.title')}
        sub={t('dashboard.ambPages.sub')}
        actions={<button type="button" className="btn primary" onClick={() => setOpen(true)}><i className="ri-add-line" /> {t('dashboard.ambPages.request')}</button>}
      />

      <div className="row-between wrap" style={{ marginBottom: 12 }}>
        <span className="small muted"><i className="ri-cursor-line" /> {t('dashboard.ambPages.rangeLabel')}</span>
        <div className="seg compact" role="tablist" aria-label={t('dashboard.ambPages.rangeLabel')}>
          <button type="button" className={range === 'today' ? 'is-on' : ''} onClick={() => setRange('today')}>
            <i className="ri-sun-line" /><span>{t('dashboard.ambPages.rangeToday')}</span>
          </button>
          <button type="button" className={range === 'week' ? 'is-on' : ''} onClick={() => setRange('week')}>
            <i className="ri-calendar-2-line" /><span>{t('dashboard.ambPages.rangeWeek')}</span>
          </button>
          <button type="button" className={range === 'all' ? 'is-on' : ''} onClick={() => setRange('all')}>
            <i className="ri-infinity-line" /><span>{t('dashboard.ambPages.rangeAll')}</span>
          </button>
        </div>
      </div>

      <div className="grid c4 mb">
        {p.ambPageStats.map((s) => (
          <Stat key={s.lbl} icon={s.icon} num={s.icon === 'ri-cursor-line' ? formatClicks(shownClicks, i18n.language) : s.num} lbl={s.lbl} />
        ))}
      </div>

      <Card title={t('dashboard.ambPages.stepsTitle')} className="mb">
        <div className="grid c3" style={{ gap: 14 }}>
          {[
            { icon: 'ri-store-3-line', t: t('dashboard.ambPages.step1t'), s: t('dashboard.ambPages.step1s') },
            { icon: 'ri-send-plane-line', t: t('dashboard.ambPages.step2t'), s: t('dashboard.ambPages.step2s') },
            { icon: 'ri-rocket-2-line', t: t('dashboard.ambPages.step3t'), s: t('dashboard.ambPages.step3s') },
          ].map((st) => (
            <div className="card tight" key={st.t}>
              <div className="ic mb"><i className={st.icon} style={{ fontSize: 20 }} /></div>
              <div className="t strong mb" style={{ marginBottom: 4 }}>{st.t}</div>
              <div className="s small muted">{st.s}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t('dashboard.ambPages.activeTitle')} sub={t('dashboard.ambPages.activeSub', { count: list.length })} className="mb">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('dashboard.ambPages.thFactory')}</th>
                <th>{t('dashboard.ambPages.thStatus')}</th>
                <th>{t('dashboard.ambPages.thCommission')}</th>
                <th>{t('dashboard.ambPages.thClicks')}</th>
                <th>{t('dashboard.ambPages.thOrders')}</th>
                <th>{t('dashboard.ambPages.thSales')}</th>
                <th>{t('dashboard.ambPages.thEarned')}</th>
                <th>{t('dashboard.ambPages.thActions')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => {
                const published = row.status === 'published';
                return (
                  <tr key={row.id}>
                    <td className="strong">
                      {row.factory}
                      <div className="s muted small">{row.city} · {row.variant === 'short' ? t('dashboard.ambPages.variantShort') : t('dashboard.ambPages.variantFull')}</div>
                    </td>
                    <td><Pill tone={row.tone}>{row.statusLabel}</Pill></td>
                    <td className="strong accent">{row.commission}</td>
                    <td>{row.status === 'published' ? formatClicks(liveClicks(row), i18n.language) : row.clicks}</td>
                    <td>{row.orders}</td>
                    <td>{row.sales}</td>
                    <td className="strong accent">{row.earned}</td>
                    <td>
                      {published ? (
                        <div className="row-between wrap" style={{ gap: 6 }}>
                          <Link className="btn sm ghost" to={`/f/${ambSlug}/${row.factoryId}`} aria-label={t('dashboard.ambPages.openPage')}><i className="ri-external-link-line" /></Link>
                          <button type="button" className="btn sm ghost" aria-label={t('dashboard.ambPages.copyLink')} onClick={() => copy(`https://${row.link}`, t('dashboard.ambPages.copiedLinkToast'))}><i className="ri-link" /></button>
                          <button type="button" className="btn sm ghost" aria-label={t('dashboard.ambPages.copyCode')} onClick={() => copy(row.code, t('dashboard.ambPages.copiedCodeToast'))}><i className="ri-file-copy-line" /></button>
                          <button type="button" className="btn sm ghost" aria-label="QR" onClick={() => setQr({ value: `https://${row.link}`, target: row.factory })}><i className="ri-qr-code-line" /></button>
                        </div>
                      ) : (
                        <span className="muted small">{row.status === 'rejected' ? t('dashboard.ambPages.rejectedHint') : t('dashboard.ambPages.pendingHint')}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="note" style={{ marginTop: 14 }}><i className="ri-cursor-line" /><span>{t('dashboard.ambPages.clicksLive')}</span></div>
      </Card>

      <Card title={t('dashboard.ambPages.rulesTitle')} sub={t('dashboard.ambPages.rulesSub')}>
        <div className="list">
          {p.ambPageRules.map((r) => (
            <div className="list-row" key={r.t}>
              <div className="ic"><i className={r.icon} /></div>
              <div className="body">
                <div className="t">{r.t}</div>
                <div className="s">{r.s}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="note" style={{ marginTop: 14 }}><i className="ri-shield-check-line" /><span>{t('dashboard.ambPages.note')}</span></div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={t('dashboard.ambPages.modalTitle')} sub={t('dashboard.ambPages.modalSub')}>
        <div className="field">
          <label htmlFor="pg-factory">{t('dashboard.ambPages.factoryLabel')}</label>
          <select id="pg-factory" value={factoryId} onChange={(e) => setFactoryId(e.target.value)}>
            <option value="">{t('dashboard.ambPages.factoryPlaceholder')}</option>
            {options.map((f) => <option key={f.id} value={f.id}>{f.name} — {f.city}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="pg-variant">{t('dashboard.ambPages.variantLabel')}</label>
          <select id="pg-variant" value={variant} onChange={(e) => setVariant(e.target.value)}>
            <option value="full">{t('dashboard.ambPages.variantFull')}</option>
            <option value="short">{t('dashboard.ambPages.variantShort')}</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="pg-note">{t('dashboard.ambPages.noteLabel')}</label>
          <textarea id="pg-note" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('dashboard.ambPages.notePlaceholder')} />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={submit}>{t('dashboard.ambPages.send')}</button>
          <button type="button" className="btn ghost" onClick={() => setOpen(false)}>{t('dashboard.common.cancel')}</button>
        </div>
      </Modal>

      <QrDownloadModal
        open={!!qr}
        onClose={() => setQr(null)}
        value={qr?.value ?? ''}
        target={qr?.target ?? ''}
        onDownload={() => { setQr(null); flash(t('dashboard.qr.downloadToast')); }}
      />
      <Toast message={toast} />
    </>
  );
}

export const ambPageViews: Record<string, FunctionComponent> = {
  'amb-pages': AmbPages,
};