import { useState } from 'react';
import type { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { useDashboardNav } from '@/pages/dashboard/components/DashboardNav';
import { setContractIntent } from '@/pages/dashboard/views/contracts/intent';
import { downloadCsv } from '@/pages/dashboard/lib/csv';
import { downloadFile } from '@/pages/dashboard/lib/download';
import { useFactoryOps, orderTone, shipmentTone, formatWhen, ORDER_FLOW, DEAL_FLOW } from '@/pages/dashboard/lib/factoryStore';
import type { OrderStage, ShipmentStatus, ShipmentEvent, DealStage } from '@/pages/dashboard/lib/factoryStore';
import {
  Card, Pill, PageHead, Modal, Toast, Switch, Bar,
} from '@/pages/dashboard/components/ui';
import { factoryRfqViews } from './FactoryRfq';
import { factoryFinanceViews } from './FactoryFinance';
import { factoryAnalyticsViews } from './FactoryAnalytics';
import { factoryAuditViews } from './FactoryAudit';

/* ---------------------------------------------------------------- orders */

function FactoryOrders() {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const ops = useFactoryOps();
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [country, setCountry] = useState('all');
  const [active, setActive] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  const stageOf = (id: string): OrderStage => ops.orders[id]?.stage ?? 'awaiting';
  const stageLabel = (s: string) => t(`dashboard.factory.orders.stage.${s}`);
  const nextStageOf = (s: string): OrderStage | undefined => {
    const i = ORDER_FLOW.indexOf(s as OrderStage);
    return i >= 0 && i < ORDER_FLOW.length - 1 ? ORDER_FLOW[i + 1] : undefined;
  };

  /* Builds a real printable label file for an order and downloads it. */
  const printLabel = (o: { id: string; buyer: string; country: string; product: string; qty: number | string; ship: string }) => {
    downloadFile(`label-${o.id}.txt`, [
      `${t('dashboard.factory.orders.thOrder')}: ${o.id}`,
      `${t('dashboard.factory.orders.thBuyer')}: ${o.buyer} · ${o.country}`,
      `${t('dashboard.factory.orders.thProduct')}: ${o.product}`,
      `${t('dashboard.factory.orders.thQty')}: ${o.qty}`,
      `${t('dashboard.factory.orders.thShip')}: ${o.ship}`,
      d.factoryUser.factory,
    ].join('\n'));
    flash(t('dashboard.factory.orders.labelToast'));
  };

  /* Moves the order one step along the real workflow and saves it. */
  const advance = (id: string) => {
    const nx = nextStageOf(stageOf(id));
    if (!nx) return;
    ops.setOrderStatus(id, nx);
    flash(t('dashboard.factory.orders.advancedToast'));
  };

  /* Creates a real shipment (with a tracking number) for a ready order. */
  const createShipment = (o: { id: string; ship: string; country: string }) => {
    const carrier = o.ship.includes('—') ? o.ship.split('—').pop()!.trim() : o.ship;
    const tracking = ops.createOrderShipment({ id: o.id, carrier, country: o.country });
    flash(t('dashboard.factory.orders.shipmentCreatedToast', { tracking }));
  };

  const countries = Array.from(new Set(d.factoryOrders.map((o) => o.country)));
  const statusOptions: (OrderStage | 'all')[] = ['all', ...ORDER_FLOW];
  const hasFilters = query.trim() !== '' || status !== 'all' || country !== 'all';

  const filtered = d.factoryOrders.filter((o) => {
    if (status !== 'all' && stageOf(o.id) !== status) return false;
    if (country !== 'all' && o.country !== country) return false;
    const q = query.trim().toLowerCase();
    if (q) {
      return o.id.toLowerCase().includes(q)
        || o.buyer.toLowerCase().includes(q)
        || o.product.toLowerCase().includes(q);
    }
    return true;
  });

  const exportCsv = () => {
    downloadCsv(
      'factory-orders.csv',
      [
        t('dashboard.factory.orders.thOrder'),
        t('dashboard.factory.orders.thBuyer'),
        t('dashboard.factory.orders.thCountry'),
        t('dashboard.factory.orders.thProduct'),
        t('dashboard.factory.orders.thQty'),
        t('dashboard.factory.orders.thDue'),
        t('dashboard.factory.orders.thShip'),
        t('dashboard.factory.orders.thStatus'),
        t('dashboard.factory.orders.trackingLabel'),
      ],
      filtered.map((o) => [o.id, o.buyer, o.country, o.product, String(o.qty), o.due, o.ship, stageLabel(stageOf(o.id)), ops.orders[o.id]?.tracking ?? '']),
    );
    flash(t('dashboard.common.exportedFile', { file: 'factory-orders.csv' }));
  };

  const activeOrder = active ? d.factoryOrders.find((o) => o.id === active) : null;
  const activeRec = active ? ops.orders[active] : undefined;

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.orders.title')}
        sub={t('dashboard.factory.orders.sub')}
        actions={<button type="button" className="btn ghost" onClick={exportCsv}><i className="ri-download-2-line" /> {t('dashboard.common.export')}</button>}
      />
      <Card>
        <div className="audit-bar">
          <div className="fld grow">
            <i className="ri-search-line" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('dashboard.factory.orders.searchPlaceholder')} aria-label={t('dashboard.factory.orders.searchPlaceholder')} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t('dashboard.factory.orders.thStatus')}>
            {statusOptions.map((s) => <option key={s} value={s}>{s === 'all' ? t('dashboard.factory.orders.filterAll') : stageLabel(s)}</option>)}
          </select>
          <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label={t('dashboard.factory.orders.thCountry')}>
            <option value="all">{t('dashboard.factory.orders.filterAll')}</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {hasFilters && (
            <button type="button" className="btn sm ghost" onClick={() => { setQuery(''); setStatus('all'); setCountry('all'); }}>
              <i className="ri-close-line" /> {t('dashboard.factory.orders.clearFilters')}
            </button>
          )}
          <span className="small muted audit-count">{t('dashboard.factory.orders.count', { count: filtered.length, total: d.factoryOrders.length })}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty"><i className="ri-inbox-line" /><div>{t('dashboard.factory.orders.noResults')}</div></div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('dashboard.factory.orders.thOrder')}</th>
                  <th>{t('dashboard.factory.orders.thBuyer')}</th>
                  <th>{t('dashboard.factory.orders.thProduct')}</th>
                  <th>{t('dashboard.factory.orders.thQty')}</th>
                  <th>{t('dashboard.factory.orders.thDue')}</th>
                  <th>{t('dashboard.factory.orders.thShip')}</th>
                  <th>{t('dashboard.factory.orders.thStatus')}</th>
                  <th>{t('dashboard.factory.orders.trackingLabel')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const s = stageOf(o.id);
                  const rec = ops.orders[o.id];
                  const next = nextStageOf(s);
                  return (
                    <tr key={o.id} className={active === o.id ? 'sel' : ''}>
                      <td className="strong">{o.id}</td>
                      <td>{o.buyer} <span className="muted small">· {o.country}</span></td>
                      <td className="muted small">{o.product}</td>
                      <td className="strong">{o.qty}</td>
                      <td className="muted small">{o.due}</td>
                      <td className="muted small">{o.ship}</td>
                      <td><Pill tone={orderTone(s)}>{stageLabel(s)}</Pill></td>
                      <td className="muted small">{rec?.tracking ? <span className="track-chip"><i className="ri-barcode-line" /> {rec.tracking}</span> : '—'}</td>
                      <td>
                        <div className="row-between" style={{ gap: 6 }}>
                          <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.orders.detailsTitle')} onClick={() => { setActive(o.id); setNote(rec?.note ?? ''); }}><i className="ri-eye-line" /></button>
                          {next && <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.orders.advance')} onClick={() => advance(o.id)}><i className="ri-arrow-left-line" /></button>}
                          {s === 'ready' && <button type="button" className="btn sm primary" aria-label={t('dashboard.factory.orders.createShipment')} onClick={() => createShipment(o)}><i className="ri-truck-line" /></button>}
                          <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.orders.printLabel')} onClick={() => printLabel(o)}><i className="ri-printer-line" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!activeOrder} onClose={() => setActive(null)} title={t('dashboard.factory.orders.detailsTitle')} sub={t('dashboard.factory.orders.detailsSub', { id: active ?? '' })}>
        {activeOrder && (() => {
          const s = stageOf(activeOrder.id);
          const next = nextStageOf(s);
          return (
            <>
              <div className="od-kv">
                <div><div className="small muted">{t('dashboard.factory.orders.buyerLabel')}</div><div className="strong">{activeOrder.buyer} · {activeOrder.country}</div></div>
                <div><div className="small muted">{t('dashboard.factory.orders.productLabel')}</div><div className="strong">{activeOrder.product}</div></div>
                <div><div className="small muted">{t('dashboard.factory.orders.qtyLabel')}</div><div className="strong">{activeOrder.qty}</div></div>
                <div><div className="small muted">{t('dashboard.factory.orders.dueLabel')}</div><div className="strong">{activeOrder.due}</div></div>
                <div><div className="small muted">{t('dashboard.factory.orders.shipLabel')}</div><div className="strong">{activeOrder.ship}</div></div>
                <div><div className="small muted">{t('dashboard.factory.orders.statusLabel')}</div><Pill tone={orderTone(s)}>{stageLabel(s)}</Pill></div>
              </div>
              {activeRec?.tracking && (
                <div className="code-box mb">
                  <div>
                    <div className="small muted">{t('dashboard.factory.orders.trackingLabel')}</div>
                    <div className="val">{activeRec.tracking}</div>
                  </div>
                </div>
              )}
              <div className="divider" />
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>{t('dashboard.factory.orders.timelineTitle')}</h3>
              {(activeRec?.timeline?.length ?? 0) === 0 ? (
                <div className="note mb"><i className="ri-information-line" /><span>{t('dashboard.factory.orders.timelineEmpty')}</span></div>
              ) : (
                <div className="tl mb">
                  {activeRec!.timeline.map((ev, i) => (
                    <div className="tl-item done" key={`${ev.key}-${i}`}>
                      <div className="t">{t(`dashboard.factory.orders.event.${ev.key}`)}</div>
                      {ev.at ? <div className="s">{formatWhen(ev.at, i18n.language)}</div> : null}
                    </div>
                  ))}
                </div>
              )}
              <div className="field">
                <label htmlFor="o-note">{t('dashboard.factory.orders.noteLabel')}</label>
                <textarea id="o-note" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('dashboard.factory.orders.notePlaceholder')} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => { ops.setOrderNote(activeOrder.id, note); flash(t('dashboard.factory.orders.noteSavedToast')); }}><i className="ri-save-3-line" /> {t('dashboard.factory.orders.saveNote')}</button>
                {s === 'ready'
                  ? <button type="button" className="btn primary" onClick={() => createShipment(activeOrder)}><i className="ri-truck-line" /> {t('dashboard.factory.orders.createShipment')}</button>
                  : (next && <button type="button" className="btn primary" onClick={() => advance(activeOrder.id)}><i className="ri-arrow-left-line" /> {t('dashboard.factory.orders.advance')}</button>)}
                <button type="button" className="btn ghost" onClick={() => setActive(null)}>{t('dashboard.factory.orders.close')}</button>
              </div>
            </>
          );
        })()}
      </Modal>
      <Toast message={toast} />
    </>
  );
}

