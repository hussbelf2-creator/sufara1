import { useState } from 'react';
import type { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { useAmbassadorPages } from '@/hooks/useAmbassadorPages';
import { downloadCsv } from '@/pages/dashboard/lib/csv';
import { formatClicks, getVisits, getDailyVisits, dayLabels } from '@/pages/ambassador-factory/lib/pageStats';
import {
  Card, Stat, Pill, PageHead, HBars, Toast, MiniTrend,
} from '@/pages/dashboard/components/ui';

/* A grouped column chart: one column group per month, one bar per sales
   channel. Built from plain divs (no chart library) so it re-themes itself
   with the palette. */
function ChannelTrend({
  labels, channels, legend,
}: {
  labels: string[];
  channels: { name: string; tone: string; values: number[] }[];
  legend: string;
}) {
  const max = Math.max(...channels.flatMap((c) => c.values), 1);
  const color = (tone: string) => (
    tone === 'gold' ? 'var(--accent2)' : tone === 'ink' ? 'var(--accent-strong)' : 'var(--accent)'
  );
  return (
    <div>
      <div className="ctrend-plot">
        {labels.map((label, i) => (
          <div className="ctrend-col" key={label}>
            <div className="ctrend-bars">
              {channels.map((c) => (
                <span
                  key={c.name}
                  className="ctrend-bar"
                  style={{ height: `${Math.max(6, (c.values[i] / max) * 100)}%`, background: color(c.tone), animationDelay: `${i * 0.05}s` }}
                  title={`${c.name}: ${c.values[i]}`}
                />
              ))}
            </div>
            <span className="ctrend-x">{label}</span>
          </div>
        ))}
      </div>
      <div className="ctrend-legend">
        {channels.map((c) => (
          <span className="ctrend-key" key={c.name}>
            <i style={{ background: color(c.tone) }} /> {c.name}
          </span>
        ))}
      </div>
      <div className="note" style={{ marginTop: 14 }}><i className="ri-information-line" /><span>{legend}</span></div>
    </div>
  );
}

/* ------------------------------------------------------------- analytics */

function FactoryAnalytics() {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const p = useAmbassadorPages();
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };
  const locale = (i18n.resolvedLanguage || i18n.language || 'ar').match(/^(en|ur|id)/) !== null ? 'en-US' : 'ar-EG';
  const nf = (n: number, digits = 0) => n.toLocaleString(locale, { maximumFractionDigits: digits });
  const currency = t('dashboard.charts.currency');
  const last = (arr: number[]) => arr[arr.length - 1];
  const tr = d.factoryTrend;

  /* Best ambassador page ranked by REAL clicks (seeded base + recorded visits). */
  const pageLiveClicks = (row: { ambSlug?: string; factoryId?: string; baseClicks?: number }) => (
    (row.baseClicks ?? 0) + (row.ambSlug ? getVisits(row.ambSlug, row.factoryId ?? '') : 0)
  );
  const rankedPages = p.factoryAmbPages
    .map((row) => ({ ...row, live: pageLiveClicks(row) }))
    .sort((a, b) => b.live - a.live);
  const bestPage = rankedPages[0];

  /* Real click trend for the best page over the last 7 days. */
  const trendLabels = dayLabels(i18n.language, 7);
  const trendValues = bestPage?.ambSlug ? getDailyVisits(bestPage.ambSlug, bestPage.factoryId ?? '', 7) : [];
  const trendTotal = trendValues.reduce((sum, n) => sum + n, 0);

  const exportReport = () => {
    downloadCsv(
      'factory-analytics.csv',
      [t('dashboard.factory.analytics.thCountryCol'), t('dashboard.factory.analytics.thRevenue'), t('dashboard.factory.analytics.thShare'), t('dashboard.factory.analytics.thGrowth'), t('dashboard.factory.analytics.thOrdersCol')],
      d.factoryCountryGrowth.map((c) => [c.country, c.revenue, c.share, c.growth, c.orders]),
    );
    flash(t('dashboard.common.exportedFile', { file: 'factory-analytics.csv' }));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.analytics.title')}
        sub={t('dashboard.factory.analytics.sub')}
        actions={<button type="button" className="btn ghost" onClick={exportReport}><i className="ri-download-2-line" /> {t('dashboard.factory.analytics.export')}</button>}
      />

      <Card className="mb">
        <div className="grid c3">
          <MiniTrend title={t('dashboard.factory.analytics.salesTitle')} values={tr.sales.values} labels={tr.labels} total={`${nf(last(tr.sales.values))} ${currency}`} delta={tr.sales.delta} tone="gold" format={(n) => `${nf(n)} ${currency}`} />
          <MiniTrend title={t('dashboard.factory.analytics.ordersTitle')} values={tr.orders.values} labels={tr.labels} total={nf(last(tr.orders.values))} delta={tr.orders.delta} tone="accent" format={(n) => nf(n)} />
          <MiniTrend title={t('dashboard.factory.analytics.unitsTitle')} values={tr.units.values} labels={tr.labels} total={nf(last(tr.units.values))} delta={tr.units.delta} tone="ink" format={(n) => nf(n)} />
        </div>
      </Card>

      <div className="split mb">
        <Card title={t('dashboard.factory.analytics.funnelTitle')} sub={t('dashboard.factory.analytics.funnelSub')}>
          <HBars items={d.factoryFunnel} tone="gold" />
        </Card>
        <Card title={t('dashboard.factory.analytics.byChannel')}>
          <HBars items={d.factoryByChannel} tone="gold" />
        </Card>
      </div>

      <Card title={t('dashboard.factory.analytics.channelTrendTitle')} sub={t('dashboard.factory.analytics.channelTrendSub')} className="mb">
        <ChannelTrend labels={d.factoryChannelTrend.labels} channels={d.factoryChannelTrend.channels} legend={t('dashboard.factory.analytics.legendNote')} />
      </Card>

      <div className="split mb">
        <Card title={t('dashboard.factory.analytics.byCountry')}>
          <HBars items={d.factoryTopCountries} tone="gold" />
        </Card>
        <Card title={t('dashboard.factory.analytics.byProduct')}>
          <HBars items={d.factoryByProduct} />
        </Card>
      </div>

      <div className="split mb">
        <Card title={t('dashboard.factory.analytics.countryGrowthTitle')} sub={t('dashboard.factory.analytics.countryGrowthSub')}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('dashboard.factory.analytics.thCountryCol')}</th>
                  <th>{t('dashboard.factory.analytics.thRevenue')}</th>
                  <th>{t('dashboard.factory.analytics.thShare')}</th>
                  <th>{t('dashboard.factory.analytics.thOrdersCol')}</th>
                  <th>{t('dashboard.factory.analytics.thGrowth')}</th>
                </tr>
              </thead>
              <tbody>
                {d.factoryCountryGrowth.map((c) => (
                  <tr key={c.country}>
                    <td className="strong">{c.country}</td>
                    <td className="strong accent">{c.revenue}</td>
                    <td>{c.share}</td>
                    <td>{c.orders}</td>
                    <td><Pill tone={c.up ? 'ok' : 'danger'}>{c.growth}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={t('dashboard.factory.analytics.returnReasons')}>
          <HBars items={d.factoryReturnReasons} />
        </Card>
      </div>

      {bestPage && (
        <Card title={t('dashboard.factory.analytics.bestTitle')} sub={t('dashboard.factory.analytics.bestSub')} className="mb">
          <div className="row-between wrap" style={{ gap: 16 }}>
            <div className="tbl-name">
              <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--accent2) 16%, var(--panel))', color: 'var(--accent2-strong)', fontSize: 20 }}>
                <i className="ri-trophy-line" />
              </div>
              <div>
                <div className="t">{bestPage.ambassador}</div>
                <div className="s">{bestPage.country} · {bestPage.code}</div>
              </div>
            </div>
            <Pill tone="ok"><i className="ri-cursor-line" /> {t('dashboard.factory.analytics.bestBadge')}</Pill>
          </div>
          <div className="grid c3" style={{ marginTop: 16 }}>
            <div className="stat"><div className="num accent">{formatClicks(bestPage.live, i18n.language)}</div><div className="lbl">{t('dashboard.factory.analytics.thClicks')}</div></div>
            <div className="stat"><div className="num">{bestPage.orders}</div><div className="lbl">{t('dashboard.factory.analytics.thOrders')}</div></div>
            <div className="stat"><div className="num">{bestPage.sales}</div><div className="lbl">{t('dashboard.factory.analytics.thSales')}</div></div>
          </div>
          <div style={{ marginTop: 18 }}>
            <MiniTrend
              title={t('dashboard.factory.analytics.clicksTrend')}
              values={trendValues}
              labels={trendLabels}
              total={formatClicks(trendTotal, i18n.language)}
              tone="gold"
              format={(n) => formatClicks(n, i18n.language)}
            />
          </div>
          <div className="note" style={{ marginTop: 14 }}><i className="ri-cursor-line" /><span>{t('dashboard.factory.analytics.liveNote')}</span></div>
        </Card>
      )}

      <Card title={t('dashboard.factory.analytics.ambassadors')}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('dashboard.factory.analytics.thName')}</th>
                <th>{t('dashboard.factory.analytics.thCountry')}</th>
                <th>{t('dashboard.factory.analytics.thOrders')}</th>
                <th>{t('dashboard.factory.analytics.thSales')}</th>
              </tr>
            </thead>
            <tbody>
              {d.factoryTopAmbassadors.map((a) => (
                <tr key={a.name}>
                  <td className="strong">{a.name}</td>
                  <td>{a.country}</td>
                  <td className="strong">{a.orders}</td>
                  <td className="strong accent">{a.sales}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Toast message={toast} />
    </>
  );
}

export const factoryAnalyticsViews: Record<string, FunctionComponent> = {
  'f-analytics': FactoryAnalytics,
};