import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as arTickets from '@/mocks/tickets';
import * as enTickets from '@/mocks/tickets.en';
import type { SupportTicket, TicketStatus } from '@/pages/support/lib/ticketStore';
import { mergeTickets } from '@/pages/support/lib/ticketStore';
import { downloadCsv } from '@/pages/dashboard/lib/csv';
import { useBuyerExport } from '@/hooks/useBuyerExport';
import { Card, PageHead, Pill, Stat, Timeline, Modal, Toast } from '@/pages/dashboard/components/ui';

interface TopicOption {
  value: string;
  label: string;
}

type StatusFilter = 'all' | TicketStatus;

const TONE: Record<TicketStatus, string> = {
  open: 'warn',
  replied: 'ok',
  closed: 'mute',
};

const FILTERS: StatusFilter[] = ['all', 'open', 'replied', 'closed'];

function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/* Default window: the whole current month, so the export hands back "this
   month only" unless the buyer widens it. */
function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  return {
    from: dayKey(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: dayKey(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

export default function BuyerTickets() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase();
  const isEn = lang.match(/^(en|ur|id)/) !== null;

  const seed = useMemo(
    () => (isEn ? enTickets.supportTickets : arTickets.supportTickets) as SupportTicket[],
    [isEn],
  );

  const [tickets] = useState<SupportTicket[]>(() => mergeTickets(seed));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [range, setRange] = useState(() => currentMonthRange());
  const [toast, setToast] = useState('');

  const pkg = useBuyerExport();
  const monthRange = currentMonthRange();
  const isThisMonth = range.from === monthRange.from && range.to === monthRange.to;
  const rangeActive = Boolean(range.from || range.to);

  const topics = useMemo(() => {
    const value = t('legal.contact.topics', { returnObjects: true });
    return Array.isArray(value) ? (value as unknown as TopicOption[]) : [];
  }, [t]);

  const topicLabel = (value: string) => topics.find((topic) => topic.value === value)?.label ?? value;

  const statusLabel = (status: TicketStatus) => {
    if (status === 'replied') return t('dashboard.buyerTickets.statusReplied');
    if (status === 'closed') return t('dashboard.buyerTickets.statusClosed');
    return t('dashboard.buyerTickets.statusOpen');
  };

  const filterLabel = (value: StatusFilter) => (
    value === 'all' ? t('dashboard.buyerTickets.filterAll') : statusLabel(value)
  );

  const dateLabel = (iso: string | null) => {
    if (!iso) return t('dashboard.buyerTickets.notRepliedYet');
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return t('dashboard.buyerTickets.notRepliedYet');
    return new Intl.DateTimeFormat(isEn ? 'en-GB' : 'ar-EG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const counts = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === 'open').length,
    replied: tickets.filter((ticket) => ticket.status === 'replied').length,
    closed: tickets.filter((ticket) => ticket.status === 'closed').length,
  }), [tickets]);

  /* Status filter, the live search and the date window stack on top of each
     other: the buyer can narrow by state, type a ticket number, and keep only
     one month, all at once. The chips count what is inside the window. */
  const ranged = useMemo(() => tickets.filter((ticket) => {
    const day = ticket.createdAt.slice(0, 10);
    if (range.from && day < range.from) return false;
    if (range.to && day > range.to) return false;
    return true;
  }), [tickets, range]);

  const rangedCounts = useMemo(() => ({
    all: ranged.length,
    open: ranged.filter((ticket) => ticket.status === 'open').length,
    replied: ranged.filter((ticket) => ticket.status === 'replied').length,
    closed: ranged.filter((ticket) => ticket.status === 'closed').length,
  }), [ranged]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ranged.filter((ticket) => {
      if (filter !== 'all' && ticket.status !== filter) return false;
      if (!q) return true;
      const topic = topics.find((item) => item.value === ticket.topic)?.label ?? ticket.topic;
      return ticket.id.toLowerCase().includes(q)
        || topic.toLowerCase().includes(q)
        || (ticket.orderRef ?? '').toLowerCase().includes(q);
    });
  }, [ranged, filter, query, topics]);

  /* CSV export mirrors exactly what is on screen (status filter + search), so
     the file a buyer sends to their accountant matches the rows they saw. */
  const exportCsv = () => {
    if (!visible.length) return;
    downloadCsv(
      `sia-tickets-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        t('dashboard.buyerTickets.thId'),
        t('dashboard.buyerTickets.thTopic'),
        t('dashboard.buyerTickets.orderLabel'),
        t('dashboard.buyerTickets.thSent'),
        t('dashboard.buyerTickets.thStatus'),
        t('dashboard.buyerTickets.thReply'),
        t('dashboard.buyerTickets.replyLabel'),
        t('dashboard.buyerTickets.messageLabel'),
      ],
      visible.map((ticket) => [
        ticket.id,
        topicLabel(ticket.topic),
        ticket.orderRef || '',
        dateLabel(ticket.createdAt),
        statusLabel(ticket.status),
        ticket.repliedAt ? dateLabel(ticket.repliedAt) : '',
        ticket.reply || '',
        ticket.message,
      ]),
    );
    setToast(t('dashboard.buyerTickets.exportDone'));
    window.setTimeout(() => setToast(''), 2800);
  };

  const perFilter = (value: StatusFilter) => rangedCounts[value];

  const selected = selectedId ? tickets.find((ticket) => ticket.id === selectedId) ?? null : null;

  const timeline = selected
    ? [
      {
        t: t('dashboard.buyerTickets.stepSent'),
        s: dateLabel(selected.createdAt),
        done: true,
      },
      {
        t: t('dashboard.buyerTickets.stepReview'),
        s: selected.status === 'open'
          ? t('dashboard.buyerTickets.waiting')
          : t('dashboard.buyerTickets.stepReviewSub'),
        done: selected.status !== 'open',
      },
      {
        t: t('dashboard.buyerTickets.stepReplied'),
        s: selected.repliedAt ? dateLabel(selected.repliedAt) : t('dashboard.buyerTickets.waiting'),
        done: Boolean(selected.repliedAt),
      },
    ]
    : [];

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.buyerTickets.eyebrow')}
        title={t('dashboard.buyerTickets.title')}
        sub={t('dashboard.buyerTickets.sub')}
        actions={(
          <Link className="btn primary" to="/support#contact">
            <i className="ri-mail-send-line" /> {t('dashboard.buyerTickets.openForm')}
          </Link>
        )}
      />

      <div className="grid c4 mb">
        <Stat icon="ri-ticket-2-line" num={String(counts.total)} lbl={t('dashboard.buyerTickets.statTotal')} />
        <Stat icon="ri-time-line" num={String(counts.open)} lbl={t('dashboard.buyerTickets.statOpen')} />
        <Stat icon="ri-checkbox-circle-line" num={String(counts.replied)} lbl={t('dashboard.buyerTickets.statReplied')} />
        <Stat icon="ri-archive-line" num={String(counts.closed)} lbl={t('dashboard.buyerTickets.statClosed')} />
      </div>

      <Card
        title={t('dashboard.buyerTickets.tableTitle')}
        sub={t('dashboard.buyerTickets.showing', { count: visible.length, total: tickets.length })}
      >
        <div className="tkt-search">
          <i className="ri-search-line" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('dashboard.buyerTickets.searchPlaceholder')}
            aria-label={t('dashboard.buyerTickets.searchPlaceholder')}
          />
          {query !== '' && (
            <button
              type="button"
              className="tkt-search-x"
              aria-label={t('dashboard.buyerTickets.searchClear')}
              onClick={() => setQuery('')}
            >
              <i className="ri-close-line" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="tkt-dates">
          <span className="tkt-dates-lbl">
            <i className="ri-calendar-line" aria-hidden="true" />
            {t('dashboard.buyerTickets.dateRange')}
          </span>
          <label className="tkt-date">
            <span>{t('dashboard.buyerTickets.dateFrom')}</span>
            <input
              type="date"
              value={range.from}
              max={range.to || undefined}
              onChange={(event) => setRange((prev) => ({ ...prev, from: event.target.value }))}
            />
          </label>
          <span className="tkt-dash" aria-hidden="true">—</span>
          <label className="tkt-date">
            <span>{t('dashboard.buyerTickets.dateTo')}</span>
            <input
              type="date"
              value={range.to}
              min={range.from || undefined}
              onChange={(event) => setRange((prev) => ({ ...prev, to: event.target.value }))}
            />
          </label>
          <div className="tkt-range-presets">
            <button
              type="button"
              className={`chip ${isThisMonth ? 'is-on' : ''}`}
              onClick={() => setRange(monthRange)}
            >
              {t('dashboard.buyerTickets.thisMonth')}
            </button>
            <button
              type="button"
              className={`chip ${rangeActive ? '' : 'is-on'}`}
              onClick={() => setRange({ from: '', to: '' })}
            >
              {t('dashboard.buyerTickets.allDates')}
            </button>
          </div>
        </div>
        <p className="tkt-range-hint small muted">
          <i className="ri-information-line" aria-hidden="true" />
          {t('dashboard.buyerTickets.rangeHint')}
        </p>

        <div className="tkt-filters" role="group" aria-label={t('dashboard.buyerTickets.filterLabel')}>
          <div className="seg compact">
            {FILTERS.map((value) => (
              <button
                key={value}
                type="button"
                className={filter === value ? 'is-on' : ''}
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
              >
                {filterLabel(value)}
                <b className="n">{perFilter(value)}</b>
              </button>
            ))}
          </div>
          <div className="tkt-actions">
            <button
              type="button"
              className="btn sm primary"
              onClick={() => pkg.run(range)}
              disabled={pkg.busy}
              title={t('dashboard.buyerExport.hint')}
            >
              <i className={pkg.busy ? 'ri-loader-4-line pkg-busy-icon' : 'ri-folder-download-line'} />
              {pkg.busy ? t('dashboard.buyerExport.busy') : t('dashboard.buyerExport.short')}
            </button>
            <button
              type="button"
              className="btn sm ghost"
              onClick={exportCsv}
              disabled={!visible.length}
            >
              <i className="ri-file-excel-2-line" /> {t('dashboard.buyerTickets.exportCsv')}
            </button>
            <Link className="btn sm ghost" to="/support#contact">
              <i className="ri-add-line" /> {t('dashboard.buyerTickets.openForm')}
            </Link>
          </div>
        </div>

        {visible.length > 0 ? (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('dashboard.buyerTickets.thId')}</th>
                  <th>{t('dashboard.buyerTickets.thTopic')}</th>
                  <th>{t('dashboard.buyerTickets.thSent')}</th>
                  <th>{t('dashboard.buyerTickets.thStatus')}</th>
                  <th>{t('dashboard.buyerTickets.thReply')}</th>
                  <th>{t('dashboard.buyerTickets.thActions')}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((ticket) => (
                  <tr key={ticket.id} onClick={() => setSelectedId(ticket.id)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="tbl-name">
                        <div>
                          <div className="t">{ticket.id}</div>
                          <div className="s">{ticket.orderRef || t('dashboard.buyerTickets.noOrder')}</div>
                        </div>
                      </div>
                    </td>
                    <td>{topicLabel(ticket.topic)}</td>
                    <td className="muted">{dateLabel(ticket.createdAt)}</td>
                    <td><Pill tone={TONE[ticket.status]}>{statusLabel(ticket.status)}</Pill></td>
                    <td className="muted">
                      {ticket.repliedAt ? dateLabel(ticket.repliedAt) : t('dashboard.buyerTickets.notRepliedYet')}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn sm ghost"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedId(ticket.id);
                        }}
                      >
                        <i className="ri-eye-line" /> {t('dashboard.buyerTickets.view')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty">
            <i className="ri-customer-service-2-line" />
            <div>{t('dashboard.buyerTickets.empty')}</div>
            <Link className="btn primary" to="/support#contact" style={{ marginTop: 12 }}>
              <i className="ri-mail-send-line" /> {t('dashboard.buyerTickets.emptyCta')}
            </Link>
          </div>
        ) : query.trim() !== '' ? (
          <div className="empty">
            <i className="ri-search-eye-line" />
            <div>{t('dashboard.buyerTickets.searchEmpty')}</div>
            <button
              type="button"
              className="btn ghost"
              style={{ marginTop: 12 }}
              onClick={() => setQuery('')}
            >
              <i className="ri-refresh-line" /> {t('dashboard.buyerTickets.searchClear')}
            </button>
          </div>
        ) : rangeActive && ranged.length === 0 ? (
          <div className="empty">
            <i className="ri-calendar-2-line" />
            <div>{t('dashboard.buyerTickets.noRangeResults')}</div>
            <button
              type="button"
              className="btn ghost"
              style={{ marginTop: 12 }}
              onClick={() => setRange(monthRange)}
            >
              <i className="ri-calendar-check-line" /> {t('dashboard.buyerTickets.thisMonth')}
            </button>
          </div>
        ) : (
          <div className="empty">
            <i className="ri-filter-off-line" />
            <div>{t('dashboard.buyerTickets.noFilterResults')}</div>
            <button type="button" className="btn ghost" style={{ marginTop: 12 }} onClick={() => setFilter('all')}>
              <i className="ri-refresh-line" /> {t('dashboard.buyerTickets.filterAll')}
            </button>
          </div>
        )}
      </Card>

      <p className="small muted" style={{ marginTop: 12 }}>
        <i className="ri-information-line" /> {t('dashboard.buyerTickets.note')}
      </p>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={t('dashboard.buyerTickets.detailTitle')}
        sub={selected ? t('dashboard.buyerTickets.detailSub', {
          id: selected.id,
          topic: topicLabel(selected.topic),
        }) : ''}
      >
        {selected && (
          <>
            <div className="row-between wrap mb" style={{ gap: 10 }}>
              <Pill tone={TONE[selected.status]}>{statusLabel(selected.status)}</Pill>
              <span className="small muted">
                <i className="ri-calendar-line" /> {dateLabel(selected.createdAt)}
              </span>
            </div>

            <div className="field">
              <label>{t('dashboard.buyerTickets.messageLabel')}</label>
              <p className="small" style={{ margin: 0, lineHeight: 1.9 }}>{selected.message}</p>
            </div>

            {selected.orderRef && (
              <div className="note" style={{ marginBottom: 14 }}>
                <i className="ri-file-list-3-line" />
                <span>{t('dashboard.buyerTickets.orderLabel')}: {selected.orderRef}</span>
              </div>
            )}

            <div className="divider" />
            <div className="small strong" style={{ marginBottom: 10 }}>{t('dashboard.buyerTickets.timelineTitle')}</div>
            <Timeline items={timeline} />

            <div className="divider" />
            <div className="small strong" style={{ marginBottom: 8 }}>{t('dashboard.buyerTickets.replyLabel')}</div>
            {selected.reply ? (
              <div className="note">
                <i className="ri-reply-line" />
                <span>{selected.reply}</span>
              </div>
            ) : (
              <div className="note">
                <i className="ri-time-line" />
                <span>{t('dashboard.buyerTickets.pendingReply')}</span>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setSelectedId(null)}>
                {t('dashboard.common.close')}
              </button>
            </div>
          </>
        )}
      </Modal>

      <Toast message={toast || pkg.toast} />
    </>
  );
}