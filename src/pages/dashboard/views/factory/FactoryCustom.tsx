import { useState } from 'react';
import type { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, PageHead, Switch, Ring, Toast,
} from '@/pages/dashboard/components/ui';
import { useFactoryLayout, FACTORY_CARD_KEYS } from '@/hooks/useFactoryLayout';
import type { FactoryCardKey } from '@/hooks/useFactoryLayout';

const CARD_ICONS: Record<FactoryCardKey, string> = {
  stats: 'ri-bar-chart-box-line',
  alerts: 'ri-alarm-warning-line',
  todayOrders: 'ri-file-list-3-line',
  readiness: 'ri-shield-check-line',
  countries: 'ri-global-line',
  rfq: 'ri-price-tag-3-line',
};

/* Lets the factory owner choose which cards appear on the factory home page
   AND in what order. Every toggle / move applies instantly (the home view
   listens to the same store). */
function FactoryCustom() {
  const { t } = useTranslation();
  const { order, visible, toggle, move, reset } = useFactoryLayout();
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  const total = FACTORY_CARD_KEYS.length;
  const pct = Math.round((visible.length / total) * 100);
  const shownOrdered = order.filter((k) => visible.includes(k));

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.custom.title')}
        sub={t('dashboard.factory.custom.sub')}
        actions={(
          <button type="button" className="btn ghost" onClick={() => { reset(); flash(t('dashboard.factory.custom.resetToast')); }}>
            <i className="ri-restart-line" /> {t('dashboard.factory.custom.reset')}
          </button>
        )}
      />

      <div className="split mb">
        <Card title={t('dashboard.factory.custom.choose')} sub={t('dashboard.factory.custom.chooseSub')}>
          <div className="list">
            {order.map((key, i) => {
              const on = visible.includes(key);
              return (
                <div className="list-row" key={key}>
                  <div className="ic"><i className={CARD_ICONS[key]} /></div>
                  <div className="body">
                    <div className="t">{t(`dashboard.factory.custom.cards.${key}`)}</div>
                    <div className="s">{t(`dashboard.factory.custom.cards.${key}Desc`)}</div>
                  </div>
                  <div className="end">
                    <div className="move-group">
                      <button
                        type="button"
                        className="move-btn"
                        disabled={i === 0}
                        aria-label={t('dashboard.factory.custom.moveUp')}
                        title={t('dashboard.factory.custom.moveUp')}
                        onClick={() => { move(key, 'up'); flash(t('dashboard.factory.custom.movedToast')); }}
                      >
                        <i className="ri-arrow-up-line" />
                      </button>
                      <button
                        type="button"
                        className="move-btn"
                        disabled={i === order.length - 1}
                        aria-label={t('dashboard.factory.custom.moveDown')}
                        title={t('dashboard.factory.custom.moveDown')}
                        onClick={() => { move(key, 'down'); flash(t('dashboard.factory.custom.movedToast')); }}
                      >
                        <i className="ri-arrow-down-line" />
                      </button>
                    </div>
                    <Switch
                      checked={on}
                      label=""
                      onChange={() => { toggle(key); flash(t('dashboard.factory.custom.toggleToast')); }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card
          title={t('dashboard.factory.custom.preview')}
          sub={t('dashboard.factory.custom.previewNote', { shown: visible.length, total })}
        >
          <div className="ring-row">
            <Ring value={pct} tone="gold" center={`${visible.length}/${total}`} sub={t('dashboard.factory.custom.choose')} />
            <div className="ring-side">
              {visible.length === 0 ? (
                <p className="small muted">{t('dashboard.factory.custom.empty')}</p>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {shownOrdered.map((key, i) => (
                    <span className="pill ok" key={key}>{i + 1}. {t(`dashboard.factory.custom.cards.${key}`)}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
      <Toast message={toast} />
    </>
  );
}

export const factoryCustomViews: Record<string, FunctionComponent> = {
  'f-custom': FactoryCustom,
};