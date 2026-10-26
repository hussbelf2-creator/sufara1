import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { promoCodes } from '@/mocks/shop';
import { formatSAR } from '@/pages/shop/lib/format';
import { useAmbassadorPages } from '@/hooks/useAmbassadorPages';
import { usePlatformConfig } from '@/config/store';
import { useCart } from '@/pages/shop/components/CartProvider';

interface Props {
  /** Tighter styling for the checkout sidebar. */
  compact?: boolean;
}

/* Promo / discount code box shared by the cart and the checkout. */
export default function PromoBox({ compact }: Props) {
  const { t } = useTranslation();
  const { promo, discount, applyPromo, removePromo } = useCart();
  const p = useAmbassadorPages();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const capPct = Math.round(usePlatformConfig().promo.capRate * 1000) / 10;

  const ambName = promo?.ambassadorSlug
    ? p.ambRegistry.find((a) => a.slug === promo.ambassadorSlug)?.name
    : undefined;

  /* Not a <form>: the box also renders inside the checkout form, and a
     nested form would submit the whole order instead of applying the code. */
  const onApply = (e?: { preventDefault: () => void }) => {
    e?.preventDefault();
    if (!code.trim()) return;
    const result = applyPromo(code);
    setError(!result.ok);
    setMessage(result.messageKey ? t(result.messageKey, result.messageParams) : '');
    if (result.ok) setCode('');
  };

  if (promo) {
    const label = promo.ambassadorSlug
      ? t('shop.promo.ambLabel', { value: promo.value })
      : t(`shop.promo.code${promo.code}`, { defaultValue: promo.label });
    return (
      <div className={`st-promo is-applied${compact ? ' is-compact' : ''}`}>
        <div className="applied">
          <span className="ic"><i className="ri-coupon-3-line" /></span>
          <div className="body">
            <div className="t">{label} · {promo.code}</div>
            <div className="d">
              {promo.kind === 'shipping'
                ? t('shop.promo.appliedShipping')
                : t('shop.promo.appliedSave', { amount: formatSAR(discount) })}
            </div>
            {ambName && (
              <div className="amb-by"><i className="ri-user-star-line" /> {t('shop.promo.ambAttributed', { name: ambName })}</div>
            )}
          </div>
          <button
            type="button"
            className="rm"
            onClick={() => { removePromo(); setMessage(''); setError(false); }}
            aria-label={t('shop.promo.removeAria')}
          >
            <i className="ri-close-line" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`st-promo${compact ? ' is-compact' : ''}`}>
      <div className="st-promo-form" role="group" aria-label={t('shop.promo.aria')}>
        <span className="ic"><i className="ri-coupon-3-line" /></span>
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); setMessage(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') onApply(e); }}
          placeholder={t('shop.promo.placeholder')}
          aria-label={t('shop.promo.aria')}
        />
        <button type="button" className="apply" disabled={!code.trim()} onClick={() => onApply()}>
          {t('shop.promo.apply')}
        </button>
      </div>

      <div className="codes">
        {promoCodes.map((c) => (
          <button
            key={c.code}
            type="button"
            className="chip"
            onClick={() => { setCode(c.code); setMessage(''); }}
          >
            {c.code}
          </button>
        ))}
      </div>

      <p className="msg" style={{ opacity: 0.75 }}>
        <i className="ri-information-line" /> {t('shop.promo.capNote', { cap: capPct })}
      </p>

      {message && (
        <p className={`msg${error ? ' err' : ' ok'}`} role="status">
          <i className={error ? 'ri-error-warning-line' : 'ri-checkbox-circle-line'} />
          {message}
        </p>
      )}
    </div>
  );
}