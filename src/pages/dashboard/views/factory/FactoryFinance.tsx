import { useState } from 'react';
import type { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { downloadCsv, downloadCombinedCsv } from '@/pages/dashboard/lib/csv';
import { downloadFile } from '@/pages/dashboard/lib/download';
import { useFactoryOps, formatWhen } from '@/pages/dashboard/lib/factoryStore';
import {
  Card, Stat, Pill, PageHead, Modal, Toast, HBars, MiniTrend,
} from '@/pages/dashboard/components/ui';

/* --------------------------------------------------------------- finance */

function FactoryFinance() {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const ops = useFactoryOps();
  const fin = d.factoryFinance;
  const [toast, setToast] = useState('');
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(d.factoryPayoutMethods[0]?.name ?? '');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };
  const locale = (i18n.resolvedLanguage || i18n.language || 'ar').match(/^(en|ur|id)/) !== null ? 'en-US' : 'ar-EG';
  const nf = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 0 });
  const currency = t('dashboard.charts.currency');
  const last = (arr: number[]) => arr[arr.length - 1];

  /* Normalises a value string — Arabic-Indic digits, thousands and decimal
     separators — into a number so invoices can be summed and compared. */
  const toNumber = (s: string): number => {
    const digits = s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
    const cleaned = digits.replace(/[٬,]/g, '').replace(/٫/g, '.');
    const match = cleaned.match(/\d+(\.\d+)?/);
    return match ? Number(match[0]) : 0;
  };

  /* Pairs each monthly statement with the invoices issued in that same month,
     so the owner can spot any reconciliation gap at a glance. */
  const comparison = fin.statements.map((s) => {
    const matched = fin.invoices.filter((inv) => s.period.startsWith(inv.period) || inv.period === s.period);
    const total = matched.reduce((sum, inv) => sum + toNumber(inv.amount), 0);
    const commission = toNumber(s.commission);
    const diff = commission - total;
    return {
      period: s.period,
      net: s.net,
      commission,
      invoicesCount: matched.length,
      invoicesTotal: total,
      diff,
      balanced: Math.abs(diff) < 1,
    };
  });

  /* Every statement and invoice is turned into a real, downloadable file so
     the buttons hand the owner something they can open in Excel or the
     browser, instead of only firing a toast. */
  const downloadStatement = (period: string, sales: string, commission: string, net: string, status: string) => {
    downloadFile(`statement-${period}.csv`, [
      `${t('dashboard.factory.finance.thPeriod')},${period}`,
      `${t('dashboard.factory.finance.thSales')},${sales}`,
      `${t('dashboard.factory.finance.thCommission')},${commission}`,
      `${t('dashboard.factory.finance.thNet')},${net}`,
      `${t('dashboard.factory.finance.thStatus')},${status}`,
      `${t('dashboard.factory.finance.bankLabel')},${fin.bank}`,
      `${d.factoryUser.factory},${d.factoryUser.country}`,
    ].join('\n'), 'text/csv');
    flash(t('dashboard.factory.finance.statementToast'));
  };

  const downloadInvoice = (id: string, type: string, amt: string, period: string, status: string) => {
    downloadFile(`invoice-${id}.csv`, [
      `${t('dashboard.factory.finance.thId')},${id}`,
      `${t('dashboard.factory.finance.thType')},${type}`,
      `${t('dashboard.factory.finance.thAmount')},${amt}`,
      `${t('dashboard.factory.finance.thPeriod')},${period}`,
      `${t('dashboard.factory.finance.thStatus')},${status}`,
      `${d.factoryUser.factory},${d.factoryUser.country}`,
    ].join('\n'), 'text/csv');
    flash(t('dashboard.factory.finance.invoiceToast'));
  };

  const exportCsv = () => {
    downloadCsv(
      'factory-finance.csv',
      [
        t('dashboard.factory.finance.thPeriod'),
        t('dashboard.factory.finance.thSales'),
        t('dashboard.factory.finance.thCommission'),
        t('dashboard.factory.finance.thNet'),
        t('dashboard.factory.finance.thStatus'),
      ],
      fin.statements.map((s) => [s.period, s.sales, s.commission, s.net, s.status]),
    );
    flash(t('dashboard.common.exportedFile', { file: 'factory-finance.csv' }));
  };

  /* Merges the seeded payout history with the requests the owner raised in
     this browser, newest first. */
  const liveWithdrawals = ops.withdrawals.map((w) => ({
    id: w.id,
    amount: w.amount,
    method: w.method,
    at: formatWhen(w.at, i18n.language),
    status: t(`dashboard.factory.finance.${w.statusKey === 'pending' ? 'withdrawPending' : 'withdrawProcessed'}`),
    tone: w.statusKey === 'pending' ? 'warn' : 'ok',
  }));
  const withdrawals = [...liveWithdrawals, ...d.factoryWithdrawals];

  /* Builds one combined file that carries every period: the statements, the
     invoices, the monthly reconciliation and the payout history. */
  const exportReport = () => {
    downloadCombinedCsv('factory-finance-report.csv', [
      {
        title: t('dashboard.factory.finance.reportStatements'),
        headers: [t('dashboard.factory.finance.thPeriod'), t('dashboard.factory.finance.thSales'), t('dashboard.factory.finance.thCommission'), t('dashboard.factory.finance.thNet'), t('dashboard.factory.finance.thStatus')],
        rows: fin.statements.map((s) => [s.period, s.sales, s.commission, s.net, s.status]),
      },
      {
        title: t('dashboard.factory.finance.reportInvoices'),
        headers: [t('dashboard.factory.finance.thId'), t('dashboard.factory.finance.thType'), t('dashboard.factory.finance.thAmount'), t('dashboard.factory.finance.thPeriod'), t('dashboard.factory.finance.thStatus')],
        rows: fin.invoices.map((inv) => [inv.id, inv.type, inv.amount, inv.period, inv.status]),
      },
      {
        title: t('dashboard.factory.finance.reportCompare'),
        headers: [t('dashboard.factory.finance.thPeriod'), t('dashboard.factory.finance.thCommission'), t('dashboard.factory.finance.thInvoicesTotal'), t('dashboard.factory.finance.thDifference')],
        rows: comparison.map((c) => [
          c.period,
          `${nf(c.commission)} ${currency}`,
          `${nf(c.invoicesTotal)} ${currency}`,
          c.balanced ? t('dashboard.factory.finance.compareBalanced') : `${nf(c.diff)} ${currency}`,
        ]),
      },
      {
        title: t('dashboard.factory.finance.reportWithdrawals'),
        headers: [t('dashboard.factory.finance.thWithdrawId'), t('dashboard.factory.finance.thWithdrawAmount'), t('dashboard.factory.finance.thWithdrawMethod'), t('dashboard.factory.finance.thWithdrawDate'), t('dashboard.factory.finance.thWithdrawStatus')],
        rows: withdrawals.map((w) => [w.id, w.amount, w.method, w.at, w.status]),
      },
    ]);
    flash(t('dashboard.factory.finance.reportToast'));
  };

  const submitWithdraw = () => {
    if (!amount.trim() || Number.isNaN(Number(amount.replace(/[^\d.]/g, '')))) { flash(t('dashboard.factory.finance.amountRequired')); return; }
    ops.addWithdrawal(amount.trim(), method);
    setOpen(false);
    setAmount('');
    flash(t('dashboard.factory.finance.withdrawToast'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.finance.title')}
        sub={t('dashboard.factory.finance.sub')}
        actions={(
          <>
            <button type="button" className="btn ghost" onClick={exportReport}><i className="ri-file-chart-line" /> {t('dashboard.factory.finance.exportReport')}</button>
            <button type="button" className="btn ghost" onClick={exportCsv}><i className="ri-download-2-line" /> {t('dashboard.common.export')}</button>
            <button type="button" className="btn primary" onClick={() => setOpen(true)}><i className="ri-hand-coin-line" /> {t('dashboard.factory.finance.requestWithdraw')}</button>
          </>
        )}
      />

      <div className="grid c4 mb">
        <Stat icon="ri-time-line" num={fin.pending} lbl={t('dashboard.factory.finance.pending')} />
        <Stat icon="ri-wallet-3-line" num={fin.available} lbl={t('dashboard.factory.finance.available')} />
        <Stat icon="ri-calendar-line" num={fin.nextCycle} lbl={t('dashboard.factory.finance.nextCycle')} />
        <Stat icon="ri-percent-line" num={fin.commission} lbl={t('dashboard.factory.finance.commissionLabel')} />
      </div>

      <div className="note mb">
        <i className="ri-shield-keyhole-line" />
        <span>{t('dashboard.factory.finance.bankNote')}</span>
        <button type="button" className="btn sm ghost" style={{ marginInlineStart: 'auto' }} onClick={() => flash(t('dashboard.factory.finance.bankToast'))}>
          <i className="ri-bank-line" /> {t('dashboard.factory.finance.updateBank')}
        </button>
      </div>

      <Card title={t('dashboard.factory.finance.trendTitle')} sub={t('dashboard.factory.finance.trendSub')} className="mb">
        <div className="grid c3">
          <MiniTrend title={t('dashboard.factory.finance.trendSales')} values={fin.trend.sales.values} labels={fin.trend.labels} total={`${nf(last(fin.trend.sales.values))} ${currency}`} delta={fin.trend.sales.delta} tone="gold" format={(n) => `${nf(n)} ${currency}`} />
          <MiniTrend title={t('dashboard.factory.finance.trendCommission')} values={fin.trend.commission.values} labels={fin.trend.labels} total={`${nf(last(fin.trend.commission.values))} ${currency}`} delta={fin.trend.commission.delta} tone="accent" format={(n) => `${nf(n)} ${currency}`} />
          <MiniTrend title={t('dashboard.factory.finance.trendNet')} values={fin.trend.net.values} labels={fin.trend.labels} total={`${nf(last(fin.trend.net.values))} ${currency}`} delta={fin.trend.net.delta} tone="ink" format={(n) => `${nf(n)} ${currency}`} />
        </div>
      </Card>

      <Card title={t('dashboard.factory.finance.byChannelTitle')} sub={t('dashboard.factory.finance.byChannelSub')} className="mb">
        <HBars items={fin.byChannel} tone="gold" />
      </Card>

      <Card title={t('dashboard.factory.finance.compareTitle')} sub={t('dashboard.factory.finance.compareSub')} className="mb">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('dashboard.factory.finance.thPeriod')}</th>
                <th>{t('dashboard.factory.finance.thNet')}</th>
                <th>{t('dashboard.factory.finance.thInvoicesTotal')}</th>
                <th>{t('dashboard.factory.finance.thDifference')}</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((c) => (
                <tr key={c.period}>
                  <td className="strong">{c.period}</td>
                  <td>{c.net}</td>
                  <td>
                    {`${nf(c.invoicesTotal)} ${currency}`}
                    <span className="muted small"> · {t('dashboard.factory.finance.invoicesTitle')} {c.invoicesCount}</span>
                  </td>
                  <td>
                    {c.balanced
                      ? <Pill tone="ok"><i className="ri-checkbox-circle-line" /> {t('dashboard.factory.finance.compareBalanced')}</Pill>
                      : <Pill tone="warn">{`${nf(c.diff)} ${currency}`}</Pill>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="split mb">
        <Card title={t('dashboard.factory.finance.statementsTitle')} sub={t('dashboard.factory.finance.statementsSub')}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('dashboard.factory.finance.thPeriod')}</th>
                  <th>{t('dashboard.factory.finance.thSales')}</th>
                  <th>{t('dashboard.factory.finance.thCommission')}</th>
                  <th>{t('dashboard.factory.finance.thNet')}</th>
                  <th>{t('dashboard.factory.finance.thStatus')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {fin.statements.map((s) => (
                  <tr key={s.period}>
                    <td className="strong">{s.period}</td>
                    <td>{s.sales}</td>
                    <td className="muted">{s.commission}</td>
                    <td className="strong accent">{s.net}</td>
                    <td><Pill tone={s.tone}>{s.status}</Pill></td>
                    <td>
                      <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.finance.downloadStatement')} onClick={() => downloadStatement(s.period, s.sales, s.commission, s.net, s.status)}>
                        <i className="ri-download-2-line" /> {t('dashboard.factory.finance.downloadStatement')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={t('dashboard.factory.finance.invoicesTitle')} sub={t('dashboard.factory.finance.invoicesSub')}>
          <div className="list">
            {fin.invoices.map((inv) => (
              <div className="list-row" key={inv.id}>
                <div className="ic"><i className="ri-receipt-line" /></div>
                <div className="body">
                  <div className="t small">{inv.id} · {inv.amount}</div>
                  <div className="s">{inv.type} · {inv.period}</div>
                </div>
                <div className="end">
                  <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.finance.downloadInvoice')} onClick={() => downloadInvoice(inv.id, inv.type, inv.amount, inv.period, inv.status)}>
                    <i className="ri-download-2-line" /> {t('dashboard.factory.finance.downloadInvoice')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title={t('dashboard.factory.finance.withdrawalsTitle')} sub={t('dashboard.factory.finance.withdrawalsSub')}>
        {withdrawals.length === 0 ? (
          <div className="note"><i className="ri-information-line" /><span>{t('dashboard.factory.finance.noWithdrawals')}</span></div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('dashboard.factory.finance.thWithdrawId')}</th>
                  <th>{t('dashboard.factory.finance.thWithdrawAmount')}</th>
                  <th>{t('dashboard.factory.finance.thWithdrawMethod')}</th>
                  <th>{t('dashboard.factory.finance.thWithdrawDate')}</th>
                  <th>{t('dashboard.factory.finance.thWithdrawStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td className="strong">{w.id}</td>
                    <td className="strong accent">{w.amount}</td>
                    <td className="muted small">{w.method}</td>
                    <td className="muted small">{w.at}</td>
                    <td><Pill tone={w.tone}>{w.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={t('dashboard.factory.finance.withdrawModalTitle')} sub={t('dashboard.factory.finance.withdrawModalSub', { avail: fin.available })}>
        <div className="field">
          <label htmlFor="wd-amount">{t('dashboard.factory.finance.amountLabel')}</label>
          <input id="wd-amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t('dashboard.factory.finance.amountPlaceholder')} />
        </div>
        <div className="field">
          <label htmlFor="wd-method">{t('dashboard.factory.finance.methodLabel')}</label>
          <select id="wd-method" value={method} onChange={(e) => setMethod(e.target.value)}>
            {d.factoryPayoutMethods.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={submitWithdraw}><i className="ri-check-line" /> {t('dashboard.factory.finance.confirmWithdraw')}</button>
          <button type="button" className="btn ghost" onClick={() => setOpen(false)}>{t('dashboard.common.cancel')}</button>
        </div>
      </Modal>
      <Toast message={toast} />
    </>
  );
}

export const factoryFinanceViews: Record<string, FunctionComponent> = {
  'f-finance': FactoryFinance,
};