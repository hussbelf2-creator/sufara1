import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { findAmbPromo, registerAmbPromos, rememberAmbCode } from '@/pages/shop/lib/promo';
import { trackReferralClick } from '@/pages/shop/lib/orderApi';
import { supabase, backendReady } from '@/lib/supabase';

/* Short referral link printed on QR cards: /r/:code.
   A known code goes to its ambassador + factory page (which records the
   click). An unknown code is checked against the server registry
   (resolve_referral) — it is never trusted as a discount on its own. */
export default function ReferralRedirect() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    let alive = true;
    (async () => {
      const local = findAmbPromo(code);
      if (local) {
        navigate(`/f/${local.slug}/${local.factoryId}`, { replace: true });
        return;
      }
      if (backendReady) {
        const { data } = await supabase.rpc('resolve_referral', { p_code: code });
        const row = data as { code: string; slug: string; factory_id: string | null; discount: number } | null;
        if (alive && row?.slug) {
          registerAmbPromos([{ code: row.code, slug: row.slug, factoryId: row.factory_id ?? '', discount: row.discount }]);
          rememberAmbCode(row.code);
          await trackReferralClick(row.slug, row.factory_id ?? '', row.code);
          navigate(row.factory_id ? `/f/${row.slug}/${row.factory_id}` : '/products', { replace: true });
          return;
        }
      }
      if (alive) navigate('/products', { replace: true });
    })();
    return () => {
      alive = false;
    };
  }, [code, navigate]);

  return (
    <div className="st-shell" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <p className="muted"><i className="ri-loader-4-line" /> {t('platform.referral.redirecting')}</p>
    </div>
  );
}
