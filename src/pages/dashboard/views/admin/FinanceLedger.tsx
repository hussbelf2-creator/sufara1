import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import {
  filterByPeriod, monthStamp, periodStart, settleOrder, totalsOf, type LedgerPeriod,
} from '@/pages/dashboard/lib/economics';
import { downloadWorkbook } from '@/pages/dashboard/lib/xlsx';
import { downloadNodeAsPdf } from '@/pages/dashboard/lib/contractPdf';
import { closePeriodOnServer } from '@/pages/dashboard/lib/periodClose';
import { usePlatformConfig } from '@/config/store';
import { worstCaseRetailMargin, worstCaseWholesaleMargin } from '@/config/platform';
import { useAuth } from '@/pages/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useIsLive, useRows } from '@/pages/dashboard/views/live/useLive';
import type { LedgerOrder } from '@/pages/dashboard/lib/economics';
import LedgerArchiveSheet from './LedgerArchiveSheet';
import MonthCompare from './MonthCompare';
import { Card, Pill, Stat, Toast } from '@/pages/dashboard/components/ui';

/* The settlement ledger: the active PlatformConfig applied order by order.
   Every row shows what the platform keeps, the discount it funded, what the ambassador is paid and what is left
   after the gateway fee and the return reserve — so a "successful" order that
   actually loses money can never hide behind a green status pill.

   Month-end closes from this same page: the period switcher slices the book
   (this calendar month, last 30 / 90 days or everything) and the Excel export
   hands finance the exact scoped numbers with a summary tab. */
