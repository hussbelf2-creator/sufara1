import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { useAdminOps } from '@/pages/dashboard/lib/adminStore';
import type { ReturnCaseStatus } from '@/pages/dashboard/lib/adminStore';
import { downloadCsv } from '@/pages/dashboard/lib/csv';
import { Card, HBars, Pill, PageHead, Stat, Toast } from '@/pages/dashboard/components/ui';

/* The returns register: one row per return case, from the buyer's request all
   the way to the parcel being booked back in at the warehouse. Every decision
   (accept, reject, received) is persisted per case and written to the audit
   log, so the register never forks into two different states. */

type StatusKey = 'pending' | ReturnCaseStatus;

const TONE: Record<StatusKey, string> = {
  pending: 'warn',
  accepted: 'info',
  rejected: 'danger',
  received: 'ok',
};

export default function ReturnsLog() {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const ops = useAdminOps();
  const L = d.adminLabels.returnsLog;
  const C = d.adminLabels.common;

  const isEn = (i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().match(/^(en|ur|id)/) !== null;
  const locale = isEn ? 'en-US' : 'ar-EG';
  const currency = t('dashboard.charts.currency');
  const nf = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 0 });
  const day = (iso?: string) => (iso
    ? new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
    : '—');
  const when = (ts?: number) => (ts
    ? new Date(ts).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
    : '');

  const [filter, setFilter] = useState<'all' | StatusKey>('all');
  const [toast, setToast] = useState('');

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2600);
  };

  const reasonLabel = (reason: string): string => {
    if (reason === 'damaged') return L.reasonDamaged;
    if (reason === 'size') return L.reasonSize;
    if (reason === 'notAsDescribed') return L.reasonNotAsDescribed;
    return L.reasonOther;
  };

  const statusLabel = (status: StatusKey): string => {
    if (status === 'accepted') return L.statusAccepted;
    if (status === 'rejected') return L.statusRejected;
    if (status === 'received') return L.statusReceived;
    return L.statusPending;
  };

  /* Seeded case status, overlaid with whatever decision was applied here. */
  const rows = useMemo(() => d.adminReturnsLog.map((r) => {
    const patch = ops.returnCases[r.id];
    const status = (patch?.status ?? r.status) as StatusKey;
    return {
      ...r,
      status,
      tone: TONE[status],
      decidedAt: patch?.at,
    };
  }), [d.adminReturnsLog, ops.returnCases]);

  const counts = useMemo(() => ({
    all: rows.length,
    pending: rows.filter((r) => r.status === 'pending').length,
    accepted: rows.filter((r) => r.status === 'accepted').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
    received: rows.filter((r) => r.status === 'received').length,
  }), [rows]);

  const creditValue = useMemo(
    () => rows
      .filter((r) => r.status === 'accepted' || r.status === 'received')
      .reduce((sum, r) => sum + r.amount, 0),
    [rows],
  );

  const visible = useMemo(
    () => (filter === 'all' ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter],
  );

  /* Reasons ranked by how often buyers gave them, with the credit value each
     one carried — the fastest read of what is actually going wrong. Computed
     from the whole register, independent of the status filter, so the ranking
     never shifts under the reader's feet. */
  const reasons = useMemo(() => {
    const defs = [
      { key: 'damaged', label: L.reasonDamaged },
      { key: 'size', label: L.reasonSize },
      { key: 'notAsDescribed', label: L.reasonNotAsDescribed },
      { key: 'other', label: L.reasonOther },
    ];
    const total = rows.length;
    return defs
      .map((def) => {
        const list = rows.filter((r) => r.reason === def.key);
        const amount = list.reduce((sum, r) => sum + r.amount, 0);
        const pct = total > 0 ? Math.round((list.length / total) * 100) : 0;
        return { ...def, count: list.length, amount, pct };
      })
      .sort((a, b) => b.count - a.count || b.amount - a.amount);
  }, [rows, L.reasonDamaged, L.reasonSize, L.reasonNotAsDescribed, L.reasonOther]);

  const topReason = reasons[0];
  const reasonTotal = rows.length;

  const decide = (row: (typeof rows)[number], status: ReturnCaseStatus) => {
    const label = statusLabel(status);
    ops.setReturnCase(row.id, status, {
      who: d.adminUser.name,
      what: `${label} · ${row.id} — ${row.order}`,
      cat: 'return',
      before: statusLabel(row.status),
      after: label,
    });
    if (status === 'accepted') flash(L.acceptDone.replace('{{id}}', row.id));
    else if (status === 'rejected') flash(L.rejectDone.replace('{{id}}', row.id));
    else flash(L.receivedDone.replace('{{id}}', row.id));
  };

  const exportCsv = () => {
    downloadCsv(
      'sia-returns-register.csv',
      [L.thCase, L.thOrder, L.thBuyer, C.country, C.factory, L.thItem, L.thReason, L.thAmount, L.thCredit, L.thRequested, L.thStatus],
      visible.map((r) => [
        r.id,
        r.order,
        r.buyer,
        r.country,
        r.factory,
        r.item,
        reasonLabel(r.reason),
        r.amount,
        r.creditNote,
        day(r.requestedAt),
        statusLabel(r.status),
      ]),
    );
    flash(L.exportDone);
  };

  const filters: { key: 'all' | StatusKey; label: string; n: number }[] = [
    { key: 'all', label: L.filterAll, n: counts.all },
    { key: 'pending', label: L.statusPending, n: counts.pending },
    { key: 'accepted', label: L.statusAccepted, n: counts.accepted },
    { key: 'rejected', label: L.statusRejected, n: counts.rejected },
    { key: 'received', label: L.statusReceived, n: counts.received },
  ];

  return (
    <>
      <PageHead
        eyebrow={d.adminLabels.meta.eyebrow}
        title={L.title}
        sub={L.sub}
        actions={(
          <button type="button" className="btn ghost" onClick={exportCsv}>
            <i className="ri-file-excel-2-line" /> {C.exportExcel}
          </button>
        )}
      />

      <div className="grid c4 mb">
        <Stat icon="ri-arrow-go-back-line" num={nf(counts.all)} lbl={L.statTotal} />
        <Stat icon="ri-timer-line" num={nf(counts.pending)} lbl={L.statPending} />
        <Stat icon="ri-checkbox-circle-line" num={nf(counts.accepted + counts.received)} lbl={L.statAccepted} />
        <Stat icon="ri-file-paper-2-line" num={`${nf(creditValue)} ${currency}`} lbl={L.statCredit} />
      </div>

      <Card
        className="mb"
        title={L.reasonsTitle}
        sub={L.reasonsSub}
        action={topReason && topReason.count > 0 ? (
          <Pill tone="warn">
            {L.reasonTop
              .replace('{{reason}}', topReason.label)
              .replace('{{count}}', String(topReason.count))
              .replace('{{total}}', String(reasonTotal))
              .replace('{{pct}}', String(topReason.pct))}
          </Pill>
        ) : undefined}
      >
        {reasonTotal === 0 ? (
          <div className="empty">
            <i className="ri-bar-chart-box-line" />
            <div>{L.empty}</div>
          </div>
        ) : (
          <HBars
            items={reasons.map((r) => ({
              label: r.label,
              value: r.count,
              display: `${nf(r.count)} · ${r.pct}% · ${nf(r.amount)} ${currency}`,
            }))}
          />
        )}
        <div className="divider" />
        <div className="note">
          <i className="ri-lightbulb-line" />
          <span>{L.reasonsNote}</span>
        </div>
      </Card>

      <Card
        title={L.title}
        sub={`${visible.length} / ${counts.all}`}
        action={(
          <div className="seg compact" role="tablist" aria-label={L.thStatus}>
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={filter === f.key}
                className={filter === f.key ? 'is-on' : ''}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                <b className="n" style={{ marginInlineStart: 6 }}>{f.n}</b>
              </button>
            ))}
          </div>
        )}
      >
        {visible.length === 0 ? (
          <div className="empty">
            <i className="ri-inbox-line" />
            <div>{L.empty}</div>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{L.thCase}</th>
                  <th>{L.thOrder}</th>
                  <th>{L.thBuyer}</th>
                  <th>{L.thItem}</th>
                  <th>{L.thReason}</th>
                  <th>{L.thAmount}</th>
                  <th>{L.thCredit}</th>
                  <th>{L.thRequested}</th>
                  <th>{L.thStatus}</th>
                  <th>{C.actions}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id}>
                    <td className="strong">{r.id}</td>
                    <td>{r.order}</td>
                    <td>
                      {r.buyer}
                      <div className="s muted small">{r.country}</div>
                    </td>
                    <td>
                      {r.item}
                      <div className="s muted small">{r.factory}</div>
                    </td>
                    <td className="muted small">{reasonLabel(r.reason)}</td>
                    <td className="strong">{`${nf(r.amount)} ${currency}`}</td>
                    <td className="muted small">{r.creditNote}</td>
                    <td className="muted small">
                      {day(r.requestedAt)}
                      {r.status === 'received' && r.decidedAt ? (
                        <div className="s small">{L.receivedAt.replace('{{date}}', when(r.decidedAt))}</div>
                      ) : null}
                    </td>
                    <td><Pill tone={r.tone}>{statusLabel(r.status)}</Pill></td>
                    <td>
                      <div className="row-between wrap" style={{ gap: 6 }}>
                        <button
                          type="button"
                          className="btn sm primary"
                          disabled={r.status !== 'pending'}
                          onClick={() => decide(r, 'accepted')}
                        >
                          <i className="ri-check-line" /> {L.accept}
                        </button>
                        <button
                          type="button"
                          className="btn sm ghost"
                          disabled={r.status !== 'pending'}
                          onClick={() => decide(r, 'rejected')}
                        >
                          <i className="ri-close-line" /> {L.reject}
                        </button>
                        <button
                          type="button"
                          className={`btn sm ${r.status === 'accepted' ? 'primary' : 'ghost'}`}
                          disabled={r.status !== 'accepted'}
                          onClick={() => decide(r, 'received')}
                        >
                          <i className="ri-inbox-archive-line" /> {L.markReceived}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="divider" />
        <div className="note">
          <i className="ri-information-line" />
          <span>{L.hint}</span>
        </div>
      </Card>

      <Toast message={toast} />
    </>
  );
}