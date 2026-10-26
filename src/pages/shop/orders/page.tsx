import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StoreNav from '@/components/feature/StoreNav';
import StoreFooter from '@/components/feature/StoreFooter';
import type { Order } from '@/pages/shop/types';
import { useCatalog } from '@/hooks/useCatalog';
import { loadOrders } from '@/pages/shop/lib/ordersStore';
import { applyLocalReturn } from '@/pages/shop/lib/returns';
import OrderCard from './components/OrderCard';
import { initPanels } from '@/pages/home/lib/panels';

const filterKeys = ['filterAll', 'filterOpen', 'filterDone'];

export default function OrdersPage() {
  const { t } = useTranslation();
  const { sampleOrders } = useCatalog();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => initPanels(), []);

  useEffect(() => {
    let alive = true;
    window.scrollTo(0, 0);
    loadOrders()
      .then((stored) => {
        if (!alive) return;
        // Newest first; locally placed orders lead the sample history.
        const merged = [...stored, ...(sampleOrders as Order[])]
          .map(applyLocalReturn)
          .sort((a, b) => b.createdAt - a.createdAt);
        setOrders(merged);
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [sampleOrders]);

  const visible = useMemo(() => {
    if (filter === 'open') return orders.filter((o) => o.status !== 'delivered');
    if (filter === 'done') return orders.filter((o) => o.status === 'delivered');
    return orders;
  }, [orders, filter]);

  const stats = useMemo(() => ({
    total: orders.length,
    open: orders.filter((o) => o.status !== 'delivered').length,
    value: orders.reduce((sum, o) => sum + o.total, 0),
  }), [orders]);

  const filterIds = ['all', 'open', 'done'];

  return (
    <div className="st-shell">
      <StoreNav />

      <main className="st-orders-page">
        <div className="st-wrap">
          <nav className="st-crumbs" aria-label={t('orders.crumbs.aria')}>
            <Link to="/">{t('orders.crumbs.home')}</Link>
            <i className="ri-arrow-left-s-line" />
            <Link to="/products">{t('orders.crumbs.shop')}</Link>
            <i className="ri-arrow-left-s-line" />
            <span>{t('orders.crumbs.orders')}</span>
          </nav>

          <div className="st-head">
            <div>
              <p className="eyebrow">{t('orders.list.eyebrow')}</p>
              <h1>
                {t('orders.list.title')}
                {orders.length > 0 && <span className="accent"> · {orders.length}</span>}
              </h1>
            </div>
            <Link className="st-btn ghost" to="/products">
              <i className="ri-store-2-line" /> {t('orders.list.continue')}
            </Link>
          </div>

          {orders.length > 0 && (
            <div className="st-orders-stats">
              <div className="s"><b>{stats.total}</b><span>{t('orders.list.statTotal')}</span></div>
              <div className="s"><b>{stats.open}</b><span>{t('orders.list.statOpen')}</span></div>
              <div className="s"><b>{stats.value.toLocaleString('en-US')}</b><span>{t('orders.list.statValue')}</span></div>
            </div>
          )}

          {orders.length > 0 && (
            <div className="st-orders-filters">
              {filterIds.map((id, i) => (
                <button
                  key={id}
                  type="button"
                  className={`st-chipx${filter === id ? ' is-on' : ''}`}
                  onClick={() => setFilter(id)}
                >
                  {t(`orders.list.${filterKeys[i]}`)}
                </button>
              ))}
            </div>
          )}

          {!ready ? (
            <div className="st-empty">
              <i className="ri-loader-4-line" />
              <div className="t">{t('orders.list.loading')}</div>
            </div>
          ) : visible.length === 0 ? (
            <div className="st-empty">
              <i className="ri-file-list-3-line" />
              <div className="t">{t('orders.list.emptyTitle')}</div>
              <p>{t('orders.list.emptyText')}</p>
              <Link className="st-btn primary" to="/products" style={{ marginTop: 18 }}>
                <i className="ri-store-2-line" /> {t('orders.list.browse')}
              </Link>
            </div>
          ) : (
            <div className="st-orders-list">
              {visible.map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
            </div>
          )}
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}