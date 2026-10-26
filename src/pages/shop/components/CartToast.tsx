import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Props {
  toast: { id: number; name: string; qty: number } | null;
  onDone: () => void;
}

/* Small confirmation that floats in when a product lands in the cart,
   with a shortcut straight to the full cart page. */
export default function CartToast({ toast, onDone }: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(onDone, 3000);
    return () => window.clearTimeout(timer);
  }, [toast, onDone]);

  if (!toast) return null;

  return (
    <div className="st-cart-toast" role="status" aria-live="polite">
      <i className="ri-checkbox-circle-fill" />
      <span className="txt">
        {t('shop.cart.toast', { qty: toast.qty, name: toast.name })}
      </span>
      <Link className="go" to="/cart">
        {t('shop.cart.toastView')} <i className="ri-arrow-left-line" />
      </Link>
    </div>
  );
}