import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Product } from '@/pages/shop/types';
import { rfqIncoterms } from '@/mocks/shop';
import { useCatalog } from '@/hooks/useCatalog';
import { supabase, backendReady } from '@/lib/supabase';
import { useAuth } from '@/pages/auth/AuthProvider';
import { readClickId } from '@/pages/shop/lib/orderApi';

/* Merchant request-for-quote form. Posts to the Safeer form endpoint. */
const RFQ_SUBMIT = 'https://readdy.ai/api/form/db77vq6n6nb9f68e9al0';

interface Props {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
  factoryName?: string;
  items?: { name: string; qty: number }[];
}

export default function RfqModal({ open, onClose, product, factoryName, items }: Props) {
  const { t } = useTranslation();
  const { rfqCountries } = useCatalog();
  const { user } = useAuth();
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!open) return;
    setStatus('idle');
    setFormError('');
    setCountry('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const ports = rfqCountries.find((c) => c.name === country)?.ports ?? [];
  const defaultQty = product?.wholesale?.moq ?? 1;
  const cartItems = items && items.length > 0 ? items : null;
  const defaultItem = product
    ? product.name
    : cartItems
      ? cartItems.map((i) => `${i.name} × ${i.qty}`).join(' • ')
      : '';
  const title = product
    ? product.name
    : cartItems
      ? t('shop.rfq.cartLabel')
      : factoryName
        ? t('shop.rfq.factoryQuote', { name: factoryName })
        : t('shop.rfq.genericQuote');

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    const honeypot = (form.querySelector('[name="website_alt"]') as HTMLInputElement | null)?.value?.trim() ?? '';
    if (honeypot) {
      setStatus('ok');
      return;
    }

    const data = new FormData(form);
    data.delete('website_alt');
    const body = new URLSearchParams();
    data.forEach((value, key) => {
      if (typeof value === 'string' && value.trim() !== '') body.append(key, value);
    });

    setStatus('sending');
    setFormError('');

    /* Signed-in buyer + live backend: the request becomes a row in `rfqs`,
       which every factory in the category can quote on (quotes table) and
       the buyer compares before awarding the deal. Guests still go through
       the form inbox so no request is lost. */
    if (backendReady && user) {
      const qty = Number(data.get('quantity') ?? defaultQty) || defaultQty;
      /* create_rfq attributes the request to the ambassador whose page the
         buyer clicked (server-side click record) — never to a client value. */
      const { error } = await supabase.rpc('create_rfq', {
        p_product: product?.id ?? null,
        p_category: product?.categoryId ?? null,
        p_qty: qty,
        p_country: String(rfqCountries.find((c) => c.name === country)?.code ?? country ?? '').slice(0, 8) || 'xx',
        p_port: String(data.get('port') ?? '') || null,
        p_incoterm: String(data.get('incoterm') ?? 'CIF'),
        p_notes: String(data.get('notes') ?? data.get('message') ?? '').slice(0, 1000) || null,
        p_click: readClickId() ?? null,
      });
      if (!error) {
        setStatus('ok');
        form.reset();
        return;
      }
    }

    try {
      const response = await fetch(RFQ_SUBMIT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const responseText = await response.text();
      let parsed: { code?: string; message?: string; meta?: { message?: string; detail?: string } } | null = null;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = null;
      }
      const serverMsg = parsed?.meta?.message || parsed?.message || parsed?.meta?.detail || responseText;
      const isSpam = typeof serverMsg === 'string' && serverMsg.toLowerCase().includes('spam');

      if (response.ok && parsed?.code === 'OK' && !isSpam) {
        setStatus('ok');
        form.reset();
      } else {
        setStatus('error');
        setFormError(typeof serverMsg === 'string' && serverMsg ? serverMsg : t('shop.rfq.errorDefault'));
      }
    } catch {
      setStatus('error');
      setFormError(t('shop.rfq.errorNetwork'));
    }
  };

  return (
    <div className="st-modal-overlay rfq" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="st-modal narrow" onClick={(e) => e.stopPropagation()}>
        <div className="st-modal-head">
          <div>
            <h3>{t('shop.rfq.title')}</h3>
            <p className="sub">{t('shop.rfq.subtitle', { name: title })}</p>
          </div>
          <button type="button" className="st-modal-close" onClick={onClose} aria-label={t('shop.rfq.close')}>
            <i className="ri-close-line" />
          </button>
        </div>

        <div className="st-modal-body">
          {status === 'ok' ? (
            <div className="st-form-status ok">
              <i className="ri-checkbox-circle-line" />
              <span>{t('shop.rfq.ok')}</span>
            </div>
          ) : (
            <form id="rfq-form" data-readdy-form onSubmit={onSubmit} className="st-form-grid">
              <input type="hidden" name="form_type" value="RFQ" />
              {product && <input type="hidden" name="product_id" value={product.id} />}
              {product && <input type="hidden" name="product_name" value={product.name} />}
              {factoryName && <input type="hidden" name="factory_name" value={factoryName} />}
              {cartItems && (
                <input
                  type="hidden"
                  name="cart_items"
                  value={cartItems.map((i) => `${i.name} x ${i.qty}`).join(' | ')}
                />
              )}

              <div className="st-field full">
                <label htmlFor="rfq-item">{t('shop.rfq.itemLabel')}</label>
                <input
                  id="rfq-item"
                  name="item"
                  type="text"
                  defaultValue={defaultItem}
                  placeholder={t('shop.rfq.itemPlaceholder')}
                  required
                />
              </div>

              <div className="st-field">
                <label htmlFor="rfq-qty">{t('shop.rfq.qty')} <span className="req">*</span></label>
                <input
                  id="rfq-qty"
                  name="quantity"
                  type="number"
                  min={product?.wholesale?.moq ?? 1}
                  defaultValue={defaultQty}
                  required
                />
                {product?.wholesale && (
                  <span className="hint">{t('shop.rfq.qtyHint', { moq: product.wholesale.moq })}</span>
                )}
              </div>

              <div className="st-field">
                <label htmlFor="rfq-country">{t('shop.rfq.country')} <span className="req">*</span></label>
                <select
                  id="rfq-country"
                  name="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                >
                  <option value="">{t('shop.rfq.chooseCountry')}</option>
                  {rfqCountries.map((c) => (
                    <option key={c.code} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="st-field">
                <label htmlFor="rfq-port">{t('shop.rfq.port')} <span className="req">*</span></label>
                <select id="rfq-port" name="port" required disabled={!country} defaultValue="">
                  <option value="">{country ? t('shop.rfq.choosePort') : t('shop.rfq.chooseCountryFirst')}</option>
                  {ports.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="st-field">
                <label htmlFor="rfq-incoterm">{t('shop.rfq.incoterm')}</label>
                <select id="rfq-incoterm" name="incoterm" defaultValue="CIF">
                  {rfqIncoterms.map((term) => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
              </div>

              <div className="st-field">
                <label htmlFor="rfq-company">{t('shop.rfq.company')} <span className="req">*</span></label>
                <input id="rfq-company" name="company" type="text" placeholder={t('shop.rfq.companyPlaceholder')} required />
              </div>

              <div className="st-field">
                <label htmlFor="rfq-email">{t('shop.rfq.email')} <span className="req">*</span></label>
                <input id="rfq-email" name="email" type="email" placeholder="name@company.com" required />
              </div>

              <div className="st-field">
                <label htmlFor="rfq-phone">{t('shop.rfq.phone')}</label>
                <input id="rfq-phone" name="phone" type="tel" placeholder="+966 5X XXX XXXX" />
              </div>

              <div className="st-field full">
                <label htmlFor="rfq-notes">{t('shop.rfq.notes')}</label>
                <textarea
                  id="rfq-notes"
                  name="notes"
                  maxLength={500}
                  placeholder={t('shop.rfq.notesPlaceholder')}
                />
                <span className="hint">{t('shop.rfq.notesHint')}</span>
              </div>

              <input
                className="st-extra-field"
                type="text"
                name="website_alt"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                readOnly
              />

              {status === 'error' && (
                <div className="st-form-status err" role="alert">
                  <i className="ri-error-warning-line" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="st-field full">
                <button
                  type="submit"
                  className="st-btn primary block"
                  disabled={status === 'sending'}
                >
                  {status === 'sending' ? (
                    <>
                      <i className="ri-loader-4-line" /> {t('shop.rfq.sending')}
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-line" /> {t('shop.rfq.submit')}
                    </>
                  )}
                </button>
                <span className="hint" style={{ textAlign: 'center' }}>
                  {t('shop.rfq.formHint')}
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}