/* ----------------------------------------------------------------- deals */

function FactoryDeals() {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const ops = useFactoryOps();
  const { go } = useDashboardNav();
  const [toast, setToast] = useState('');
  const [docsFor, setDocsFor] = useState<string | null>(null);
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  const stageLabel = (key: string) => t(`dashboard.factory.deals.stage.${key}`);

  /* Merges the seeded deals with the persisted stage / documents the owner
     moved in this browser, so advancing a deal actually sticks. */
  const deals = d.factoryDeals.map((deal) => {
    const st = ops.deals[deal.buyer];
    const baseIdx = Math.max(0, DEAL_FLOW.indexOf((deal.stageKey ?? 'deposit') as DealStage));
    const stageIdx = st?.stageIdx ?? baseIdx;
    return {
      buyer: deal.buyer,
      value: deal.value,
      paid: deal.paid,
      stageKey: DEAL_FLOW[stageIdx] as string,
      stageIdx,
      docs: st?.docs ?? deal.docs,
      progress: Math.round((stageIdx / (DEAL_FLOW.length - 1)) * 100),
      events: st?.events ?? [],
      docKeys: st?.docKeys ?? [],
    };
  });

  const exportCsv = () => {
    downloadCsv(
      'factory-deals.csv',
      [
        t('dashboard.factory.deals.thBuyer'),
        t('dashboard.factory.deals.thValue'),
        t('dashboard.factory.deals.thPaid'),
        t('dashboard.factory.deals.thStage'),
        t('dashboard.factory.deals.thProgress'),
        t('dashboard.factory.deals.thDocs'),
      ],
      deals.map((x) => [x.buyer, x.value, x.paid, stageLabel(x.stageKey), `${x.progress}%`, String(x.docs)]),
    );
    flash(t('dashboard.common.exportedFile', { file: 'factory-deals.csv' }));
  };

  /* Advances a deal one real stage along the flow and persists it. The move is
     recorded in the audit log with the acting user. */
  const advance = (buyer: string, stageIdx: number) => {
    if (stageIdx >= DEAL_FLOW.length - 1) { flash(t('dashboard.factory.deals.updatedToast')); return; }
    ops.setDealStage(buyer, stageIdx + 1, d.factoryUser.name);
    flash(t('dashboard.factory.deals.advancedToast'));
  };

  const docDefs = [
    { key: 'contract', label: t('dashboard.factory.deals.docContract') },
    { key: 'invoice', label: t('dashboard.factory.deals.docInvoice') },
    { key: 'packing', label: t('dashboard.factory.deals.docPacking') },
    { key: 'origin', label: t('dashboard.factory.deals.docOrigin') },
    { key: 'halal', label: t('dashboard.factory.deals.docHalal') },
  ];

  /* Generates a real, downloadable deal document and records it once. */
  const generateDoc = (deal: { buyer: string; value: string; paid: string; stageKey: string }, key: string, label: string) => {
    downloadFile(`deal-${deal.buyer}-${key}.txt`, [
      label,
      `${t('dashboard.factory.deals.thBuyer')}: ${deal.buyer}`,
      `${t('dashboard.factory.deals.thValue')}: ${deal.value}`,
      `${t('dashboard.factory.deals.thPaid')}: ${deal.paid}`,
      `${t('dashboard.factory.deals.thStage')}: ${stageLabel(deal.stageKey)}`,
      `${d.factoryUser.factory} · ${d.factoryUser.country}`,
    ].join('\n'));
    ops.addDealDoc(deal.buyer, key);
    flash(t('dashboard.factory.deals.docDownloadedToast'));
  };

  const generateAll = (deal: { buyer: string; value: string; paid: string; stageKey: string }) => {
    docDefs.forEach((doc) => generateDoc(deal, doc.key, doc.label));
    flash(t('dashboard.factory.deals.docsGeneratedToast'));
  };

  const docsDeal = docsFor ? deals.find((x) => x.buyer === docsFor) ?? null : null;

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.deals.title')}
        sub={t('dashboard.factory.deals.sub')}
        actions={<button type="button" className="btn ghost" onClick={exportCsv}><i className="ri-download-2-line" /> {t('dashboard.common.export')}</button>}
      />
      <div className="grid c3">
        {deals.map((deal) => (
          <Card key={deal.buyer}>
            <div className="card-head">
              <div>
                <h3>{deal.buyer}</h3>
                <div className="sub">{deal.value}</div>
              </div>
              <Pill tone="info">{stageLabel(deal.stageKey)}</Pill>
            </div>
            <div className="mb">
              <div className="row-between small mb" style={{ marginBottom: 6 }}>
                <span className="muted">{t('dashboard.factory.deals.thPaid')}</span>
                <span className="strong accent">{deal.paid}</span>
              </div>
              <Bar value={deal.progress} />
            </div>
            <div className="row-between small mb" style={{ marginBottom: 12 }}>
              <span className="muted">{t('dashboard.factory.deals.thDocs')}</span>
              <span className="strong">{deal.docs}</span>
            </div>
            <div className="stack" style={{ gap: 8 }}>
              <button type="button" className="btn sm ghost block" disabled={deal.stageIdx >= DEAL_FLOW.length - 1} onClick={() => advance(deal.buyer, deal.stageIdx)}><i className="ri-arrow-left-line" /> {t('dashboard.factory.deals.advanceStage')}</button>
              <button type="button" className="btn sm ghost block" onClick={() => setDocsFor(deal.buyer)}><i className="ri-file-list-3-line" /> {t('dashboard.factory.deals.docsBtn')}</button>
              <button type="button" className="btn sm ghost block" onClick={() => { setContractIntent({ role: 'factory', buyer: deal.buyer }); go('f-contracts'); }}><i className="ri-file-paper-2-line" /> {t('dashboard.contracts.fromDeal')}</button>
              <button type="button" className="btn sm primary block" onClick={() => flash(t('dashboard.factory.deals.paymentToast'))}><i className="ri-money-dollar-circle-line" /> {t('dashboard.factory.deals.requestPayment')}</button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!docsDeal} onClose={() => setDocsFor(null)} title={t('dashboard.factory.deals.docsTitle')} sub={t('dashboard.factory.deals.docsSub', { name: docsDeal?.buyer ?? '' })}>
        {docsDeal && (
          <>
            <div className="list mb">
              {docDefs.map((doc) => (
                <div className="list-row" key={doc.key}>
                  <div className="ic"><i className="ri-file-text-line" /></div>
                  <div className="body">
                    <div className="t small">{doc.label}</div>
                    <div className="s">{stageLabel(docsDeal.stageKey)}</div>
                  </div>
                  <div className="end">
                    <button type="button" className="btn sm ghost" onClick={() => generateDoc(docsDeal, doc.key, doc.label)}>
                      <i className="ri-download-2-line" /> {t('dashboard.factory.deals.downloadDoc')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="divider" />
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>{t('dashboard.factory.deals.timelineTitle')}</h3>
            {docsDeal.events.length === 0 ? (
              <div className="note mb"><i className="ri-information-line" /><span>{t('dashboard.factory.deals.timelineEmpty')}</span></div>
            ) : (
              <div className="tl mb">
                {docsDeal.events.map((ev, i) => (
                  <div className="tl-item done" key={`${ev.key}-${i}`}>
                    <div className="t">{stageLabel(ev.key)}</div>
                    {ev.at ? <div className="s">{formatWhen(ev.at, i18n.language)}</div> : null}
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="btn primary" onClick={() => generateAll(docsDeal)}><i className="ri-magic-line" /> {t('dashboard.factory.deals.generateAll')}</button>
              <button type="button" className="btn ghost" onClick={() => setDocsFor(null)}>{t('dashboard.common.close')}</button>
            </div>
          </>
        )}
      </Modal>
      <Toast message={toast} />
    </>
  );
}

/* -------------------------------------------------------------- shipping */

function FactoryShipping() {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const ops = useFactoryOps();
  const [toast, setToast] = useState('');
  const [active, setActive] = useState<string | null>(null);
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  interface Row {
    id: string;
    carrier: string;
    country: string;
    label: string;
    tone: string;
    tracking: string;
    pickup: string;
    events: ShipmentEvent[];
    statusKey: ShipmentStatus | null;
    orderId?: string;
    isCreated: boolean;
  }

  /* The desk merges the seeded shipments (with their stored schedule/delivery
     state) and every shipment the owner generated from a retail order. */
  const rows: Row[] = [
    ...d.factoryShipments.map((s) => {
      const p = ops.shipmentPatches[s.id];
      return {
        id: s.id,
        carrier: p?.courier || s.carrier,
        country: s.country,
        label: p ? t(`dashboard.factory.shipping.status.${p.status}`) : s.status,
        tone: p ? shipmentTone(p.status) : s.tone,
        tracking: p?.tracking ?? '',
        pickup: s.pickup,
        events: p?.events ?? [],
        statusKey: (p?.status ?? null) as ShipmentStatus | null,
        isCreated: false,
      };
    }),
    ...ops.createdShipments.map((s) => ({
      id: s.id,
      carrier: s.carrier,
      country: s.country,
      label: t(`dashboard.factory.shipping.status.${s.status}`),
      tone: shipmentTone(s.status),
      tracking: s.tracking,
      pickup: '',
      events: s.events,
      statusKey: s.status,
      orderId: s.orderId,
      isCreated: true,
    })),
  ];

  const schedule = (row: Row) => {
    ops.scheduleShipment(row.id, row.carrier);
    flash(t('dashboard.factory.shipping.scheduleToast'));
  };

  const deliver = (row: Row) => {
    if (row.statusKey === 'delivered') { flash(t('dashboard.factory.shipping.alreadyDelivered')); return; }
    if (row.isCreated) ops.advanceCreatedShipment(row.id, 'delivered');
    else ops.deliverShipment(row.id);
    flash(t('dashboard.factory.shipping.deliveredToast'));
  };

  const activeRow = active ? rows.find((r) => r.id === active) : null;

  const exportCsv = () => {
    downloadCsv(
      'factory-shipping.csv',
      [
        t('dashboard.factory.shipping.thId'),
        t('dashboard.factory.shipping.thCarrier'),
        t('dashboard.factory.shipping.thCountry'),
        t('dashboard.factory.shipping.thStatus'),
        t('dashboard.factory.shipping.thTracking'),
        t('dashboard.factory.shipping.thPickup'),
      ],
      rows.map((s) => [s.id, s.carrier, s.country, s.label, s.tracking, s.pickup]),
    );
    flash(t('dashboard.common.exportedFile', { file: 'factory-shipping.csv' }));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.shipping.title')}
        sub={t('dashboard.factory.shipping.sub')}
        actions={<button type="button" className="btn ghost" onClick={exportCsv}><i className="ri-download-2-line" /> {t('dashboard.common.export')}</button>}
      />
      <Card className="mb">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('dashboard.factory.shipping.thId')}</th>
                <th>{t('dashboard.factory.shipping.thCarrier')}</th>
                <th>{t('dashboard.factory.shipping.thCountry')}</th>
                <th>{t('dashboard.factory.shipping.thStatus')}</th>
                <th>{t('dashboard.factory.shipping.thTracking')}</th>
                <th>{t('dashboard.factory.shipping.thPickup')}</th>
                <th>{t('dashboard.factory.shipping.thActions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={active === row.id ? 'sel' : ''}>
                  <td className="strong">{row.id}</td>
                  <td>{row.carrier}</td>
                  <td>{row.country}</td>
                  <td><Pill tone={row.tone}>{row.label}</Pill></td>
                  <td className="muted small">{row.tracking ? <span className="track-chip"><i className="ri-barcode-line" /> {row.tracking}</span> : <span className="muted">{t('dashboard.factory.shipping.noTracking')}</span>}</td>
                  <td className="muted small">{row.pickup || '—'}</td>
                  <td>
                    <div className="row-between" style={{ gap: 6 }}>
                      <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.shipping.detailTitle')} onClick={() => setActive(row.id)}><i className="ri-eye-line" /></button>
                      {row.statusKey !== 'delivered' && <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.shipping.schedule')} onClick={() => schedule(row)}><i className="ri-calendar-line" /></button>}
                      {row.statusKey === 'scheduled' && <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.shipping.confirmDelivery')} onClick={() => deliver(row)}><i className="ri-checkbox-circle-line" /></button>}
                      <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.shipping.printLabel')} onClick={() => flash(t('dashboard.factory.shipping.labelToast'))}><i className="ri-printer-line" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={t('dashboard.factory.shipping.packagingTitle')} sub={t('dashboard.factory.shipping.packagingSub')}>
        <div className="list">
          {d.factoryPackaging.map((p) => (
            <div className="list-row" key={p.country}>
              <div className="ic"><i className="ri-box-3-line" /></div>
              <div className="body">
                <div className="t">{p.country}</div>
                <div className="s">{p.note}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={!!activeRow} onClose={() => setActive(null)} title={t('dashboard.factory.shipping.detailTitle')} sub={t('dashboard.factory.shipping.detailSub', { id: activeRow?.id ?? '' })}>
        {activeRow && (
          <>
            <div className="od-kv">
              <div><div className="small muted">{t('dashboard.factory.shipping.courierLabel')}</div><div className="strong">{activeRow.carrier}</div></div>
              <div><div className="small muted">{t('dashboard.factory.shipping.thCountry')}</div><div className="strong">{activeRow.country}</div></div>
              <div><div className="small muted">{t('dashboard.factory.shipping.thStatus')}</div><Pill tone={activeRow.tone}>{activeRow.label}</Pill></div>
              <div><div className="small muted">{t('dashboard.factory.shipping.trackingLabel')}</div><div className="strong">{activeRow.tracking || '—'}</div></div>
            </div>
            {activeRow.orderId && (
              <div className="note mb"><i className="ri-file-list-3-line" /><span>{t('dashboard.factory.shipping.fromOrder')}: <strong>{activeRow.orderId}</strong></span></div>
            )}
            <div className="divider" />
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>{t('dashboard.factory.shipping.timelineTitle')}</h3>
            {activeRow.events.length === 0 ? (
              <div className="note mb"><i className="ri-information-line" /><span>{t('dashboard.factory.shipping.timelineEmpty')}</span></div>
            ) : (
              <div className="tl mb">
                {activeRow.events.map((ev, i) => (
                  <div className="tl-item done" key={`${ev.key}-${i}`}>
                    <div className="t">{t(`dashboard.factory.shipping.event.${ev.key}`)}</div>
                    {ev.at ? <div className="s">{formatWhen(ev.at, i18n.language)}</div> : null}
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              {!activeRow.statusKey && <button type="button" className="btn primary" onClick={() => schedule(activeRow)}><i className="ri-calendar-line" /> {t('dashboard.factory.shipping.schedule')}</button>}
              {activeRow.statusKey === 'scheduled' && <button type="button" className="btn primary" onClick={() => deliver(activeRow)}><i className="ri-checkbox-circle-line" /> {t('dashboard.factory.shipping.confirmDelivery')}</button>}
              <button type="button" className="btn ghost" onClick={() => setActive(null)}>{t('dashboard.common.close')}</button>
            </div>
          </>
        )}
      </Modal>
      <Toast message={toast} />
    </>
  );
}

/* --------------------------------------------------------------- returns */

function FactoryReturns() {
  const { t } = useTranslation();
  const d = useDashboard();
  const [open, setOpen] = useState(false);
  const [evidence, setEvidence] = useState('');
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  const exportCsv = () => {
    downloadCsv(
      'factory-returns.csv',
      [
        t('dashboard.factory.returns.thId'),
        t('dashboard.factory.returns.thOrder'),
        t('dashboard.factory.returns.thItem'),
        t('dashboard.factory.returns.thReason'),
        t('dashboard.factory.returns.thAmount'),
        t('dashboard.factory.returns.thDeadline'),
        t('dashboard.factory.returns.thStatus'),
      ],
      d.factoryReturns.map((r) => [r.id, r.order, r.item, r.reason, r.amount, r.deadline, r.status]),
    );
    flash(t('dashboard.common.exportedFile', { file: 'factory-returns.csv' }));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.returns.title')}
        sub={t('dashboard.factory.returns.sub')}
        actions={<button type="button" className="btn ghost" onClick={exportCsv}><i className="ri-download-2-line" /> {t('dashboard.common.export')}</button>}
      />
      <Card>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('dashboard.factory.returns.thId')}</th>
                <th>{t('dashboard.factory.returns.thOrder')}</th>
                <th>{t('dashboard.factory.returns.thItem')}</th>
                <th>{t('dashboard.factory.returns.thReason')}</th>
                <th>{t('dashboard.factory.returns.thAmount')}</th>
                <th>{t('dashboard.factory.returns.thDeadline')}</th>
                <th>{t('dashboard.factory.returns.thStatus')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {d.factoryReturns.map((r) => (
                <tr key={r.id}>
                  <td className="strong">{r.id}</td>
                  <td className="muted small">{r.order}</td>
                  <td>{r.item}</td>
                  <td className="muted small">{r.reason}</td>
                  <td className="strong accent">{r.amount}</td>
                  <td className="muted small">{r.deadline}</td>
                  <td><Pill tone={r.tone}>{r.status}</Pill></td>
                  <td>
                    <div className="row-between" style={{ gap: 6 }}>
                      <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.returns.accept')} onClick={() => flash(t('dashboard.factory.returns.acceptedToast'))}><i className="ri-check-line" /></button>
                      <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.returns.reply')} onClick={() => setOpen(true)}><i className="ri-reply-line" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={t('dashboard.factory.returns.modalTitle')} sub={t('dashboard.factory.returns.modalSub')}>
        <div className="field">
          <label htmlFor="ev">{t('dashboard.factory.returns.evidenceLabel')}</label>
          <textarea id="ev" maxLength={500} value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder={t('dashboard.factory.returns.evidencePlaceholder')} />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={() => { setOpen(false); setEvidence(''); flash(t('dashboard.factory.returns.repliedToast')); }}>{t('dashboard.factory.returns.send')}</button>
          <button type="button" className="btn ghost" onClick={() => setOpen(false)}>{t('dashboard.common.cancel')}</button>
        </div>
      </Modal>
      <Toast message={toast} />
    </>
  );
}

/* ------------------------------------------------------------- marketing */

function FactoryMarketing() {
  const { t } = useTranslation();
  const d = useDashboard();
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.marketing.title')}
        sub={t('dashboard.factory.marketing.sub')}
      />

      <Card title={t('dashboard.factory.marketing.campaignsTitle')} sub={t('dashboard.factory.marketing.campaignsSub')} className="mb">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('dashboard.factory.marketing.thName')}</th>
                <th>{t('dashboard.factory.marketing.thPeriod')}</th>
                <th>{t('dashboard.factory.marketing.thCountries')}</th>
                <th>{t('dashboard.factory.marketing.thBoost')}</th>
                <th>{t('dashboard.factory.marketing.thStatus')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {d.factoryCampaigns.map((c) => (
                <tr key={c.name}>
                  <td className="strong">{c.name}</td>
                  <td className="muted small">{c.period}</td>
                  <td>{c.countries}</td>
                  <td className="strong accent">{c.boost}</td>
                  <td><Pill tone={c.tone}>{c.status}</Pill></td>
                  <td>
                    <button type="button" className="btn sm primary" disabled={c.tone !== 'ok'} onClick={() => flash(t('dashboard.factory.marketing.joinedToast'))}>{t('dashboard.factory.marketing.join')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="split mb">
        <Card title={t('dashboard.factory.marketing.boostTitle')} sub={t('dashboard.factory.marketing.boostSub')}>
          <p className="small muted mb">{t('dashboard.factory.marketing.boostText')}</p>
          <button type="button" className="btn primary block" onClick={() => flash(t('dashboard.factory.marketing.boostToast'))}>
            <i className="ri-rocket-2-line" /> {t('dashboard.factory.marketing.boostCta')}
          </button>
        </Card>

        <Card title={t('dashboard.factory.marketing.samplesTitle')} sub={t('dashboard.factory.marketing.samplesSub')}>
          <div className="list">
            {d.factorySamples.map((s) => (
              <div className="list-row" key={`${s.buyer}-${s.product}`}>
                <div className="ic"><i className="ri-gift-line" /></div>
                <div className="body">
                  <div className="t small">{s.buyer} · {s.product}</div>
                  <div className="s">{s.city}</div>
                </div>
                <div className="end">
                  {s.tone === 'warn'
                    ? <button type="button" className="btn sm primary" onClick={() => flash(t('dashboard.factory.marketing.sampleToast'))}>{t('dashboard.factory.marketing.approve')}</button>
                    : <Pill tone={s.tone}>{s.status}</Pill>}
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

/* -------------------------------------------------------------- messages */

function FactoryMessages() {
  const { t } = useTranslation();
  const d = useDashboard();
  const [active, setActive] = useState(0);
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState<{ from: string; text: string; time: string }[]>([]);
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  const send = () => {
    if (!draft.trim()) return;
    setSent((prev) => [...prev, { from: 'me', text: draft.trim(), time: t('dashboard.common.now') }]);
    setDraft('');
    flash(t('dashboard.factory.messages.sentToast'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.messages.title')}
        sub={t('dashboard.factory.messages.sub')}
      />
      <div className="split wide">
        <Card title={t('dashboard.factory.messages.threads')}>
          <div className="list">
            {d.factoryThreads.map((th, i) => (
              <button type="button" key={th.name} className={`list-row ${active === i ? 'sel' : ''}`} style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'start' }} onClick={() => setActive(i)}>
                <div className="ic"><i className="ri-user-3-line" /></div>
                <div className="body">
                  <div className="t small">{th.name}</div>
                  <div className="s">{th.last}</div>
                </div>
                <div className="end">
                  {th.unread && <Pill tone="warn">{th.time}</Pill>}
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card title={d.factoryThreads[active]?.name ?? ''} sub={t('dashboard.factory.messages.liveTranslation')}>
          <div className="stack mb" style={{ gap: 10 }}>
            {d.factoryChat.map((m, i) => (
              <div key={i} className="note" style={{ justifyContent: m.from === 'me' ? 'flex-start' : 'flex-end' }}>
                <i className={m.from === 'me' ? 'ri-reply-line' : 'ri-question-answer-line'} />
                <span>{m.text}<span className="muted small"> · {m.time}</span></span>
              </div>
            ))}
            {sent.map((m, i) => (
              <div key={`s-${i}`} className="note" style={{ justifyContent: 'flex-start' }}>
                <i className="ri-reply-line" />
                <span>{m.text}<span className="muted small"> · {m.time}</span></span>
              </div>
            ))}
          </div>
          <div className="code-box">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder={t('dashboard.factory.messages.draftPlaceholder')}
              aria-label={t('dashboard.factory.messages.draftAria')}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: 'inherit', fontSize: 14 }}
            />
            <button type="button" className="btn sm primary" onClick={send}><i className="ri-send-plane-2-line" /></button>
          </div>
        </Card>
      </div>
      <Toast message={toast} />
    </>
  );
}

/* ------------------------------------------------------------------ team */

function FactoryTeam() {
  const { t } = useTranslation();
  const d = useDashboard();
  const ops = useFactoryOps();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(() => t('dashboard.factory.team.roleSales'));
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  /* The team list falls back to the mock on first use, then every change is
     persisted so invited members and status toggles survive a reload. */
  const list = ops.team ?? d.factoryTeamList;

  const invite = () => {
    if (!email.trim()) { flash(t('dashboard.factory.team.emailRequired')); return; }
    ops.setTeam([...list, { name: email.split('@')[0], email: email.trim(), role, active: true }]);
    setEmail(''); setRole(t('dashboard.factory.team.roleSales')); setOpen(false);
    flash(t('dashboard.factory.team.invitedToast'));
  };

  const exportCsv = () => {
    downloadCsv(
      'factory-team.csv',
      [
        t('dashboard.factory.team.thName'),
        t('dashboard.factory.team.thEmail'),
        t('dashboard.factory.team.thRole'),
        t('dashboard.factory.team.thStatus'),
      ],
      list.map((m) => [m.name, m.email, m.role, m.active ? t('dashboard.factory.team.active') : t('dashboard.factory.team.disabled')]),
    );
    flash(t('dashboard.common.exportedFile', { file: 'factory-team.csv' }));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.team.title')}
        sub={t('dashboard.factory.team.sub')}
        actions={(
          <>
            <button type="button" className="btn ghost" onClick={exportCsv}><i className="ri-download-2-line" /> {t('dashboard.common.export')}</button>
            <button type="button" className="btn primary" onClick={() => setOpen(true)}><i className="ri-user-add-line" /> {t('dashboard.factory.team.invite')}</button>
          </>
        )}
      />
      <Card>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('dashboard.factory.team.thName')}</th>
                <th>{t('dashboard.factory.team.thEmail')}</th>
                <th>{t('dashboard.factory.team.thRole')}</th>
                <th>{t('dashboard.factory.team.thStatus')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((m, i) => (
                <tr key={`${m.email}-${i}`}>
                  <td className="strong">{m.name}</td>
                  <td className="muted small">{m.email}</td>
                  <td>{m.role}</td>
                  <td><Pill tone={m.active ? 'ok' : 'mute'}>{m.active ? t('dashboard.factory.team.active') : t('dashboard.factory.team.disabled')}</Pill></td>
                  <td>
                    <Switch
                      checked={m.active}
                      label={t('dashboard.factory.team.toggle')}
                      onChange={(v) => { ops.setTeam(list.map((x, xi) => (xi === i ? { ...x, active: v } : x))); flash(t('dashboard.factory.team.toggledToast')); }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={t('dashboard.factory.team.modalTitle')} sub={t('dashboard.factory.team.modalSub')}>
        <div className="field">
          <label htmlFor="tm-email">{t('dashboard.factory.team.emailLabel')}</label>
          <input id="tm-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('dashboard.factory.team.emailPlaceholder')} />
        </div>
        <div className="field">
          <label htmlFor="tm-role">{t('dashboard.factory.team.roleLabel')}</label>
          <select id="tm-role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value={t('dashboard.factory.team.roleSales')}>{t('dashboard.factory.team.roleSales')}</option>
            <option value={t('dashboard.factory.team.roleStock')}>{t('dashboard.factory.team.roleStock')}</option>
            <option value={t('dashboard.factory.team.roleShip')}>{t('dashboard.factory.team.roleShip')}</option>
          </select>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={invite}>{t('dashboard.factory.team.send')}</button>
          <button type="button" className="btn ghost" onClick={() => setOpen(false)}>{t('dashboard.common.cancel')}</button>
        </div>
      </Modal>
      <Toast message={toast} />
    </>
  );
}

/* ----------------------------------------------------------- subscription */

function FactorySubscription() {
  const { t } = useTranslation();
  const d = useDashboard();
  const sub = d.factorySubscription;
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.subscription.title')}
        sub={t('dashboard.factory.subscription.sub')}
        actions={<button type="button" className="btn primary" onClick={() => flash(t('dashboard.factory.subscription.upgradeToast'))}><i className="ri-vip-crown-2-line" /> {t('dashboard.factory.subscription.upgrade')}</button>}
      />
      <div className="split mb">
        <Card title={t('dashboard.factory.subscription.planTitle')} sub={`${t('dashboard.factory.subscription.renewLabel')} ${sub.renew}`}>
          <div className="row-between mb">
            <div className="stat" style={{ border: 'none', padding: 0 }}>
              <div className="num">{sub.plan}</div>
              <div className="lbl">{d.factoryUser.factory}</div>
            </div>
            <Pill tone="ok"><i className="ri-checkbox-circle-line" /> {t('dashboard.factory.join.done')}</Pill>
          </div>
          <div className="divider" />
          <div className="list">
            {sub.limits.map((l) => (
              <div className="list-row" key={l.label}>
                <div className="body"><div className="t small">{l.label}</div></div>
                <div className="end"><span className="strong">{l.value}</span></div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t('dashboard.factory.subscription.servicesTitle')}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('dashboard.factory.subscription.thService')}</th>
                  <th>{t('dashboard.factory.subscription.thStatus')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sub.services.map((s) => (
                  <tr key={s.name}>
                    <td className="strong">{s.name}</td>
                    <td><Pill tone={s.tone}>{s.status}</Pill></td>
                    <td><button type="button" className="btn sm ghost" onClick={() => flash(t('dashboard.factory.subscription.serviceToast'))}>{t('dashboard.factory.subscription.requestService')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <Toast message={toast} />
    </>
  );
}

/* -------------------------------------------------------------- settings */

function FactorySettings() {
  const { t } = useTranslation();
  const d = useDashboard();
  const s = d.factorySettings;
  const [pickup, setPickup] = useState(s.pickup);
  const [hours, setHours] = useState(s.hours);
  const [notifs, setNotifs] = useState(() => s.notifications.map((n) => ({ ...n })));
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.settings.title')}
        sub={t('dashboard.factory.settings.sub')}
        actions={<button type="button" className="btn primary" onClick={() => flash(t('dashboard.factory.settings.savedToast'))}><i className="ri-save-3-line" /> {t('dashboard.factory.settings.save')}</button>}
      />
      <div className="split mb">
        <Card>
          <div className="field">
            <label htmlFor="st-pickup">{t('dashboard.factory.settings.pickupLabel')}</label>
            <input id="st-pickup" value={pickup} onChange={(e) => setPickup(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="st-hours">{t('dashboard.factory.settings.hoursLabel')}</label>
            <input id="st-hours" value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="st-bank">{t('dashboard.factory.finance.bankLabel')}</label>
            <input id="st-bank" defaultValue={d.factoryFinance.bank} readOnly />
          </div>
        </Card>

        <div className="stack">
          <Card title={t('dashboard.factory.settings.notifTitle')} sub={t('dashboard.factory.settings.notifSub')}>
            <div className="list">
              {notifs.map((n, i) => (
                <div className="list-row" key={n.label}>
                  <div className="body">
                    <div className="t small">{n.label}</div>
                    <div className="s">{n.channels}</div>
                  </div>
                  <div className="end">
                    <Switch checked={n.on} label="" onChange={(v) => setNotifs((prev) => prev.map((x, xi) => (xi === i ? { ...x, on: v } : x)))} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title={t('dashboard.factory.settings.apiTitle')} sub={t('dashboard.factory.settings.apiSub')}>
            <div className="code-box mb">
              <div>
                <div className="small muted">{s.api.label}</div>
                <div className="val">{s.api.key}</div>
              </div>
            </div>
            <div className="row-between" style={{ gap: 8 }}>
              <button type="button" className="btn sm ghost" onClick={() => flash(t('dashboard.factory.settings.copiedToast'))}><i className="ri-file-copy-line" /> {t('dashboard.factory.settings.copy')}</button>
              <button type="button" className="btn sm ghost" onClick={() => flash(t('dashboard.factory.settings.regenToast'))}><i className="ri-refresh-line" /> {t('dashboard.factory.settings.regenerate')}</button>
            </div>
          </Card>
        </div>
      </div>
      <Toast message={toast} />
    </>
  );
}

export const factoryMoreViews: Record<string, FunctionComponent> = {
  'f-orders': FactoryOrders,
  'f-deals': FactoryDeals,
  'f-shipping': FactoryShipping,
  'f-returns': FactoryReturns,
  'f-marketing': FactoryMarketing,
  'f-messages': FactoryMessages,
  'f-team': FactoryTeam,
  'f-subscription': FactorySubscription,
  'f-settings': FactorySettings,
  ...factoryRfqViews,
  ...factoryFinanceViews,
  ...factoryAnalyticsViews,
  ...factoryAuditViews,
};