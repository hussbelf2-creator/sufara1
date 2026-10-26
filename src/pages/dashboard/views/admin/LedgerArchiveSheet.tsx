import type { SettledOrder } from '@/pages/dashboard/lib/economics';
import type { useDashboard } from '@/hooks/useDashboard';

type DashboardLabels = ReturnType<typeof useDashboard>['adminLabels'];

interface Props {
  rows: SettledOrder[];
  totals: { gross: number; take: number; ambassador: number; paymentFee: number; reserve: number; net: number; margin: number };
  labels: DashboardLabels;
  locale: string;
  currency: string;
  rtl: boolean;
  rangeLabel: string;
  cycleLabel: string;
  generatedAt: string;
  fingerprint: string;
  docRef: string;
  signedBy: string;
  signatureNote: string;
  nf: (n: number, digits?: number) => string;
  pct: (n: number) => string;
}

/* A fixed-width, print-styled archive sheet. It is rendered off-screen, then
   rasterised into a PDF, so the file finance files away looks the same on every
   machine regardless of the theme or the window size. */
export default function LedgerArchiveSheet({
  rows, totals, labels, locale, currency, rtl, rangeLabel, cycleLabel,
  generatedAt, fingerprint, docRef, signedBy, signatureNote, nf, pct,
}: Props) {
  const F = labels.finance;
  const C = labels.common;
  const base: React.CSSProperties = {
    width: 794,
    background: '#ffffff',
    color: '#1a1a1a',
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    lineHeight: 1.7,
    direction: rtl ? 'rtl' : 'ltr',
    padding: '36px 34px 30px',
  };
  const cell: React.CSSProperties = {
    borderBottom: '1px solid #e6e6e6',
    padding: '6px 5px',
    textAlign: rtl ? 'right' : 'left',
    verticalAlign: 'top',
  };
  const head: React.CSSProperties = {
    ...cell,
    background: '#f4f4f2',
    borderTop: '1px solid #d8d8d8',
    borderBottom: '1px solid #d8d8d8',
    fontSize: 9.5,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  };

  return (
    <div style={base}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1a1a1a', paddingBottom: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '.02em' }}>
            {labels.finance.ledger ? 'Saudi Trade Ambassadors' : 'Safeer'}
          </div>
          <div style={{ fontSize: 10, color: '#666' }}>Safeer · Export Desk · Jeddah, Saudi Arabia</div>
          <div style={{ fontSize: 10, color: '#666' }}>VAT 310123456700003 · CR 1010478231</div>
        </div>
        <div style={{ textAlign: rtl ? 'left' : 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>{F.pdfTitle}</div>
          <div style={{ fontSize: 9.5, color: '#666' }}>{F.pdfSub}</div>
          <div style={{ fontSize: 10, marginTop: 4 }}>
            <b>{F.pdfRef}:</b> {docRef}
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#e6e6e6', border: '1px solid #e6e6e6', borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
        {[
          [F.pdfPeriod, rangeLabel],
          [F.pdfGenerated, generatedAt],
          [F.pdfOrders, String(rows.length)],
          [F.pdfCycle, cycleLabel],
        ].map(([k, v]) => (
          <div key={k} style={{ background: '#fff', padding: '7px 9px' }}>
            <div style={{ fontSize: 9, color: '#666' }}>{k}</div>
            <div style={{ fontSize: 10.5, fontWeight: 700 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
        {[
          [F.statGmv, `${nf(totals.gross)} ${currency}`],
          [F.statTake, `${nf(totals.take)} ${currency}`],
          [F.statAmb, `${nf(totals.ambassador)} ${currency}`],
          [F.statNet, `${nf(totals.net)} ${currency}`],
        ].map(([k, v]) => (
          <div key={k} style={{ border: '1px solid #e0e0e0', borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ fontSize: 8.5, color: '#666' }}>{k}</div>
            <div style={{ fontSize: 12.5, fontWeight: 800 }}>{v}</div>
          </div>
        ))}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9.5 }}>
        <thead>
          <tr>
            <th style={head}>{C.order}</th>
            <th style={head}>{F.thDate}</th>
            <th style={head}>{C.buyer}</th>
            <th style={head}>{F.thGross}</th>
            <th style={head}>{F.thTakeRate}</th>
            <th style={head}>{F.thTake}</th>
            <th style={head}>{F.thAmb}</th>
            <th style={head}>{F.thNet}</th>
            <th style={head}>{F.thMargin}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ ...cell, fontWeight: 700 }}>{r.id}</td>
              <td style={cell}>{r.date ? new Date(`${r.date}T00:00:00Z`).toLocaleDateString(locale, { day: '2-digit', month: 'short' }) : '—'}</td>
              <td style={cell}>
                {r.buyer}
                <div style={{ fontSize: 8.5, color: '#777' }}>{r.country} · {r.segment === 'repeat' ? F.repeatCustomer : F.newCustomer}</div>
              </td>
              <td style={{ ...cell, fontWeight: 700 }}>{`${nf(r.gross)} ${currency}`}</td>
              <td style={cell}>{pct(r.takeRate)}</td>
              <td style={cell}>{nf(r.take)}</td>
              <td style={cell}>{r.ambassadorCommission > 0 ? `−${nf(r.ambassadorCommission)}` : '—'}</td>
              <td style={{ ...cell, fontWeight: 700 }}>{nf(r.net)}</td>
              <td style={cell}>{pct(r.margin)}</td>
            </tr>
          ))}
          <tr>
            <td style={{ ...cell, fontWeight: 800, background: '#f7f7f5', borderTop: '1px solid #cfcfcf' }} colSpan={3}>{F.total}</td>
            <td style={{ ...cell, fontWeight: 800, background: '#f7f7f5', borderTop: '1px solid #cfcfcf' }}>{`${nf(totals.gross)} ${currency}`}</td>
            <td style={{ ...cell, background: '#f7f7f5', borderTop: '1px solid #cfcfcf' }}>{pct(totals.gross > 0 ? totals.take / totals.gross : 0)}</td>
            <td style={{ ...cell, fontWeight: 800, background: '#f7f7f5', borderTop: '1px solid #cfcfcf' }}>{nf(totals.take)}</td>
            <td style={{ ...cell, fontWeight: 800, background: '#f7f7f5', borderTop: '1px solid #cfcfcf' }}>{`−${nf(totals.ambassador)}`}</td>
            <td style={{ ...cell, fontWeight: 800, background: '#f7f7f5', borderTop: '1px solid #cfcfcf' }}>{nf(totals.net)}</td>
            <td style={{ ...cell, fontWeight: 800, background: '#f7f7f5', borderTop: '1px solid #cfcfcf' }}>{pct(totals.margin)}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 10, fontSize: 9, color: '#555', border: '1px solid #e6e6e6', borderRadius: 6, padding: '8px 10px', lineHeight: 1.75 }}>
        {F.formula}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginTop: 18 }}>
        <div style={{ border: '1px solid #dadada', borderRadius: 8, padding: '11px 12px' }}>
          <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>{F.pdfSignature}</div>
          <div style={{ fontSize: 11.5, fontWeight: 700 }}>{signedBy}</div>
          <div style={{ fontSize: 9.5, color: '#555' }}>{F.pdfSignedBy}</div>
          <div style={{ borderBottom: '1px solid #9c9c9c', height: 26, marginTop: 10 }} />
          <div style={{ fontSize: 8.5, color: '#777', marginTop: 4 }}>{F.pdfSignLine}</div>
          <div style={{ fontSize: 8.5, color: '#666', marginTop: 8, lineHeight: 1.7 }}>{signatureNote}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ border: '1.5px dashed #1a1a1a', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#555' }}>{F.pdfHash}</div>
            <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.08em', marginTop: 2 }}>{fingerprint}</div>
            <div style={{ fontSize: 8.5, color: '#777', marginTop: 2 }}>{docRef}</div>
          </div>
          <div style={{ fontSize: 8.5, color: '#666', lineHeight: 1.7 }}>{F.pdfAuditNote}</div>
        </div>
      </div>

      <div style={{ marginTop: 14, borderTop: '1px solid #e2e2e2', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: '#888' }}>
        <span>Safeer · Settlement ledger archive</span>
        <span>{generatedAt}</span>
      </div>
    </div>
  );
}