import { useState } from 'react';
import type { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAmbassadorPages } from '@/hooks/useAmbassadorPages';
import { formatClicks, getVisits, getDailyVisits, dayLabels } from '@/pages/ambassador-factory/lib/pageStats';
import { Card, Pill, PageHead, Stat, MiniTrend, Toast } from '@/pages/dashboard/components/ui';

/* Platform governance over ambassador marketing pages: the full registry, the
   attribution ledger (code beats link) and factory–ambassador disputes. */
function AdminAmbPages() {
  const { t, i18n } = useTranslation();
  const p = useAmbassadorPages();
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2200); };

  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const pages = p.adminAmbPages;
  const disputes = p.adminAmbDisputes;
  const published = pages.filter((x) => x.tone === 'ok').length;
  const review = pages.filter((x) => x.tone === 'warn').length;
  const suspended = pages.filter((x) => x.tone === 'danger').length;
  const openDisputes = disputes.filter((x) => x.tone !== 'ok').length;

  /* Real clicks = seeded base count + every visit recorded for the page here. */
  const liveClicks = (row: { ambSlug?: string; factoryId?: string; baseClicks?: number }) => (
    (row.baseClicks ?? 0) + (row.ambSlug ? getVisits(row.ambSlug, row.factoryId ?? '') : 0)
  );
  const totalClicks = pages.reduce((sum, row) => sum + liveClicks(row), 0);

  const slugOf = (name: string) => p.ambRegistry.find((a) => a.name === name)?.slug ?? '';

  /* Pages sorted by real clicks, toggled asc/desc by governance. */
  const sortedPages = [...pages].sort((a, b) => {
    const diff = liveClicks(a) - liveClicks(b);
    return sortDir === 'asc' ? diff : -diff;
  });

  /* Highest-performing page across the whole platform by real clicks. */
  const bestPage = [...pages].sort((a, b) => liveClicks(b) - liveClicks(a))[0];
  const bestTrendLabels = dayLabels(i18n.language, 7);
  const bestTrendValues = bestPage?.ambSlug ? getDailyVisits(bestPage.ambSlug, bestPage.factoryId ?? '', 7) : [];
  const bestTrendTotal = bestTrendValues.reduce((sum, n) => sum + n, 0);

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.adminAmbPages.eyebrow')}
        title={t('dashboard.adminAmbPages.title')}
        sub={t('dashboard.adminAmbPages.sub')}
        actions={<button type="button" className="btn ghost" onClick={() => flash(t('dashboard.adminAmbPages.suspendedToast'))}><i className="ri-download-2-line" /> {t('dashboard.adminLabels.common.exportExcel')}</button>}
      />

      <div className="grid c4 mb">
        <Stat icon="ri-window-2-line" num={String(published)} lbl={t('dashboard.adminAmbPages.statPages')} />
        <Stat icon="ri-time-line" num={String(review)} lbl={t('dashboard.adminAmbPages.statReview')} />
        <Stat icon="ri-close-circle-line" num={String(suspended)} lbl={t('dashboard.adminAmbPages.statSuspended')} />
        <Stat icon="ri-alert-line" num={String(openDisputes)} lbl={t('dashboard.adminAmbPages.statDisputes')} />
      </div>

      {bestPage && (
        <Card title={t('dashboard.adminAmbPages.bestTitle')} sub={t('dashboard.adminAmbPages.bestSub')} className="mb">
          <div className="row-between wrap" style={{ gap: 16 }}>
            <div className="tbl-name">
              <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--accent2) 16%, var(--panel))', color: 'var(--accent2-strong)', fontSize: 20 }}>
                <i className="ri-trophy-line" />
              </div>
              <div>
                <div className="t">{bestPage.ambassador}</div>
                <div className="s">{bestPage.factory} · {bestPage.code}</div>
              </div>
            </div>
            <Pill tone="ok"><i className="ri-cursor-line" /> {t('dashboard.adminAmbPages.bestBadge')}</Pill>
          </div>
          <div className="grid c3" style={{ marginTop: 16 }}>
            <div className="stat"><div className="num accent">{formatClicks(liveClicks(bestPage), i18n.language)}</div><div className="lbl">{t('dashboard.adminAmbPages.thClicks')}</div></div>
            <div className="stat"><div className="num">{bestPage.orders}</div><div className="lbl">{t('dashboard.adminAmbPages.thOrders')}</div></div>
            <div className="stat"><div className="num">{bestPage.sales}</div><div className="lbl">{t('dashboard.adminAmbPages.thSales')}</div></div>
          </div>
          <div style={{ marginTop: 18 }}>
            <MiniTrend
              title={t('dashboard.adminAmbPages.bestTrend')}
              values={bestTrendValues}
              labels={bestTrendLabels}
              total={formatClicks(bestTrendTotal, i18n.language)}
              tone="gold"
              format={(n) => formatClicks(n, i18n.language)}
            />
          </div>
          <div className="note" style={{ marginTop: 14 }}><i className="ri-cursor-line" /><span>{t('dashboard.adminAmbPages.bestNote')}</span></div>
        </Card>
      )}

      <Card title={t('dashboard.adminAmbPages.registryTitle')} sub={`${t('dashboard.adminAmbPages.registrySub', { count: pages.length })} · ${formatClicks(totalClicks, i18n.language)} ${t('dashboard.adminAmbPages.thClicks')}`} className="mb">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('dashboard.adminAmbPages.thPage')}</th>
                <th>{t('dashboard.adminAmbPages.thAmbassador')}</th>
                <th>{t('dashboard.adminAmbPages.thFactory')}</th>
                <th>{t('dashboard.adminAmbPages.thCode')}</th>
                <th>{t('dashboard.adminAmbPages.thCommission')}</th>
                <th>
                  <button type="button" className={`th-sort ${sortDir}`} onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))} aria-label={t('dashboard.adminAmbPages.sortBy')}>
                    {t('dashboard.adminAmbPages.thClicks')}
                    <i className={sortDir === 'asc' ? 'ri-sort-asc' : 'ri-sort-desc'} />
                  </button>
                </th>
                <th>{t('dashboard.adminAmbPages.thOrders')}</th>
                <th>{t('dashboard.adminAmbPages.thSales')}</th>
                <th>{t('dashboard.adminAmbPages.thCommissionValue')}</th>
                <th>{t('dashboard.adminAmbPages.thStatus')}</th>
                <th>{t('dashboard.adminAmbPages.thActions')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedPages.map((row) => (
                <tr key={row.id}>
                  <td className="muted small">{row.id}</td>
                  <td className="strong">{row.ambassador}<div className="s muted small">{row.country}</div></td>
                  <td>{row.factory}</td>
                  <td className="muted small">{row.code}</td>
                  <td className="strong accent">{row.commission}</td>
                  <td>{formatClicks(liveClicks(row), i18n.language)}</td>
                  <td>{row.orders}</td>
                  <td>{row.sales}</td>
                  <td className="strong accent">{row.commissionValue}</td>
                  <td><Pill tone={row.tone}>{row.status}</Pill></td>
                  <td>
                    <div className="row-between wrap" style={{ gap: 6 }}>
                      {slugOf(row.ambassador) && (
                        <Link className="btn sm ghost" to={`/f/${slugOf(row.ambassador)}/${factoryId(row.factory)}`} aria-label={t('dashboard.adminAmbPages.view')}><i className="ri-external-link-line" /></Link>
                      )}
                      <button type="button" className="btn sm ghost" aria-label={t('dashboard.adminAmbPages.arbitrate')} onClick={() => flash(t('dashboard.adminAmbPages.resolvedToast'))}><i className="ri-scales-3-line" /></button>
                      <button type="button" className="btn sm ghost" aria-label={t('dashboard.adminAmbPages.suspend')} onClick={() => flash(t('dashboard.adminAmbPages.suspendedToast'))}><i className="ri-lock-line" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="note" style={{ marginTop: 14 }}><i className="ri-cursor-line" /><span>{t('dashboard.adminAmbPages.clicksLive')}</span></div>
      </Card>

      <div className="split mb">
        <Card title={t('dashboard.adminAmbPages.disputesTitle')} sub={t('dashboard.adminAmbPages.disputesSub')}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('dashboard.adminAmbPages.thAmbassador')}</th>
                  <th>{t('dashboard.adminAmbPages.thReason')}</th>
                  <th>{t('dashboard.adminAmbPages.thAmount')}</th>
                  <th>{t('dashboard.adminAmbPages.thAge')}</th>
                  <th>{t('dashboard.adminAmbPages.thDecision')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {disputes.map((dv) => (
                  <tr key={dv.id}>
                    <td className="strong">{dv.ambassador}<div className="s muted small">{dv.factory}</div></td>
                    <td className="muted small">{dv.reason}</td>
                    <td className="strong accent">{dv.amount}</td>
                    <td className="muted small">{dv.age}</td>
                    <td><Pill tone={dv.tone}>{dv.status}</Pill></td>
                    <td>
                      <button type="button" className="btn sm primary" disabled={dv.tone === 'ok'} onClick={() => flash(t('dashboard.adminAmbPages.resolvedToast'))}>{t('dashboard.adminAmbPages.resolve')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={t('dashboard.adminAmbPages.ledgerTitle')} sub={t('dashboard.adminAmbPages.ledgerSub')}>
          <div className="list">
            {p.ambPageAttribution.map((a) => (
              <div className="list-row" key={a.id}>
                <div className="ic"><i className={a.source.includes('كود') || a.source.includes('code') ? 'ri-coupon-3-line' : 'ri-link'} /></div>
                <div className="body">
                  <div className="t small">{a.id} · {a.page}</div>
                  <div className="s">{a.source} {a.code !== '—' ? `· ${a.code}` : ''} · {a.country}</div>
                </div>
                <div className="end">
                  <div className="strong accent">{a.commission}</div>
                  <Pill tone={a.tone}>{a.status}</Pill>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Toast message={toast} />
    </>
  );
}

/* Map a factory display name (as stored in the registry rows) to a catalogue
   factory id so the admin can jump to the real public page. */
function factoryId(name: string): string {
  const map: Record<string, string> = {
    'مصنع تمور الأحساء': 'hasa',
    'بيت عود الرياض': 'oud',
    'مزارع قهوة فيفا': 'fifa',
    'معامل ورد الطائف': 'taif',
    'Al-Ahsa Dates Factory': 'hasa',
    'Riyadh Oud House': 'oud',
    'Fifa Coffee Farms': 'fifa',
    'Taif Rose Works': 'taif',
  };
  return map[name] ?? 'hasa';
}

export const adminAmbViews: Record<string, FunctionComponent> = {
  'admin-amb-pages': AdminAmbPages,
};