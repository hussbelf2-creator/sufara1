import { useState } from 'react';
import type { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { useAmbassadorPages } from '@/hooks/useAmbassadorPages';
import { Card, Pill, PageHead, Modal, Stat, Switch, Toast } from '@/pages/dashboard/components/ui';
import { formatClicks, getVisits } from '@/pages/ambassador-factory/lib/pageStats';
import { usePlatformConfig } from '@/config/store';

interface RequestRow {
  id: string;
  ambassador: string;
  initials: string;
  country: string;
  level: string;
  requested: string;
  date: string;
  note: string;
}

interface PublishedRow {
  id: string;
  ambassador: string;
  country: string;
  code: string;
  ambSlug?: string;
  factoryId?: string;
  baseClicks?: number;
  commission: string;
  clicks: string;
  orders: number;
  sales: string;
  owed: string;
  status: string;
  tone: string;
}

/* Factory "ambassador pages": the owner approves/rejects requests from
   ambassadors to publish a page, and tracks each published page. */
function FactoryAmbassadors() {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const p = useAmbassadorPages();
  /* Commission rates are set centrally by the platform (Decision Log §4),
     never per factory — the factory only decides whether ambassadors may
     build pages for it. The figures below are read from PlatformConfig. */
  const platformCfg = usePlatformConfig();
  const tierPct = (n: number) => `${Math.round(n * 1000) / 10}%`;
  const rates = platformCfg.ambassador.retailTiers.map((x) => x.rate);
  const cfg = {
    ...p.factoryAmbConfig,
    defaultCommission: rates.map(tierPct).join(' / '),
    minCommission: tierPct(Math.min(...rates)),
    maxCommission: tierPct(Math.max(...rates)),
  };

  const [requests, setRequests] = useState<RequestRow[]>(() => p.factoryAmbRequests.map((x) => ({ ...x })));
  const [published, setPublished] = useState<PublishedRow[]>(() => p.factoryAmbPages.map((x) => ({ ...x })));
  const [autoApprove, setAutoApprove] = useState(cfg.autoApprove);
  const [active, setActive] = useState<RequestRow | null>(null);
  const [commission, setCommission] = useState('');
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2200); };

  const openRequest = (r: RequestRow) => { setActive(r); setCommission(r.requested); };

  /* Live clicks = seeded base + every visit recorded for the page in this browser. */
  const liveClicks = (row: PublishedRow) => {
    const real = row.ambSlug && row.factoryId ? getVisits(row.ambSlug, row.factoryId) : 0;
    return (row.baseClicks ?? 0) + real;
  };

  const approve = () => {
    if (!active) return;
    const slug = p.ambRegistry.find((a) => a.name === active.ambassador)?.slug;
    setPublished((prev) => [
      {
        id: `PG-${active.id.split('-')[1]}`,
        ambassador: active.ambassador,
        country: active.country,
        code: `${cfg.codePrefix}-${active.id.split('-')[1]}`,
        ambSlug: slug,
        factoryId: cfg.factoryId,
        baseClicks: 0,
        commission,
        clicks: '—',
        orders: 0,
        sales: '—',
        owed: '—',
        status: t('dashboard.factory.ambassadors.statusActive'),
        tone: 'ok',
      },
      ...prev,
    ]);
    setRequests((prev) => prev.filter((x) => x.id !== active.id));
    setActive(null);
    flash(t('dashboard.factory.ambassadors.approveToast'));
  };

  const reject = (id: string) => {
    setRequests((prev) => prev.filter((x) => x.id !== id));
    flash(t('dashboard.factory.ambassadors.rejectToast'));
  };

  const toggle = (id: string, on: boolean) => {
    setPublished((prev) => prev.map((x) => (x.id === id
      ? { ...x, status: on ? t('dashboard.factory.ambassadors.statusActive') : t('dashboard.factory.ambassadors.statusPaused'), tone: on ? 'ok' : 'danger' }
      : x)));
    flash(t('dashboard.factory.ambassadors.pausedToast'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.ambassadors.title')}
        sub={t('dashboard.factory.ambassadors.sub')}
        actions={<button type="button" className="btn ghost" onClick={() => flash(t('dashboard.factory.ambassadors.savedToast'))}><i className="ri-save-3-line" /> {t('dashboard.factory.ambassadors.save')}</button>}
      />

      <div className="grid c4 mb">
        <Stat icon="ri-window-2-line" num={String(published.length)} lbl={t('dashboard.factory.ambassadors.publishedTitle')} />
        <Stat icon="ri-time-line" num={String(requests.length)} lbl={t('dashboard.factory.ambassadors.requestsTitle')} />
        <Stat icon="ri-percent-line" num={cfg.defaultCommission} lbl={t('dashboard.factory.ambassadors.defaultCommission')} />
        <Stat icon="ri-calendar-check-line" num={cfg.windowDays} lbl={t('dashboard.factory.ambassadors.windowLabel')} />
      </div>

      <div className="split mb">
        <Card title={t('dashboard.factory.ambassadors.requestsTitle')} sub={t('dashboard.factory.ambassadors.requestsSub', { count: requests.length })}>
          {requests.length > 0 ? (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{t('dashboard.factory.ambassadors.thAmbassador')}</th>
                    <th>{t('dashboard.factory.ambassadors.thRequested')}</th>
                    <th>{t('dashboard.factory.ambassadors.thDate')}</th>
                    <th>{t('dashboard.factory.ambassadors.thActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td className="strong">
                        {r.ambassador}
                        <div className="s muted small">{r.country} · {r.level}</div>
                      </td>
                      <td className="strong accent">{r.requested}</td>
                      <td className="muted small">{r.date}</td>
                      <td>
                        <div className="row-between wrap" style={{ gap: 6 }}>
                          <button type="button" className="btn sm primary" onClick={() => openRequest(r)}><i className="ri-check-line" /> {t('dashboard.factory.ambassadors.approve')}</button>
                          <button type="button" className="btn sm ghost" onClick={() => reject(r.id)}><i className="ri-close-line" /> {t('dashboard.factory.ambassadors.reject')}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="note"><i className="ri-checkbox-circle-line" /><span>{t('dashboard.factory.ambassadors.approveToast')}</span></div>
          )}
        </Card>

        <Card title={t('dashboard.factory.ambassadors.configTitle')} sub={t('dashboard.factory.ambassadors.configSub')}>
          <div className="list">
            <div className="list-row"><div className="body"><div className="s">{t('dashboard.factory.ambassadors.defaultCommission')}</div><div className="t strong">{cfg.defaultCommission}</div></div></div>
            <div className="list-row"><div className="body"><div className="s">{t('dashboard.factory.ambassadors.minCommission')}</div><div className="t">{cfg.minCommission}</div></div></div>
            <div className="list-row"><div className="body"><div className="s">{t('dashboard.factory.ambassadors.maxCommission')}</div><div className="t">{cfg.maxCommission}</div></div></div>
            <div className="list-row"><div className="body"><div className="s">{t('dashboard.factory.ambassadors.codePrefix')}</div><div className="t">{cfg.codePrefix}</div></div></div>
            <div className="list-row"><div className="body"><div className="s">{t('dashboard.factory.ambassadors.returnLabel')}</div><div className="t">{cfg.returnWindow}</div></div></div>
          </div>
          <div className="divider" />
          <div className="row-between">
            <span className="small">{t('dashboard.factory.ambassadors.autoApprove')}</span>
            <Switch checked={autoApprove} label="" onChange={(v) => { setAutoApprove(v); flash(t('dashboard.factory.ambassadors.savedToast')); }} />
          </div>
        </Card>
      </div>

      <Card title={t('dashboard.factory.ambassadors.publishedTitle')} sub={t('dashboard.factory.ambassadors.publishedSub', { count: published.length })}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('dashboard.factory.ambassadors.thAmbassador')}</th>
                <th>{t('dashboard.factory.ambassadors.thCode')}</th>
                <th>{t('dashboard.factory.ambassadors.thRequested')}</th>
                <th>{t('dashboard.factory.ambassadors.thClicks')}</th>
                <th>{t('dashboard.factory.ambassadors.thOrders')}</th>
                <th>{t('dashboard.factory.ambassadors.thSales')}</th>
                <th>{t('dashboard.factory.ambassadors.thOwed')}</th>
                <th>{t('dashboard.factory.ambassadors.thStatus')}</th>
                <th>{t('dashboard.factory.ambassadors.thActions')}</th>
              </tr>
            </thead>
            <tbody>
              {published.map((row) => (
                <tr key={row.id}>
                  <td className="strong">{row.ambassador}<div className="s muted small">{row.country}</div></td>
                  <td className="muted small">{row.code}</td>
                  <td className="strong accent">{row.commission}</td>
                  <td>{formatClicks(liveClicks(row), i18n.language)}</td>
                  <td>{row.orders}</td>
                  <td>{row.sales}</td>
                  <td className="strong accent">{row.owed}</td>
                  <td><Pill tone={row.tone}>{row.status}</Pill></td>
                  <td>
                    <div className="row-between wrap" style={{ gap: 6 }}>
                      <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.ambassadors.view')} onClick={() => flash(t('dashboard.factory.ambassadors.view'))}><i className="ri-external-link-line" /></button>
                      <Switch checked={row.tone === 'ok'} label="" onChange={(v) => toggle(row.id, v)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="note" style={{ marginTop: 14 }}><i className="ri-cursor-line" /><span>{t('dashboard.factory.ambassadors.clicksLive')}</span></div>
        <div className="note" style={{ marginTop: 14 }}><i className="ri-shield-check-line" /><span>{t('dashboard.factory.ambassadors.note')}</span></div>
      </Card>

      <Modal open={!!active} onClose={() => setActive(null)} title={t('dashboard.factory.ambassadors.requestModalTitle')} sub={t('dashboard.factory.ambassadors.requestModalSub')}>
        {active && (
          <>
            <div className="code-box mb">
              <div>
                <div className="small muted">{active.ambassador} · {active.country}</div>
                <div className="val">{active.level}</div>
              </div>
            </div>
            <p className="small muted" style={{ marginBottom: 14 }}>{active.note}</p>
            <div className="field">
              <label htmlFor="ap-comm">{t('dashboard.factory.ambassadors.commissionLabel')}</label>
              <input id="ap-comm" value={commission} onChange={(e) => setCommission(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn primary" onClick={approve}>{t('dashboard.factory.ambassadors.approveBtn')}</button>
              <button type="button" className="btn ghost" onClick={() => setActive(null)}>{t('dashboard.common.cancel')}</button>
            </div>
          </>
        )}
      </Modal>
      <Toast message={toast} />
    </>
  );
}

export const factoryAmbViews: Record<string, FunctionComponent> = {
  'f-ambassadors': FactoryAmbassadors,
};