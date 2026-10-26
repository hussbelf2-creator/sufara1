import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Order } from '@/pages/shop/types';
import { formatDate, formatDateTime } from '@/pages/shop/lib/format';
import { advanceStatus, isAir, laneOf, trackState } from '@/pages/shop/lib/tracking';
import { useShipmentFeed } from '@/hooks/useShipmentFeed';
import ClearanceTask from './ClearanceTask';

/* Live shipment tracking: a lane summary, an animated progress bar, a map of
   the destination and a milestone timeline whose steps depend on the shipping
   method the buyer chose at checkout. When the export desk schedules a pickup
   or confirms a delivery, the shipment's real carrier and status are read from
   the live shipment feed so the buyer sees them here instantly. */
export default function TrackingPanel({ order }: { order: Order }) {
  const { t } = useTranslation();
  const feed = useShipmentFeed();
  const record = feed[order.tracking];
  const effectiveStatus = record ? advanceStatus(order.status, record.orderStatus) : order.status;
  const { points, progress } = useMemo(
    () => trackState({ ...order, status: effectiveStatus }),
    [order, effectiveStatus, t],
  );
  const lane = laneOf(order);
  const pct = Math.round(progress * 100);
  const nextPoint = points.find((p) => !p.done);
  const air = isAir(order.shippingMethod);

  /* Who is responsible for destination clearance, and whether the shipment is
     sitting in destination customs waiting for the buyer to clear it. A DDP
     order (or an order where Safeer is the importer of record) is handled here;
     CIF / FOB leaves the clearance and the duties with the buyer. */
  const platformClears = order.incoterm === 'DDP' || /Safeer|سفير/i.test(order.customsParty ?? '');
  const customsLabel = order.customsParty
    || (platformClears ? t('shop.checkout.cpPlatform') : t('shop.checkout.cpBuyer'));
  const arrivedDone = points.find((p) => p.id === 'arrived')?.done ?? false;
  const deliveredDone = points.find((p) => p.id === 'delivered')?.done ?? false;
  /* Once the shipment has left Jeddah, a CIF/FOB order depends on the buyer
     completing destination clearance. Warn as soon as it is on the way and
     keep the warning until it is delivered — never after delivery. */
  const departedOrigin = progress >= 0.52;
  const buyerClearancePending = departedOrigin && !deliveredDone && !platformClears;

  /* The live station log: real milestones written by the shipping desk (with
     their exact time) newest first. Before any desk update we fall back to the
     reached checkpoints so the log is never empty. */
  const liveItems = record && record.events.length
    ? [...record.events].reverse().map((e) => ({ key: `${e.at}-${e.label}`, label: e.label, at: e.at }))
    : [...points].reverse().filter((p) => p.done).map((p) => ({ key: p.id, label: p.label, at: p.at }));
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(`${order.city} ${order.country}`)}&z=4&output=embed`;

  return (
    <section className="st-track">
      <header className="st-track-head">
        <div>
          <h3>{t('orders.track.title')}</h3>
          <p className="sub">
            {air ? t('orders.track.methodAir') : t('orders.track.methodSea')} · {t('orders.track.trackingNo', { tracking: order.tracking })}
          </p>
          {record && (
            <span className="st-order-status tone-transit" style={{ marginTop: 8 }}>
              <i className="ri-broadcast-line" /> {t('orders.track.carrier', { carrier: record.carrier })}
            </span>
          )}
        </div>
        <div className="st-track-gauge">
          <b>{pct}%</b>
          <span>{t('orders.track.ofTrip')}</span>
        </div>
      </header>

      <div className="st-track-terms">
        <span className="chip term">
          <i className="ri-file-shield-2-line" />
          {t('orders.track.incotermBadge', { term: order.incoterm || '—' })}
        </span>
        <span className="chip">
          <i className="ri-user-received-2-line" />
          {t('orders.track.customsBadge', { party: customsLabel })}
        </span>
        <span className={`chip ${platformClears ? 'ok' : 'warn'}`}>
          <i className={platformClears ? 'ri-shield-check-line' : 'ri-shield-user-line'} />
          {platformClears ? t('orders.track.clearingSia') : t('orders.track.clearingBuyer')}
        </span>
      </div>

      {buyerClearancePending && (
        <div className="st-track-alert" role="status">
          <i className="ri-alert-line" />
          <div>
            <b>{arrivedDone ? t('orders.track.buyerClearTitle') : t('orders.track.buyerClearTransitTitle')}</b>
            <span>
              {arrivedDone
                ? t('orders.track.buyerClearText', { term: order.incoterm })
                : t('orders.track.buyerClearTransitText', { term: order.incoterm })}
            </span>
          </div>
        </div>
      )}

      {buyerClearancePending && (
        <ClearanceTask order={order} />
      )}

      <div className="st-track-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <i style={{ width: `${pct}%` }} />
      </div>

      <div className="st-lane">
        <div className="st-lane-node">
          <span className="ic"><i className="ri-map-pin-2-fill" /></span>
          <div className="tx"><b>{lane.originName}</b><span>{lane.originHub}</span></div>
        </div>
        <div className="st-lane-mid" aria-hidden="true">
          <span className="ln" />
          <i className={lane.originIcon} />
          <span className="ln" />
        </div>
        <div className="st-lane-node dest">
          <span className="ic"><i className="ri-flag-2-fill" /></span>
          <div className="tx"><b>{lane.destName}</b><span>{lane.destHub}</span></div>
        </div>
      </div>

      <div className="st-track-map">
        <iframe
          title={t('orders.track.mapTitle', { city: order.city })}
          src={mapSrc}
          referrerPolicy="no-referrer-when-downgrade"
        />
        <span className="pin"><i className="ri-truck-line" /> {t('orders.track.pin', { city: order.city })}</span>
      </div>

      <ol className="st-timeline">
        {points.map((p, i) => (
          <li key={p.id} className={p.done ? (p.current ? 'now' : 'done') : 'todo'}>
            <span className="dot">
              <i className={p.done ? (p.current ? 'ri-radar-line' : 'ri-check-line') : p.icon} />
            </span>
            <div className="body">
              <div className="row">
                <span className="t">{p.label}</span>
                <span className="d">{p.done ? formatDateTime(p.at) : t('orders.track.expect', { date: formatDate(p.at) })}</span>
              </div>
              <p className="x">{p.detail}</p>
            </div>
            {i < points.length - 1 && <span className="line" />}
          </li>
        ))}
      </ol>

      <section className="st-track-events">
        <div className="head">
          <h4><i className="ri-history-line" /> {t('orders.track.liveTitle')}</h4>
          <span className="sub">{t('orders.track.liveSub')}</span>
        </div>
        {liveItems.length === 0 ? (
          <p className="empty"><i className="ri-time-line" /> {t('orders.track.liveEmpty')}</p>
        ) : (
          <ol>
            {liveItems.map((e, i) => (
              <li key={e.key} className={i === 0 ? 'now' : ''}>
                <span className="dot"><i className={i === 0 ? 'ri-flashlight-fill' : 'ri-map-pin-2-line'} /></span>
                <div className="body">
                  <span className="lbl">{e.label}</span>
                  <span className="time">{formatDateTime(e.at)}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {nextPoint ? (
        <div className="st-track-next">
          <i className="ri-time-line" />
          <span>{t('orders.track.next', { label: nextPoint.label, date: formatDate(nextPoint.at) })}</span>
        </div>
      ) : (
        <div className="st-track-next done">
          <i className="ri-checkbox-circle-line" />
          <span>{t('orders.track.done')}</span>
        </div>
      )}
    </section>
  );
}