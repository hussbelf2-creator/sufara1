import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { monthStamp, settleOrder, totalsOf } from '@/pages/dashboard/lib/economics';
import type { LedgerOrder } from '@/pages/dashboard/lib/economics';
import { Card, Pill } from '@/pages/dashboard/components/ui';

/* Month-on-month comparison that sits above the finance KPI cards. It reads the
   same ledger, so the numbers can never disagree with the table below: the
   current calendar month is compared against the full previous month for order
   value, platform take, platform net and order count. */

interface Metric {
  label: string;
  current: number;
  previous: number;
  money: boolean;
}

export default function MonthCompare({ orders }: { orders: LedgerOrder[] }) {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const L = d.adminLabels.finance;

  const isEn = (i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().match(/^(en|ur|id)/) !== null;
  const locale = isEn ? 'en-US' : 'ar-EG';
  const currency = t('dashboard.charts.currency');
  const nf = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 0 });
  const pct = (n: number) => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(n);
  const monthName = (date: Date) => date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  const data = useMemo(() => {
    const now = new Date();
    const currentKey = monthStamp(now);
    const previousDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const previousKey = monthStamp(previousDate);

    const pick = (key: string) => orders.filter((o) => (o.date ?? '').slice(0, 7) === key);
    const currentRows = pick(currentKey);
    const previousRows = pick(previousKey);
    const currentTotals = totalsOf(currentRows.map((o) => settleOrder(o)));
    const previousTotals = totalsOf(previousRows.map((o) => settleOrder(o)));

    const metrics: Metric[] = [
      { label: L.compareGross, current: currentTotals.gross, previous: previousTotals.gross, money: true },
      { label: L.compareTake, current: currentTotals.take, previous: previousTotals.take, money: true },
      { label: L.compareNet, current: currentTotals.net, previous: previousTotals.net, money: true },
      { label: L.compareOrders, current: currentRows.length, previous: previousRows.length, money: false },
    ];

    return {
      metrics,
      currentLabel: monthName(now),
      previousLabel: monthName(previousDate),
      hasPrevious: previousRows.length > 0,
    };
  }, [orders, locale, L]);

  const fmt = (value: number, money: boolean) => (money ? `${nf(value)} ${currency}` : nf(value));

  return (
    <Card className="mb" title={L.compareTitle} sub={L.compareSub}>
      <div className="grid c4">
        {data.metrics.map((m) => {
          const delta = m.previous > 0 && data.hasPrevious
            ? (m.current - m.previous) / m.previous
            : null;
          const up = (delta ?? 0) >= 0;
          return (
            <div key={m.label}>
              <div className="small muted">{m.label}</div>
              <div className="strong" style={{ fontSize: 21, marginTop: 4 }}>{fmt(m.current, m.money)}</div>
              <div className="row-between small wrap" style={{ marginTop: 6, gap: 8 }}>
                <span className="muted">
                  {L.comparePrev} · {fmt(m.previous, m.money)}
                </span>
                {delta === null ? (
                  <Pill tone="mute">{L.compareNoPrev}</Pill>
                ) : (
                  <Pill tone={up ? 'ok' : 'danger'}>
                    <i className={up ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} />
                    {' '}
                    {pct(Math.abs(delta))}
                  </Pill>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="divider" />
      <div className="row-between wrap small" style={{ gap: 8 }}>
        <span className="muted">
          <i className="ri-calendar-2-line" /> {L.compareCurrent}: {data.currentLabel}
        </span>
        <span className="muted">{L.comparePrev}: {data.previousLabel}</span>
      </div>
    </Card>
  );
}