export default function FinanceLedger() {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const L = d.adminLabels.finance;
  const C = d.adminLabels.common;

  const isEn = (i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().match(/^(en|ur|id)/) !== null;
  const locale = isEn ? 'en-US' : 'ar-EG';
  const currency = t('dashboard.charts.currency');
  const nf = (n: number, digits = 0) => n.toLocaleString(locale, { maximumFractionDigits: digits });
  const pct = (n: number) => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(n);
  const day = (iso?: string) => (iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { day: '2-digit', month: 'short' }) : '—');

  const config = usePlatformConfig();
  const { demoRole } = useAuth();
  const fill = (text: string) => text
    .replace('{{retail}}', pct(config.take.retail.value))
    .replace('{{wholesale}}', pct(config.take.wholesale.value))
    .replace('{{tiers}}', config.ambassador.retailTiers.map((tr) => pct(tr.rate)).join(' / '))
    .replace('{{ambW}}', pct(config.ambassador.wholesale.value))
    .replace('{{months}}', String(config.ambassador.wholesaleRecurringMonths))
    .replace(/\{\{cap\}\}/g, pct(config.promo.capRate))
    .replace('{{leader}}', pct(config.ambassador.leaderBonus))
    .replace('{{worstRetail}}', pct(worstCaseRetailMargin(config)))
    .replace('{{worstWholesale}}', pct(worstCaseWholesaleMargin(config)));
  const [period, setPeriod] = useState<LedgerPeriod>('month');
  const [toast, setToast] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [busyPdf, setBusyPdf] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  /* A real admin session reads paid sub-orders from admin_order_economics;
     the demo keeps the illustrative book. */
  const live = useIsLive();
  const liveRows = useRows<LedgerOrder>(
    () => (live ? supabase.from('admin_order_economics').select('*').limit(5000) : Promise.resolve({ data: [], error: null })),
    [live],
  );
  const book: LedgerOrder[] = useMemo(
    () => (live ? liveRows.rows.map((r) => ({ ...r, gross: Number(r.gross), discount: Number(r.discount ?? 0) })) : d.adminFinanceOrders),
    [live, liveRows.rows, d.adminFinanceOrders],
  );
  const now = useMemo(() => new Date(), []);
  const scoped = useMemo(() => filterByPeriod(book, period, now), [book, period, now]);
  const rows = useMemo(() => scoped.map((o) => settleOrder(o, config)), [scoped, config]);
  const totals = useMemo(() => totalsOf(rows), [rows]);

  const periodOptions: { key: LedgerPeriod; label: string }[] = [
    { key: 'month', label: L.periodMonth },
    { key: 'd30', label: L.period30 },
    { key: 'd90', label: L.period90 },
    { key: 'all', label: L.periodAll },
  ];

  const start = periodStart(period, now);
  const rangeLabel = start === null
    ? L.periodAllRange
    : L.periodRange
      .replace('{{from}}', new Date(start).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }))
      .replace('{{to}}', now.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }));
  const isOpenCycle = period === 'month';

  const exportExcel = () => {
    if (rows.length === 0) {
      setToast(L.exportEmpty);
      return;
    }
    downloadWorkbook(`safeer-settlements-${period}-${monthStamp(now)}.xlsx`, [
      {
        name: L.exportLedger,
        headers: [
          C.order, L.thDate, C.buyer, C.country, L.thChannel, L.thGross, L.thSegment, L.thTakeRate,
          L.thTake, L.thDiscount, L.thAmb, L.thLeader, L.thFee, L.thReserve, L.thNet, L.thMargin, C.status,
        ],
        rows: rows.map((r) => [
          r.id,
          r.date ?? '',
          r.buyer,
          r.country,
          r.channel === 'wholesale' ? L.channelWholesale : L.channelRetail,
          r.gross,
          r.segment === 'repeat' ? L.repeatCustomer : L.newCustomer,
          Number((r.takeRate * 100).toFixed(1)),
          r.take,
          r.discount,
          r.ambassadorCommission,
          r.leaderBonus,
          r.paymentFee,
          r.returnReserve,
          r.net,
          Number((r.margin * 100).toFixed(1)),
          r.status,
        ]),
      },
      {
        name: L.exportSummary,
        headers: [C.name, C.value],
        rows: [
          [L.periodLabel, rangeLabel],
          [L.thGross, totals.gross],
          [L.thTake, totals.take],
          [L.thDiscount, totals.discount],
          [L.thAmb, totals.ambassador],
          [L.thLeader, totals.leader],
          [L.thFee, totals.paymentFee],
          [L.thReserve, totals.reserve],
          [L.thNet, totals.net],
          [L.thMargin, Number((totals.margin * 100).toFixed(1))],
          [L.ordersCount, rows.length],
        ],
      },
    ], !isEn);
    setToast(L.exported);
  };

  const exportPdf = async () => {
    if (rows.length === 0) {
      setToast(L.exportEmpty);
      return;
    }
    setBusyPdf(true);
    /* Only a server-recorded close is proof. In the demo, or offline, the
       sheet is stamped "review only" instead of carrying a fake signature. */
    const from = start === null ? '1970-01-01' : new Date(start).toISOString().slice(0, 10);
    const to = now.toISOString().slice(0, 10);
    const close = demoRole ? null : await closePeriodOnServer({ from, to });
    setFingerprint(close ? close.hash : '');
    if (!close) setToast(L.closeLocalOnly);
    /* Let React paint the off-screen archive sheet before capturing it. */
    await new Promise((resolve) => { window.setTimeout(resolve, 160); });
    const node = sheetRef.current;
    const ok = node
      ? await downloadNodeAsPdf(node, `safeer-settlements-${period}-${monthStamp(now)}.pdf`)
      : false;
    setBusyPdf(false);
    setToast(ok ? L.exportedPdf : L.exportPdfFail);
  };

  const docRef = `SFR-FIN-${monthStamp(now).replace('-', '')}${fingerprint ? `-${fingerprint.slice(0, 4)}` : ''}`;
  const generatedAt = now.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <>
      <MonthCompare orders={book} />

      <div className="grid c4 mb">
        <Stat icon="ri-shopping-bag-3-line" num={`${nf(totals.gross)} ${currency}`} lbl={L.statGmv} />
        <Stat icon="ri-percent-line" num={`${nf(totals.take)} ${currency}`} lbl={L.statTake} />
        <Stat icon="ri-share-forward-2-line" num={`${nf(totals.ambassador)} ${currency}`} lbl={L.statAmb} />
        <Stat icon="ri-wallet-3-line" num={`${nf(totals.net)} ${currency}`} lbl={L.statNet} />
      </div>

      {totals.belowFloor > 0 && (
        <div className="note mb" role="alert" style={{ borderColor: 'var(--danger, #c0392b)' }}>
          <i className="ri-error-warning-line" />
          <span>{L.belowFloorCount.replace('{{count}}', String(totals.belowFloor))}</span>
        </div>
      )}

      <Card className="mb" title={L.ledger} sub={fill(L.ledgerSub)}>
        <div className="row-between wrap" style={{ marginBottom: 12, gap: 10 }}>
          <div className="seg compact" role="tablist" aria-label={L.periodLabel}>
            {periodOptions.map((o) => (
              <button
                key={o.key}
                type="button"
                role="tab"
                aria-selected={period === o.key}
                className={period === o.key ? 'is-on' : ''}
                onClick={() => setPeriod(o.key)}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn ghost sm" onClick={exportExcel}>
              <i className="ri-file-excel-2-line" /> {L.exportExcel}
            </button>
            <button type="button" className="btn primary sm" onClick={exportPdf} disabled={busyPdf}>
              <i className={busyPdf ? 'ri-loader-4-line' : 'ri-file-pdf-2-line'} />
              {busyPdf ? L.pdfGenerating : L.exportPdf}
            </button>
          </div>
        </div>

        <div className="row-between wrap" style={{ marginBottom: 12, gap: 8 }}>
          <span className="small muted">
            <i className="ri-calendar-2-line" /> {rangeLabel} · {L.periodShort.replace('{{count}}', String(rows.length))}
          </span>
          <Pill tone={isOpenCycle ? 'warn' : 'ok'}>{isOpenCycle ? L.closing : L.closed}</Pill>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{C.order}</th>
                <th>{L.thDate}</th>
                <th>{C.buyer}</th>
                <th>{L.thGross}</th>
                <th>{L.thSegment}</th>
                <th>{L.thTakeRate}</th>
                <th>{L.thTake}</th>
                <th>{L.thDiscount}</th>
                <th>{L.thAmb}</th>
                <th>{L.thLeader}</th>
                <th>{L.thFee}</th>
                <th>{L.thReserve}</th>
                <th>{L.thNet}</th>
                <th>{L.thMargin}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="strong">
                    {r.id}
                    <div className="s muted small">{r.status}</div>
                  </td>
                  <td className="muted small">{day(r.date)}</td>
                  <td>
                    {r.buyer}
                    <div className="s muted small">{r.country}</div>
                  </td>
                  <td className="strong">{`${nf(r.gross)} ${currency}`}</td>
                  <td>
                    <Pill tone={r.segment === 'repeat' ? 'mute' : 'info'}>
                      {r.segment === 'repeat' ? L.repeatCustomer : L.newCustomer}
                    </Pill>
                    <div className="s muted small">{r.channel === 'wholesale' ? L.channelWholesale : L.channelRetail}</div>
                  </td>
                  <td>{pct(r.takeRate)}</td>
                  <td className="strong">{nf(r.take)}</td>
                  <td>{r.discount > 0 ? `−${nf(r.discount)}` : <span className="muted small">—</span>}</td>
                  <td>
                    {r.ambassadorCommission > 0 ? (
                      <>
                        <span className="strong accent">{`−${nf(r.ambassadorCommission)}`}</span>
                        <div className="s muted small">{r.ambassador}</div>
                      </>
                    ) : (
                      <span className="muted small">
                        {r.ambassador ? `${L.noAmb} · ${r.ambassador}` : L.noAmb}
                      </span>
                    )}
                  </td>
                  <td>{r.leaderBonus > 0 ? `−${nf(r.leaderBonus)}` : <span className="muted small">—</span>}</td>
                  <td>{`−${nf(r.paymentFee)}`}</td>
                  <td>{`−${nf(r.returnReserve)}`}</td>
                  <td className={`strong ${r.net > 0 ? 'accent' : ''}`} style={r.belowFloor ? { color: 'var(--danger, #c0392b)' } : undefined}>
                    {nf(r.net)}
                    {r.belowFloor && <div className="s small">{L.belowFloor}</div>}
                  </td>
                  <td>{pct(r.margin)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={14} className="muted small">{L.exportEmpty}</td>
                </tr>
              )}
              <tr>
                <td className="strong" colSpan={3}>{L.total}</td>
                <td className="strong">{`${nf(totals.gross)} ${currency}`}</td>
                <td className="muted small">{`${rows.length} ${L.ordersCount}`}</td>
                <td>{pct(totals.gross > 0 ? totals.take / totals.gross : 0)}</td>
                <td className="strong">{nf(totals.take)}</td>
                <td className="strong">{`−${nf(totals.discount)}`}</td>
                <td className="strong">{`−${nf(totals.ambassador)}`}</td>
                <td className="strong">{`−${nf(totals.leader)}`}</td>
                <td>{`−${nf(totals.paymentFee)}`}</td>
                <td>{`−${nf(totals.reserve)}`}</td>
                <td className="strong accent">{nf(totals.net)}</td>
                <td className="strong">{pct(totals.margin)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="divider" />
        <div className="note">
          <i className="ri-scales-3-line" />
          <span>{fill(L.formula)}</span>
        </div>
        <div className="note" style={{ marginTop: 8 }}>
          <i className="ri-file-excel-2-line" />
          <span>{L.exportNote}</span>
        </div>
      </Card>

      <Toast message={toast} />

      {/* Off-screen archive sheet that becomes the signed month-close PDF. */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', insetInlineStart: -12000, top: 0, width: 794, pointerEvents: 'none', zIndex: -1 }}
      >
        <div ref={sheetRef}>
          <LedgerArchiveSheet
            rows={rows}
            totals={totals}
            labels={d.adminLabels}
            locale={locale}
            currency={currency}
            rtl={!isEn}
            rangeLabel={rangeLabel}
            cycleLabel={isOpenCycle ? L.closing : L.closed}
            generatedAt={generatedAt}
            fingerprint={fingerprint || L.closeLocalOnly}
            docRef={docRef}
            signedBy={d.adminUser.name}
            signatureNote={L.pdfSignatureNote}
            nf={nf}
            pct={pct}
          />
        </div>
      </div>
    </>
  );
}