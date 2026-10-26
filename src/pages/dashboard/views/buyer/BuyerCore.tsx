import { useEffect, useState } from 'react';
import type { FunctionComponent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { useCatalog } from '@/hooks/useCatalog';
import { useDashboardNav } from '@/pages/dashboard/components/DashboardNav';
import { useCart } from '@/pages/shop/components/CartProvider';
import { useFavorites } from '@/pages/shop/components/FavoritesProvider';
import type { Product } from '@/pages/shop/types';
import RfqModal from '@/pages/shop/components/RfqModal';
import { setContractIntent } from '@/pages/dashboard/views/contracts/intent';
import { useBuyerExport } from '@/hooks/useBuyerExport';
import { loadJson, saveJson } from '@/pages/dashboard/lib/persist';
import { downloadFile } from '@/pages/dashboard/lib/download';
import { Card, Stat, Pill, Timeline, PageHead, Bar, Modal, Toast } from '@/pages/dashboard/components/ui';
import { DEAL_FLOW } from '@/pages/dashboard/lib/factoryStore';

/* Maps a dashboard order to a real storefront order (the live tracking page)
   and to a real catalogue product (one-click reorder). Keyed by the order id,
   so it works in both languages. */
const STORE_ID_BY_ORDER: Record<string, string> = {
  'SFR-20481': 'SFR-2026-47921',
  'SFR-20462': 'SFR-2026-36014',
  'SFR-20430': 'SFR-2026-47921',
};
const REORDER_ID_BY_ORDER: Record<string, string> = {
  'SFR-20481': 'dates-giftbox',
  'SFR-20462': 'oud-bakhoor',
  'SFR-20430': 'fashion-abaya',
};

function BuyerHome() {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const { go } = useDashboardNav();
  const { products } = useCatalog();
  const cart = useCart();
  const pkg = useBuyerExport();
  const [toast, setToast] = useState('');
  const isEn = (i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().match(/^(en|ur|id)/) !== null;

  const lastExportLabel = pkg.meta
    ? new Intl.DateTimeFormat(isEn ? 'en-GB' : 'ar-EG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(pkg.meta.at))
    : t('dashboard.buyerExport.never');

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2800);
  };

  const addToCart = (productId?: string, fallbackName?: string) => {
    const product = (products as Product[]).find((p) => p.id === productId);
    if (product) {
      cart.add(product);
      flash(t('dashboard.buyerHome.toCartToast', { name: product.name }));
    } else {
      flash(t('dashboard.buyerHome.toCartToast', { name: fallbackName ?? '' }));
    }
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.buyerHome.eyebrow')}
        title={t('dashboard.buyerHome.title')}
        sub={t('dashboard.buyerHome.sub')}
        actions={(
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn ghost"
              onClick={() => pkg.run()}
              disabled={pkg.busy}
              title={t('dashboard.buyerExport.hint')}
            >
              <i className={pkg.busy ? 'ri-loader-4-line pkg-busy-icon' : 'ri-folder-download-line'} />
              {pkg.busy ? t('dashboard.buyerExport.busy') : t('dashboard.buyerExport.button')}
            </button>
            <Link className="btn primary" to="/products">
              <i className="ri-shopping-bag-3-line" /> {t('dashboard.buyerHome.shopNow')}
            </Link>
          </div>
        )}
      />

      <div className="banner mb">
        <div>
          <h3>{t('dashboard.buyerHome.bannerTitle')}</h3>
          <p>{t('dashboard.buyerHome.bannerText')}</p>
        </div>
        <a className="btn" href="#amb"><i className="ri-share-forward-2-line" /> {t('dashboard.buyerHome.bannerCta')}</a>
      </div>

      <div className="grid c4 mb">
        {d.buyerStats.map((s) => <Stat key={s.lbl} icon={s.icon} num={s.num} lbl={s.lbl} />)}
      </div>

      <Card className="pkg-card mb">
        <div className="pkg-card-row">
          <div className="pkg-seal">
            <i className="ri-file-excel-2-line" aria-hidden="true" />
          </div>
          <div className="pkg-intro">
            <h3>{t('dashboard.buyerExport.cardTitle')}</h3>
            <p className="small muted">{t('dashboard.buyerExport.cardSub')}</p>
            {pkg.meta && (
              <p className="small muted pkg-sheets">
                {t('dashboard.buyerExport.sheetsValue', {
                  tickets: pkg.meta.counts?.tickets ?? 0,
                  orders: pkg.meta.counts?.orders ?? 0,
                  returns: pkg.meta.counts?.returns ?? 0,
                })}
              </p>
            )}
          </div>
          <div className="pkg-facts">
            <div className="pkg-fact">
              <span className="k">{t('dashboard.buyerExport.lastExport')}</span>
              <b className={pkg.meta ? 'v' : 'v muted'}>{lastExportLabel}</b>
            </div>
            <div className="pkg-fact">
              <span className="k">{t('dashboard.buyerExport.records')}</span>
              <b className="v accent">
                {pkg.meta ? t('dashboard.buyerExport.recordsValue', { count: pkg.meta.count }) : '—'}
              </b>
            </div>
          </div>
          <button
            type="button"
            className="btn primary"
            onClick={() => pkg.run()}
            disabled={pkg.busy}
            title={t('dashboard.buyerExport.hint')}
          >
            <i className={pkg.busy ? 'ri-loader-4-line pkg-busy-icon' : 'ri-download-2-line'} />
            {pkg.busy ? t('dashboard.buyerExport.busy') : t('dashboard.buyerExport.exportNow')}
          </button>
        </div>
        <p className="small muted pkg-hint">
          <i className="ri-information-line" aria-hidden="true" />
          {t('dashboard.buyerExport.cardHint')}
        </p>
      </Card>

      <div className="split mb">
        <Card
          title={t('dashboard.buyerHome.recentOrders')}
          sub={t('dashboard.buyerHome.recentOrdersSub')}
          action={<button type="button" className="link" onClick={() => go('orders')}>{t('dashboard.common.viewAll')}</button>}
        >
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('dashboard.buyerHome.thOrder')}</th>
                  <th>{t('dashboard.buyerHome.thDate')}</th>
                  <th>{t('dashboard.buyerHome.thFactory')}</th>
                  <th>{t('dashboard.buyerHome.thValue')}</th>
                  <th>{t('dashboard.buyerHome.thStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {d.buyerRecentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="strong">{o.id}</td>
                    <td className="muted">{o.date}</td>
                    <td>{o.factory}</td>
                    <td className="strong">{o.value}</td>
                    <td><Pill tone={o.tone}>{o.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={t('dashboard.buyerHome.overview')} sub={t('dashboard.buyerHome.overviewSub')}>
          <div className="list">
            <div className="list-row">
              <div className="ic"><i className="ri-wallet-3-line" /></div>
              <div className="body">
                <div className="t">{t('dashboard.buyerHome.commissionBalance')}</div>
                <div className="s">{t('dashboard.buyerHome.commissionBalanceSub')}</div>
              </div>
              <div className="end strong accent">١٨٤ ر.س</div>
            </div>
            <div className="list-row">
              <div className="ic"><i className="ri-medal-2-line" /></div>
              <div className="body">
                <div className="t">{t('dashboard.buyerHome.yourLevel')}</div>
                <div className="s">{t('dashboard.buyerHome.yourLevelSub')}</div>
              </div>
              <div className="end"><Pill tone="warn">{t('dashboard.buyerHome.levelCustomer')}</Pill></div>
            </div>
            <div className="list-row">
              <div className="ic"><i className="ri-truck-line" /></div>
              <div className="body">
                <div className="t">{t('dashboard.buyerHome.upcomingShipment')}</div>
                <div className="s">SFR-20481 — {d.buyerRecentOrders[0].factory}</div>
              </div>
              <div className="end"><Pill tone="info">٣ أيام</Pill></div>
            </div>
          </div>
        </Card>
      </div>

      <Card
        title={t('dashboard.buyerHome.recommendationTitle')}
        sub={t('dashboard.buyerHome.recommendationSub')}
      >
        <div className="grid c3" data-product-shop>
          {d.buyerRecommendations.map((p) => (
            <article className="pcard" key={p.name} data-product-shop>
              <img className="thumb" src={p.img} alt={p.name} />
              <div className="body">
                <div className="t">{p.name}</div>
                <div className="s">{p.factory}</div>
                <div className="price">{p.price}</div>
                <button type="button" className="btn sm primary" onClick={() => addToCart(p.productId, p.name)}>
                  <i className="ri-add-line" /> {t('dashboard.buyerHome.addToCart')}
                </button>
              </div>
            </article>
          ))}
        </div>
      </Card>

      <Toast message={toast || pkg.toast} />
    </>
  );
}

function BuyerOrders() {
  const { t } = useTranslation();
  const d = useDashboard();
  const { go } = useDashboardNav();
  const navigate = useNavigate();
  const { products } = useCatalog();
  const cart = useCart();
  const [sel, setSel] = useState(d.buyerOrders[0].id);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ status: 'all', factory: 'all' });
  const [draft, setDraft] = useState({ status: 'all', factory: 'all' });
  const [rateOpen, setRateOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [rateNote, setRateNote] = useState('');
  const [toast, setToast] = useState('');
  const order = d.buyerOrders.find((o) => o.id === sel) ?? d.buyerOrders[0];

  const statusOptions = Array.from(new Set(d.buyerOrders.map((o) => o.status)));
  const factoryOptions = Array.from(new Set(d.buyerOrders.map((o) => o.factory)));
  const filtered = d.buyerOrders.filter(
    (o) => (filters.status === 'all' || o.status === filters.status)
      && (filters.factory === 'all' || o.factory === filters.factory),
  );
  const activeFilters = (filters.status !== 'all' ? 1 : 0) + (filters.factory !== 'all' ? 1 : 0);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2800);
  };
  const openFilter = () => { setDraft(filters); setFilterOpen(true); };
  const applyFilter = () => { setFilters(draft); setFilterOpen(false); };
  const clearFilter = () => {
    setDraft({ status: 'all', factory: 'all' });
    setFilters({ status: 'all', factory: 'all' });
    flash(t('dashboard.buyerOrders.filtersClearedToast'));
  };

  const trace = () => navigate(`/orders/${STORE_ID_BY_ORDER[order.id] ?? order.id}`);

  const reorder = () => {
    const product = (products as Product[]).find((p) => p.id === REORDER_ID_BY_ORDER[order.id]);
    if (product) {
      cart.add(product);
      flash(t('dashboard.buyerOrders.reorderToast', { name: product.name }));
    }
  };

  const openRate = () => { setStars(0); setRateNote(''); setRateOpen(true); };
  const submitRate = () => {
    if (!stars) { flash(t('dashboard.buyerOrders.ratingRequired')); return; }
    setRateOpen(false);
    flash(t('dashboard.buyerOrders.ratingToast'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.buyerOrders.eyebrow')}
        title={t('dashboard.buyerOrders.title')}
        sub={t('dashboard.buyerOrders.sub')}
        actions={(
          <button type="button" className="btn ghost" onClick={openFilter}>
            <i className="ri-filter-3-line" /> {t('dashboard.common.filter')}{activeFilters > 0 ? ` (${activeFilters})` : ''}
          </button>
        )}
      />

      <div className="split">
        <Card title={t('dashboard.buyerOrders.allOrders')} sub={t('dashboard.buyerOrders.count', { count: filtered.length })}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('dashboard.buyerOrders.thOrder')}</th>
                  <th>{t('dashboard.buyerOrders.thDate')}</th>
                  <th>{t('dashboard.buyerOrders.thValue')}</th>
                  <th>{t('dashboard.buyerOrders.thStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    className={sel === o.id ? 'sel' : ''}
                    onClick={() => setSel(o.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="tbl-name">
                        <div>
                          <div className="t">{o.id}</div>
                          <div className="s">{t('dashboard.buyerOrders.rowItems', { factory: o.factory, count: o.items })}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted">{o.date}</td>
                    <td className="strong">{o.value}</td>
                    <td><Pill tone={o.tone}>{o.status}</Pill></td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={4} className="muted" style={{ textAlign: 'center', padding: '26px' }}>
                      {t('dashboard.buyerOrders.noResults')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={t('dashboard.buyerOrders.detailsOf', { id: order.id })} sub={`${order.factory} → ${order.country}`}>
          <Timeline items={order.timeline} />
          <div className="divider" />
          <div className="row-between wrap" style={{ gap: 8 }}>
            <button type="button" className="btn sm primary" onClick={trace}><i className="ri-map-pin-time-line" /> {t('dashboard.buyerOrders.trace')}</button>
            <button type="button" className="btn sm ghost" onClick={() => go('returns')}><i className="ri-arrow-go-back-line" /> {t('dashboard.buyerOrders.return')}</button>
            <button type="button" className="btn sm ghost" onClick={reorder}><i className="ri-refresh-line" /> {t('dashboard.buyerOrders.reorder')}</button>
            <button type="button" className="btn sm ghost" onClick={openRate}><i className="ri-star-line" /> {t('dashboard.buyerOrders.rate')}</button>
          </div>
        </Card>
      </div>

      <Modal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title={t('dashboard.buyerOrders.filterTitle')}
        sub={t('dashboard.buyerOrders.filterSub')}
      >
        <div className="field">
          <label htmlFor="flt-status">{t('dashboard.buyerOrders.statusLabel')}</label>
          <select id="flt-status" value={draft.status} onChange={(e) => setDraft((f) => ({ ...f, status: e.target.value }))}>
            <option value="all">{t('dashboard.buyerOrders.allStatuses')}</option>
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="flt-factory">{t('dashboard.buyerOrders.factoryLabel')}</label>
          <select id="flt-factory" value={draft.factory} onChange={(e) => setDraft((f) => ({ ...f, factory: e.target.value }))}>
            <option value="all">{t('dashboard.buyerOrders.allFactories')}</option>
            {factoryOptions.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={applyFilter}><i className="ri-filter-3-line" /> {t('dashboard.buyerOrders.applyFilter')}</button>
          <button type="button" className="btn ghost" onClick={clearFilter}>{t('dashboard.buyerOrders.clearFilter')}</button>
        </div>
      </Modal>

      <Modal
        open={rateOpen}
        onClose={() => setRateOpen(false)}
        title={t('dashboard.buyerOrders.ratingTitle')}
        sub={t('dashboard.buyerOrders.ratingSub', { id: order.id })}
      >
        <div className="rate-stars" role="radiogroup" aria-label={t('dashboard.buyerOrders.ratingTitle')}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`rate-star ${n <= stars ? 'is-on' : ''}`}
              onClick={() => setStars(n)}
              aria-label={`${n}`}
              aria-pressed={n <= stars}
            >
              <i className={n <= stars ? 'ri-star-fill' : 'ri-star-line'} />
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="rate-note">{t('dashboard.buyerOrders.ratingNoteLabel')}</label>
          <textarea
            id="rate-note"
            maxLength={500}
            value={rateNote}
            onChange={(e) => setRateNote(e.target.value)}
            placeholder={t('dashboard.buyerOrders.ratingNotePlaceholder')}
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={submitRate}><i className="ri-send-plane-2-line" /> {t('dashboard.buyerOrders.ratingSubmit')}</button>
          <button type="button" className="btn ghost" onClick={() => setRateOpen(false)}>{t('dashboard.common.cancel')}</button>
        </div>
      </Modal>

      <Toast message={toast} />
    </>
  );
}

function BuyerQuotes() {
  const { t } = useTranslation();
  const d = useDashboard();
  const [statuses, setStatuses] = useState<Record<string, 'negotiating' | 'accepted'>>({});
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [offer, setOffer] = useState({ price: '', qty: '', msg: '' });
  const [rfqOpen, setRfqOpen] = useState(false);
  const [toast, setToast] = useState('');

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2800);
  };

  const openNeg = (i: number) => {
    setOpenIdx(i);
    setOffer({ price: '', qty: '', msg: '' });
  };

  const submitOffer = () => {
    if (openIdx === null) return;
    const q = d.buyerQuotes[openIdx];
    setStatuses((s) => ({ ...s, [q.factory]: 'negotiating' }));
    setOpenIdx(null);
    flash(t('dashboard.buyerQuotes.negotiatingToast'));
  };

  const accept = (factory: string) => {
    setStatuses((s) => ({ ...s, [factory]: 'accepted' }));
    flash(t('dashboard.buyerQuotes.acceptedToast'));
  };

  const active = openIdx !== null ? d.buyerQuotes[openIdx] : null;

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.buyerQuotes.eyebrow')}
        title={t('dashboard.buyerQuotes.title')}
        sub={t('dashboard.buyerQuotes.sub')}
        actions={<button type="button" className="btn primary" onClick={() => setRfqOpen(true)}><i className="ri-add-line" /> {t('dashboard.buyerQuotes.requestQuote')}</button>}
      />
      <div className="grid c3">
        {d.buyerQuotes.map((q, i) => {
          const status = statuses[q.factory];
          return (
            <Card key={q.factory} className="tight">
              <div className="card-head">
                <div>
                  <h3>{q.factory}</h3>
                  <div className="sub">{q.city} · <i className="ri-star-fill accent" /> {q.rating}</div>
                </div>
                <div className="stack" style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Pill tone="info">{q.incoterm}</Pill>
                  {status && (
                    <Pill tone={status === 'accepted' ? 'ok' : 'warn'}>
                      {status === 'accepted' ? t('dashboard.buyerQuotes.statusAccepted') : t('dashboard.buyerQuotes.statusNegotiating')}
                    </Pill>
                  )}
                </div>
              </div>
              <div className="list">
                <div className="list-row"><div className="body"><div className="s">{t('dashboard.buyerQuotes.unitPrice')}</div><div className="t accent">{q.price}</div></div></div>
                <div className="list-row"><div className="body"><div className="s">{t('dashboard.buyerQuotes.moq')}</div><div className="t">{q.moq}</div></div></div>
                <div className="list-row"><div className="body"><div className="s">{t('dashboard.buyerQuotes.lead')}</div><div className="t">{q.lead}</div></div></div>
                <div className="list-row"><div className="body"><div className="s">{t('dashboard.buyerQuotes.terms')}</div><div className="t small">{q.terms}</div></div></div>
              </div>
              <div className="divider" />
              <div className="row-between wrap" style={{ gap: 8 }}>
                <button
                  type="button"
                  className="btn sm primary"
                  disabled={status === 'accepted'}
                  onClick={() => accept(q.factory)}
                >
                  <i className="ri-check-line" /> {status === 'accepted' ? t('dashboard.buyerQuotes.statusAccepted') : t('dashboard.common.accept')}
                </button>
                <button type="button" className="btn sm ghost" onClick={() => openNeg(i)}><i className="ri-chat-3-line" /> {t('dashboard.common.negotiate')}</button>
                <button
                  type="button"
                  className="btn sm ghost"
                  disabled={q.sample === 'غير متاح' || q.sample === 'Unavailable'}
                  onClick={() => flash(t('dashboard.buyerQuotes.sampleRequestedToast'))}
                >
                  <i className="ri-dropbox-line" /> {t('dashboard.common.sample')}
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        open={openIdx !== null}
        onClose={() => setOpenIdx(null)}
        title={t('dashboard.buyerQuotes.negTitle')}
        sub={active ? `${active.factory} · ${active.price}` : t('dashboard.buyerQuotes.negSub')}
      >
        <div className="grid c2">
          <div className="field">
            <label htmlFor="neg-price">{t('dashboard.buyerQuotes.priceLabel')}</label>
            <input
              id="neg-price"
              inputMode="decimal"
              value={offer.price}
              onChange={(e) => setOffer((o) => ({ ...o, price: e.target.value }))}
              placeholder={t('dashboard.buyerQuotes.pricePlaceholder')}
            />
          </div>
          <div className="field">
            <label htmlFor="neg-qty">{t('dashboard.buyerQuotes.qtyLabel')}</label>
            <input
              id="neg-qty"
              inputMode="numeric"
              value={offer.qty}
              onChange={(e) => setOffer((o) => ({ ...o, qty: e.target.value }))}
              placeholder={t('dashboard.buyerQuotes.qtyPlaceholder')}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="neg-msg">{t('dashboard.buyerQuotes.msgLabel')}</label>
          <textarea
            id="neg-msg"
            maxLength={500}
            value={offer.msg}
            onChange={(e) => setOffer((o) => ({ ...o, msg: e.target.value }))}
            placeholder={t('dashboard.buyerQuotes.msgPlaceholder')}
          />
        </div>
        <div className="note"><i className="ri-shield-check-line" /> {t('dashboard.buyerQuotes.negNote')}</div>
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={submitOffer}><i className="ri-send-plane-2-line" /> {t('dashboard.buyerQuotes.sendOffer')}</button>
          <button type="button" className="btn ghost" onClick={() => setOpenIdx(null)}>{t('dashboard.common.cancel')}</button>
        </div>
      </Modal>

      <RfqModal open={rfqOpen} onClose={() => setRfqOpen(false)} />

      <Toast message={toast} />
    </>
  );
}

const dealDocDefs = [
  { label: 'docInvoice', code: 'INV-5501', tone: 'ok', statusKey: 'docReady' },
  { label: 'docPacking', code: 'PL-7712', tone: 'ok', statusKey: 'docReady' },
  { label: 'docOrigin', code: 'CO-4410', tone: 'warn', statusKey: 'docPending' },
  { label: 'docBOL', code: 'BL-3320', tone: 'ok', statusKey: 'docReady' },
  { label: 'docHalal', code: 'HL-2201', tone: 'danger', statusKey: 'docRequested' },
];

type DealPayment = { amount: string; method: string };

function BuyerDeals() {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const { go } = useDashboardNav();
  const pct = (i18n.resolvedLanguage || i18n.language || 'ar').match(/^(en|ur|id)/) !== null ? '%' : '٪';
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [docsIdx, setDocsIdx] = useState<number | null>(null);
  const [trackIdx, setTrackIdx] = useState<number | null>(null);
  const [rfqOpen, setRfqOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('wallet');
  const [payments, setPayments] = useState<Record<string, DealPayment>>(
    () => loadJson<Record<string, DealPayment>>('sta-buyer-deal-payments', {}),
  );
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    saveJson('sta-buyer-deal-payments', payments);
  }, [payments]);

  const methodLabel = (key: string) => t(`dashboard.buyerDeals.method${key.charAt(0).toUpperCase()}${key.slice(1)}`);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2800);
  };

  const openPay = (i: number) => {
    setOpenIdx(i);
    setAmount('');
    setMethod('wallet');
    setError('');
  };

  const confirmPay = () => {
    if (openIdx === null) return;
    if (!amount.trim()) {
      setError(t('dashboard.buyerDeals.amountRequired'));
      return;
    }
    const deal = d.buyerDeals[openIdx];
    setPayments((p) => ({ ...p, [deal.name]: { amount: amount.trim(), method: methodLabel(method) } }));
    setOpenIdx(null);
    flash(t('dashboard.buyerDeals.payToast'));
  };

  const downloadDoc = (idx: number) => {
    const doc = dealDocDefs[idx];
    const deal = docsIdx !== null ? d.buyerDeals[docsIdx] : null;
    const body = [
      t(`dashboard.buyerDeals.${doc.label}`),
      `Ref: ${doc.code}`,
      deal ? `${t('dashboard.buyerDeals.dealTotal')}: ${deal.total}` : '',
      deal ? `${t('dashboard.buyerDeals.paid')}: ${deal.paid}` : '',
      t(`dashboard.buyerDeals.${doc.statusKey}`),
    ].filter(Boolean).join('\n');
    downloadFile(`${doc.code}.txt`, body);
    flash(t('dashboard.buyerDeals.docDownloadedToast'));
  };

  const active = openIdx !== null ? d.buyerDeals[openIdx] : null;
  const trackDeal = trackIdx !== null ? d.buyerDeals[trackIdx] : null;

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.buyerDeals.eyebrow')}
        title={t('dashboard.buyerDeals.title')}
        sub={t('dashboard.buyerDeals.sub')}
        actions={<button type="button" className="btn primary" onClick={() => setRfqOpen(true)}><i className="ri-add-line" /> {t('dashboard.buyerDeals.requestQuote')}</button>}
      />
      <div className="grid c2">
        {d.buyerDeals.map((deal, i) => {
          const pay = payments[deal.name];
          const hasDue = deal.due !== '٠ ر.س' && deal.due !== 'SAR 0';
          return (
            <Card key={deal.name} title={deal.name} sub={t('dashboard.buyerDeals.nextDue', { date: deal.nextDue })}>
              <div className="grid c2 mb" style={{ gap: 12 }}>
                <div><div className="s muted small">{t('dashboard.buyerDeals.dealTotal')}</div><div className="strong">{deal.total}</div></div>
                <div><div className="s muted small">{t('dashboard.buyerDeals.paid')}</div><div className="strong accent">{deal.paid}</div></div>
              </div>
              <div className="row-between small mb"><span className="muted">{t('dashboard.buyerDeals.stage', { stage: deal.stage })}</span><span className="strong">{deal.progress}{pct}</span></div>
              <Bar value={deal.progress} />
              {pay && (
                <div className="note" style={{ marginTop: 12 }}>
                  <i className="ri-checkbox-circle-line" />
                  <span>{t('dashboard.buyerDeals.lastPayment', { amount: pay.amount, method: pay.method })}</span>
                </div>
              )}
              <div className="divider" />
              <div className="row-between wrap" style={{ gap: 8 }}>
                <button type="button" className="btn sm primary" onClick={() => openPay(i)}><i className="ri-secure-payment-line" /> {t('dashboard.buyerDeals.payInstallment')}</button>
                <button type="button" className="btn sm ghost" onClick={() => setDocsIdx(i)}><i className="ri-file-text-line" /> {t('dashboard.buyerDeals.shippingDocs')}</button>
                <button type="button" className="btn sm ghost" onClick={() => setTrackIdx(i)}><i className="ri-route-line" /> {t('dashboard.buyerDeals.track')}</button>
                <button type="button" className="btn sm ghost" onClick={() => { setContractIntent({ role: 'buyer', factory: deal.name }); go('contracts'); }}><i className="ri-file-paper-2-line" /> {t('dashboard.contracts.fromDeal')}</button>
                {hasDue && <span className="pill warn">{t('dashboard.buyerDeals.remaining', { due: deal.due })}</span>}
                {pay && <span className="pill ok">{t('dashboard.buyerDeals.paidBadge')}</span>}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        open={openIdx !== null}
        onClose={() => setOpenIdx(null)}
        title={t('dashboard.buyerDeals.payTitle')}
        sub={t('dashboard.buyerDeals.paySub')}
      >
        {active && (
          <div className="grid c2 mb" style={{ gap: 12 }}>
            <div><div className="s muted small">{t('dashboard.buyerDeals.dealTotal')}</div><div className="strong">{active.total}</div></div>
            <div><div className="s muted small">{t('dashboard.buyerDeals.remainingLabel')}</div><div className="strong accent">{active.due}</div></div>
          </div>
        )}
        <div className="field">
          <label htmlFor="pay-amount">{t('dashboard.buyerDeals.amountLabel')}</label>
          <input
            id="pay-amount"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t('dashboard.buyerDeals.amountPlaceholder')}
          />
        </div>
        <div className="field">
          <label htmlFor="pay-method">{t('dashboard.buyerDeals.methodLabel')}</label>
          <select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="wallet">{t('dashboard.buyerDeals.methodWallet')}</option>
            <option value="card">{t('dashboard.buyerDeals.methodCard')}</option>
            <option value="bank">{t('dashboard.buyerDeals.methodBank')}</option>
          </select>
        </div>
        {error && <div className="pill danger"><i className="ri-error-warning-line" /> {error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={confirmPay}><i className="ri-lock-line" /> {t('dashboard.buyerDeals.payNow')}</button>
          <button type="button" className="btn ghost" onClick={() => setOpenIdx(null)}>{t('dashboard.common.cancel')}</button>
        </div>
      </Modal>

      <Modal
        open={docsIdx !== null}
        onClose={() => setDocsIdx(null)}
        title={t('dashboard.buyerDeals.docsTitle')}
        sub={docsIdx !== null ? t('dashboard.buyerDeals.docsSub', { name: d.buyerDeals[docsIdx].name }) : ''}
      >
        <div className="list">
          {dealDocDefs.map((doc, idx) => (
            <div className="list-row" key={doc.code}>
              <div className="ic"><i className="ri-file-text-line" /></div>
              <div className="body">
                <div className="t">{t(`dashboard.buyerDeals.${doc.label}`)}</div>
                <div className="s">{doc.code}</div>
              </div>
              <div className="end">
                <Pill tone={doc.tone}>{t(`dashboard.buyerDeals.${doc.statusKey}`)}</Pill>
                <button
                  type="button"
                  className="btn sm ghost"
                  disabled={doc.tone !== 'ok'}
                  onClick={() => downloadDoc(idx)}
                  aria-label={t('dashboard.common.download')}
                >
                  <i className="ri-download-2-line" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="note" style={{ marginTop: 14 }}><i className="ri-shield-check-line" /> {t('dashboard.buyerDeals.docsNote')}</div>
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={() => setDocsIdx(null)}>{t('dashboard.common.cancel')}</button>
        </div>
      </Modal>

      <Modal
        open={trackIdx !== null}
        onClose={() => setTrackIdx(null)}
        title={t('dashboard.buyerDeals.trackTitle')}
        sub={trackDeal ? t('dashboard.buyerDeals.trackSub', { name: trackDeal.name }) : ''}
      >
        {trackDeal && (() => {
          const stages = trackDeal.stages ?? [];
          const doneCount = stages.length;
          const stageDate = (key: string) => stages.find((s) => s.key === key)?.date;
          return (
            <>
              <div className="row-between small mb"><span className="muted">{t('dashboard.buyerDeals.trackProgress')}</span><span className="strong">{trackDeal.progress}%</span></div>
              <Bar value={trackDeal.progress} />
              <div className="tl" style={{ marginTop: 16 }}>
                {DEAL_FLOW.map((k, i) => {
                  const done = i < doneCount;
                  const current = i === doneCount - 1;
                  const date = stageDate(k);
                  return (
                    <div key={k} className={`tl-item ${done ? 'done' : ''}`}>
                      <div className="row-between" style={{ gap: 8, flexWrap: 'wrap' }}>
                        <div className="t">{t(`dashboard.factory.deals.stage.${k}`)}</div>
                        <Pill tone={done ? (current ? 'info' : 'ok') : 'mute'}>
                          {done ? (current ? t('dashboard.buyerDeals.trackCurrent') : t('dashboard.buyerDeals.trackDone')) : t('dashboard.buyerDeals.trackTodo')}
                        </Pill>
                      </div>
                      <div className="s">{date ?? t('dashboard.buyerDeals.trackExpected')}</div>
                    </div>
                  );
                })}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setTrackIdx(null)}>{t('dashboard.common.close')}</button>
              </div>
            </>
          );
        })()}
      </Modal>

      <RfqModal open={rfqOpen} onClose={() => setRfqOpen(false)} />

      <Toast message={toast} />
    </>
  );
}

type FavList = { name: string; count: number };

function BuyerFavorites() {
  const { t } = useTranslation();
  const d = useDashboard();
  const navigate = useNavigate();
  const cart = useCart();
  const fav = useFavorites();
  const { products } = useCatalog();
  const [lists, setLists] = useState<FavList[]>(
    () => loadJson<FavList[]>('sta-buyer-fav-lists', d.favoriteLists.map((l) => ({ ...l }))),
  );
  const [active, setActive] = useState<string>(
    () => loadJson<string>('sta-buyer-fav-active', d.favoriteLists[0].name),
  );
  const [newOpen, setNewOpen] = useState(false);
  const [name, setName] = useState('');
  const [newError, setNewError] = useState('');
  const [share, setShare] = useState<{ title: string; url: string } | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => { saveJson('sta-buyer-fav-lists', lists); }, [lists]);
  useEffect(() => { saveJson('sta-buyer-fav-active', active); }, [active]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2800);
  };

  const listLink = (n: string) => `https://safeer.sa/l/${encodeURIComponent(n)}?ref=AHMAD-JO-2481`;
  const productLink = (n: string) => `https://safeer.sa/p/${encodeURIComponent(n)}?ref=AHMAD-JO-2481`;

  const createList = () => {
    const n = name.trim();
    if (!n) {
      setNewError(t('dashboard.buyerFav.listRequired'));
      return;
    }
    setLists((prev) => [...prev, { name: n, count: 0 }]);
    setActive(n);
    setName('');
    setNewError('');
    setNewOpen(false);
    flash(t('dashboard.buyerFav.listCreatedToast'));
  };

  const copy = async (url: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard may be unavailable — still confirm to the user */
    }
    flash(msg);
  };

  const addToCart = (productId?: string, fallbackName?: string) => {
    const product = (products as Product[]).find((p) => p.id === productId);
    if (product) {
      cart.add(product);
      flash(t('dashboard.buyerFav.addedToast', { name: product.name }));
    } else {
      flash(t('dashboard.buyerFav.addedToast', { name: fallbackName ?? '' }));
    }
  };

  const toggleStoreFav = (productId?: string) => {
    if (!productId) return;
    const wasOn = fav.has(productId);
    fav.toggle(productId);
    flash(wasOn ? t('dashboard.buyerFav.removedFavToast') : t('dashboard.buyerFav.addedFavToast'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.buyerFav.eyebrow')}
        title={t('dashboard.buyerFav.title')}
        sub={t('dashboard.buyerFav.sub')}
      />
      <div className="row-between wrap mb" style={{ gap: 10 }}>
        <div className="row-between wrap" style={{ gap: 8 }}>
          {lists.map((l) => (
            <button
              key={l.name}
              type="button"
              className={`chip ${active === l.name ? 'is-on' : ''}`}
              onClick={() => setActive(l.name)}
            >
              <i className="ri-bookmark-3-line" /> {l.name} · {l.count}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn sm ghost"
            onClick={() => navigate('/favorites')}
            title={t('dashboard.buyerFav.storeFavoritesSub')}
          >
            <i className="ri-heart-3-line" /> {t('dashboard.buyerFav.storeFavorites', { count: fav.count })}
          </button>
          <button
            type="button"
            className="btn sm ghost"
            onClick={() => setShare({ title: t('dashboard.buyerFav.shareTitle'), url: listLink(active) })}
          >
            <i className="ri-share-line" /> {t('dashboard.common.share')}
          </button>
          <button type="button" className="btn sm ghost" onClick={() => { setNewError(''); setName(''); setNewOpen(true); }}>
            <i className="ri-add-line" /> {t('dashboard.common.newList')}
          </button>
        </div>
      </div>

      <div className="grid c3">
        {d.favoriteProducts.map((p) => {
          const inStore = p.productId ? fav.has(p.productId) : false;
          return (
            <article className="pcard" key={p.name}>
              <div className="pcard-media">
                <img className="thumb" src={p.img} alt={p.name} />
                <button
                  type="button"
                  className={`fav-heart ${inStore ? 'is-on' : ''}`}
                  aria-label={t('dashboard.buyerFav.storeFavoritesSub')}
                  aria-pressed={inStore}
                  onClick={() => toggleStoreFav(p.productId)}
                >
                  <i className={inStore ? 'ri-heart-3-fill' : 'ri-heart-3-line'} />
                </button>
              </div>
              <div className="body">
                <div className="t">{p.name}</div>
                <div className="s">{p.factory}</div>
                <div className="row-between">
                  <span className="price">{p.price}</span>
                  {p.drop && <Pill tone="ok">{p.drop}</Pill>}
                </div>
                <div className="row-between" style={{ gap: 8 }}>
                  <button type="button" className="btn sm primary" onClick={() => addToCart(p.productId, p.name)}><i className="ri-shopping-cart-2-line" /> {t('dashboard.buyerFav.toCart')}</button>
                  <button
                    type="button"
                    className="btn sm ghost"
                    aria-label={t('dashboard.buyerFav.shareAria')}
                    onClick={() => setShare({ title: t('dashboard.buyerFav.shareProductTitle'), url: productLink(p.name) })}
                  >
                    <i className="ri-share-line" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title={t('dashboard.buyerFav.newListTitle')}
        sub={t('dashboard.buyerFav.newListSub')}
      >
        <div className="field">
          <label htmlFor="list-name">{t('dashboard.buyerFav.listNameField')}</label>
          <input
            id="list-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('dashboard.buyerFav.listNamePlaceholder')}
          />
        </div>
        {newError && <div className="pill danger"><i className="ri-error-warning-line" /> {newError}</div>}
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={createList}><i className="ri-add-line" /> {t('dashboard.buyerFav.createList')}</button>
          <button type="button" className="btn ghost" onClick={() => setNewOpen(false)}>{t('dashboard.common.cancel')}</button>
        </div>
      </Modal>

      <Modal
        open={!!share}
        onClose={() => setShare(null)}
        title={share?.title ?? ''}
        sub={t('dashboard.buyerFav.shareSub')}
      >
        <div className="field" style={{ marginBottom: 8 }}>
          <label>{t('dashboard.buyerFav.shareLinkLabel')}</label>
          <div className="share-link"><i className="ri-link" /> {share?.url}</div>
        </div>
        <div className="note"><i className="ri-information-line" /> {t('dashboard.buyerFav.shareNote')}</div>
        <div className="modal-actions">
          <button
            type="button"
            className="btn primary"
            onClick={() => share && copy(share.url, t('dashboard.buyerFav.shareCopiedToast'))}
          >
            <i className="ri-file-copy-line" /> {t('dashboard.buyerFav.copyLink')}
          </button>
          <button type="button" className="btn ghost" onClick={() => setShare(null)}>{t('dashboard.common.cancel')}</button>
        </div>
      </Modal>

      <Toast message={toast} />
    </>
  );
}

export const buyerCoreViews: Record<string, FunctionComponent> = {
  home: BuyerHome,
  orders: BuyerOrders,
  quotes: BuyerQuotes,
  deals: BuyerDeals,
  favorites: BuyerFavorites,
};