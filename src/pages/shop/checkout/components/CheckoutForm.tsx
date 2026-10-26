import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCatalog } from '@/hooks/useCatalog';
import { useAmbassadorPages } from '@/hooks/useAmbassadorPages';
import type { Order, OrderLineSnapshot } from '@/pages/shop/types';
import { useCart, type CartItem } from '@/pages/shop/components/CartProvider';
import { estimateShipping, parseWeightKg, suggestRetailMethod, type ShipMethod } from '@/pages/shop/lib/shipping';
import { createOrderId, createTracking, saveOrder } from '@/pages/shop/lib/ordersStore';
import { defaultCustomsParty, proformaRef, taxForCountry, type CustomsParty } from '@/pages/shop/lib/tax';
import { formatSAR, formatSarStrict } from '@/pages/shop/lib/format';
import { PAYMENTS_ENABLED, createServerOrder, readClickId } from '@/pages/shop/lib/orderApi';
import { getDisplayCurrency } from '@/lib/currency';
import { usePlatformConfig } from '@/config/store';
import { absoluteUrl, backendReady, supabase } from '@/lib/supabase';
import OrderReview from './OrderReview';

/* Order request endpoint used while payments are not switched on: the order
   reaches the export desk as a request and the buyer pays on a link later. */
const CHECKOUT_SUBMIT = 'https://readdy.ai/api/form/db79k3n799gd4v2feddg';

/* Delivery terms offered on the storefront. DDP is the default: the platform
   clears customs and the buyer pays nothing on arrival. */
const incoterms = [
  { id: 'DDP', noteKey: 'incotermDdpNote' },
  { id: 'CIF', noteKey: 'incotermCifNote' },
  { id: 'FOB', noteKey: 'incotermFobNote' },
] as const;

const customsParties: { id: CustomsParty; labelKey: string; noteKey: string }[] = [
  { id: 'platform', labelKey: 'cpPlatform', noteKey: 'cpPlatformNote' },
  { id: 'buyer', labelKey: 'cpBuyer', noteKey: 'cpBuyerNote' },
  { id: 'agent', labelKey: 'cpAgent', noteKey: 'cpAgentNote' },
];

/* Retail ships as a direct express parcel (or a shared group parcel);
   wholesale ships consolidated by sea or air from Jeddah. */
const shippingMethods: { id: ShipMethod; labelKey: string; etaKey: string; noteKey: string; channel: 'retail' | 'wholesale'; icon: string }[] = [
  { id: 'express', labelKey: 'shipExpress', etaKey: 'shipExpressEta', noteKey: 'shipExpressNote', channel: 'retail', icon: 'ri-flashlight-line' },
  { id: 'group', labelKey: 'shipGroup', etaKey: 'shipGroupEta', noteKey: 'shipGroupNote', channel: 'retail', icon: 'ri-group-line' },
  { id: 'sea', labelKey: 'shipSea', etaKey: 'shipSeaEta', noteKey: 'shipSeaNote', channel: 'wholesale', icon: 'ri-ship-2-line' },
  { id: 'air', labelKey: 'shipAir', etaKey: 'shipAirEta', noteKey: 'shipAirNote', channel: 'wholesale', icon: 'ri-plane-line' },
];

const paymentMethods = [
  { id: 'mada', labelKey: 'payMada', icon: 'ri-bank-card-2-line', channels: ['retail', 'wholesale'] },
  { id: 'applepay', labelKey: 'payApple', icon: 'ri-apple-fill', channels: ['retail'] },
  { id: 'card', labelKey: 'payCard', icon: 'ri-bank-card-line', channels: ['retail', 'wholesale'] },
  { id: 'transfer', labelKey: 'payTransfer', icon: 'ri-bank-line', channels: ['wholesale'] },
];

function methodsFor(channel: 'retail' | 'wholesale') {
  return paymentMethods.filter((p) => p.channels.includes(channel));
}

interface Props {
  items: CartItem[];
  count: number;
  subtotal: number;
  savings: number;
  onDone: (order: Order) => void;
}

/* Shipping details + order review, with a clearly marked payment step that is
   ready to be wired to a real provider. */
export default function CheckoutForm({ items, count, subtotal, savings, onDone }: Props) {
  const { t } = useTranslation();
  const { rfqCountries, factories } = useCatalog();
  const { clear, discount, promo, freeShipping, channel } = useCart();
  const config = usePlatformConfig();
  const { ambRegistry } = useAmbassadorPages();
  const ambassadorName = promo?.ambassadorSlug
    ? ambRegistry.find((a) => a.slug === promo.ambassadorSlug)?.name
    : undefined;
  const [country, setCountry] = useState('');
  const [shipping, setShipping] = useState<ShipMethod>(channel === 'wholesale' ? 'sea' : 'express');
  const [incoterm, setIncoterm] = useState<string>('DDP');
  const [customsParty, setCustomsParty] = useState<CustomsParty>('platform');
  const [buyerVatNo, setBuyerVatNo] = useState('');
  /* A group parcel needs a real group: the code a leader / ambassador
     created for their trip (see the ambassador's "group order" screen). */
  const [groupCode, setGroupCode] = useState('');
  const [group, setGroup] = useState<{ participants: number; min: number; ok: boolean } | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [formError, setFormError] = useState('');

  const ports = rfqCountries.find((c) => c.name === country)?.ports ?? [];

  /* Live cost estimate — recomputed whenever country, method or the cart change. */
  const weightKg = useMemo(
    () => items.reduce((sum, i) => sum + parseWeightKg(i.product.weight) * i.qty, 0),
    [items],
  );
  const countryCode = rfqCountries.find((c) => c.name === country)?.code ?? '';
  const netSubtotal = Math.max(0, subtotal - discount);
  /* The method list follows the channel: switching a line across its MOQ
     moves the order between the express and the consolidated routes. */
  const groupEnabled = config.shipping.groupOrder.enabled;
  const methods = useMemo(
    () => shippingMethods.filter((m) => m.channel === channel && (m.id !== 'group' || groupEnabled)),
    [channel, groupEnabled],
  );
  useEffect(() => {
    if (!methods.some((m) => m.id === shipping)) setShipping(methods[0]?.id ?? 'express');
  }, [channel, methods, shipping]);

  const estimate = useMemo(
    () => estimateShipping({ countryCode, method: shipping, netSubtotal, weightKg, freeShipping }),
    // config: re-price when the admin publishes new lane rates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [countryCode, shipping, netSubtotal, weightKg, freeShipping, config],
  );
  const suggested = channel === 'retail' && countryCode
    ? suggestRetailMethod({ countryCode, netSubtotal, weightKg, freeShipping })
    : shipping;
  const blockedByMinimum = channel === 'retail' && !!estimate.belowMinOrder;
  const groupMissing = shipping === 'group' && !(group?.ok);

  useEffect(() => {
    const code = groupCode.trim().toUpperCase();
    if (shipping !== 'group' || !/^G-[A-Z0-9]{4,8}$/.test(code)) {
      setGroup(null);
      return;
    }
    let alive = true;
    (async () => {
      if (!backendReady) {
        if (alive) setGroup({ participants: 0, min: config.shipping.groupOrder.minParticipants, ok: true });
        return;
      }
      const { data } = await supabase.rpc('resolve_group', { p_code: code });
      const g = data as { participants: number; min: number; country: string } | null;
      if (alive) setGroup(g && g.country === countryCode ? { participants: g.participants, min: g.min, ok: true } : { participants: 0, min: 0, ok: false });
    })();
    return () => { alive = false; };
  }, [groupCode, shipping, countryCode, config.shipping.groupOrder.minParticipants]);

  /* VAT follows the destination: zero-rated export, or 15% inside the Kingdom. */
  const tax = useMemo(() => taxForCountry(countryCode, netSubtotal), [countryCode, netSubtotal]);
  const orderTotal = netSubtotal + estimate.shipping + estimate.customs + tax.amount;
  /* Pro-forma reference only — the sequential tax invoice is issued by the
     server after payment capture. */
  const invoiceNo = useMemo(() => proformaRef(), []);
  const displayCurrency = getDisplayCurrency();
  const paysIn = methodsFor(channel);

  const onIncoterm = (value: string) => {
    setIncoterm(value);
    setCustomsParty(defaultCustomsParty(value));
  };

  const buildOrder = (name: string): Order => {
    const lines: OrderLineSnapshot[] = items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      image: item.product.image,
      factoryName: factories.find((f) => f.id === item.product.factoryId)?.name ?? '',
      qty: item.qty,
      unit: item.unit,
      total: item.total,
    }));
    const method = shippingMethods.find((m) => m.id === shipping);
    return {
      id: createOrderId(),
      createdAt: Date.now(),
      status: 'processing',
      tracking: createTracking(),
      eta: method ? t(`shop.checkout.${method.etaKey}`) : '',
      lines,
      count,
      subtotal,
      savings,
      discount,
      shippingCost: estimate.shipping,
      customs: estimate.customs,
      vat: tax.amount,
      vatRate: tax.rate,
      invoiceNo,
      buyerVatNo: buyerVatNo.trim() || undefined,
      total: orderTotal,
      weightKg: estimate.weightKg,
      customerName: name || '—',
      country: country || '—',
      city: (document.querySelector('#co-city') as HTMLInputElement | null)?.value || '—',
      port: (document.querySelector('#co-port') as HTMLSelectElement | null)?.value || '—',
      shippingMethod: method ? t(`shop.checkout.${method.labelKey}`) : t('shop.checkout.shipSea'),
      incoterm,
      customsParty: t(`shop.checkout.${customsParties.find((p) => p.id === customsParty)?.labelKey ?? 'cpBuyer'}`),
      promoCode: promo?.code,
      ambassadorName,
      channel,
      chargedSar: orderTotal,
      displayCurrency: displayCurrency.code,
    };
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (groupMissing) {
      setStatus('error');
      setFormError(t('shop.checkout.groupCodeRequired'));
      return;
    }
    if (blockedByMinimum) {
      setStatus('error');
      setFormError(t('shop.checkout.minOrderBlock', { min: formatSAR(estimate.minOrder ?? 0) }));
      return;
    }

    const honeypot = (form.querySelector('[name="website_alt"]') as HTMLInputElement | null)?.value?.trim() ?? '';
    const recipient = (form.querySelector('[name="full_name"]') as HTMLInputElement | null)?.value?.trim() ?? '';

    if (honeypot) {
      const order = buildOrder(recipient);
      await saveOrder(order);
      clear();
      onDone(order);
      return;
    }

    /* Live payments: the server prices, attributes and opens the payment. */
    if (PAYMENTS_ENABLED) {
      const read = (name: string) => (form.querySelector(`[name="${name}"]`) as HTMLInputElement | null)?.value?.trim() ?? '';
      setStatus('sending');
      setFormError('');
      const res = await createServerOrder({
        lines: items.map((i) => ({ productId: i.product.id, qty: i.qty })),
        buyer: {
          name: recipient, company: read('company'), email: read('email'), phone: read('phone'), vatNo: buyerVatNo.trim() || undefined,
          whatsapp: (form.querySelector('[name="whatsapp"]') as HTMLInputElement | null)?.checked ?? false,
        },
        destination: { country: countryCode, city: read('city'), port: read('port'), address: read('address') },
        method: shipping,
        incoterm,
        customsParty,
        promoCode: promo?.code,
        groupCode: shipping === 'group' ? groupCode.trim().toUpperCase() : undefined,
        clickId: readClickId(),
        displayCurrency: displayCurrency.code,
        notes: read('notes'),
        successUrl: absoluteUrl('/orders?paid=1'),
        cancelUrl: absoluteUrl('/checkout?cancelled=1'),
      });
      if (res.ok && res.paymentUrl) {
        window.location.assign(res.paymentUrl);
        return;
      }
      /* Registered on the server, to be paid by bank transfer. */
      if (res.ok && res.orderId) {
        const order = { ...buildOrder(recipient), id: res.orderId, total: res.total ?? orderTotal, chargedSar: res.total ?? orderTotal, status: 'confirmed', paymentMode: 'transfer' as const };
        await saveOrder(order);
        clear();
        onDone(order);
        return;
      }
      setStatus('error');
      setFormError(res.error || t('shop.checkout.errorDefault'));
      return;
    }

    const data = new FormData(form);
    data.delete('website_alt');
    data.set('order_channel', channel);
    data.set('order_shipping_method', shipping);
    data.set('order_display_currency', displayCurrency.code);
    data.set('order_shipping', String(estimate.shipping));
    data.set('order_customs', String(estimate.customs));
    data.set('order_discount', String(discount));
    data.set('order_vat', String(tax.amount));
    data.set('order_vat_rate', String(Math.round(tax.rate * 100)));
    data.set('order_invoice_no', invoiceNo);
    data.set('order_incoterm', incoterm);
    data.set('order_customs_party', customsParty);
    data.set('order_total', String(orderTotal));
    if (ambassadorName) data.set('order_ambassador', ambassadorName);
    const body = new URLSearchParams();
    data.forEach((value, key) => {
      if (typeof value === 'string' && value.trim() !== '') body.append(key, value);
    });

    setStatus('sending');
    setFormError('');
    try {
      const response = await fetch(CHECKOUT_SUBMIT, {
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
        const order = buildOrder(recipient);
        await saveOrder(order);
        clear();
        onDone(order);
      } else {
        setStatus('error');
        setFormError(typeof serverMsg === 'string' && serverMsg ? serverMsg : t('shop.checkout.errorDefault'));
      }
    } catch {
      setStatus('error');
      setFormError(t('shop.checkout.errorNetwork'));
    }
  };

  return (
    <form id="checkout-order-form" data-readdy-form onSubmit={onSubmit} className="st-co-grid">
      <input type="hidden" name="form_type" value="Order" />
      <input type="hidden" name="order_items" value={items.map((i) => `${i.product.name} x ${i.qty}`).join(' | ')} />
      <input type="hidden" name="order_count" value={String(count)} />
      <input type="hidden" name="order_subtotal" value={String(subtotal)} />
      <input type="hidden" name="order_savings" value={String(savings)} />
      <input type="hidden" name="order_currency" value="SAR" />

      <div className={`st-co-channel is-${channel}`} role="status">
        <i className={channel === 'wholesale' ? 'ri-stack-line' : 'ri-gift-2-line'} />
        <span>
          <b>{t(`shop.checkout.channel_${channel}`)}</b>
          {' — '}
          {t(`shop.checkout.channel_${channel}Note`)}
        </span>
      </div>

      <div className="st-co-form">
        <section className="st-co-card">
          <div className="st-co-step">
            <span className="n">1</span>
            <h3>{t('shop.checkout.step1')}</h3>
            <span className="hint">{t('shop.checkout.step1Hint')}</span>
          </div>

          <div className="st-form-grid">
            <div className="st-field">
              <label htmlFor="co-name">{t('shop.checkout.fName')} <span className="req">*</span></label>
              <input id="co-name" name="full_name" type="text" placeholder={t('shop.checkout.fNamePh')} required />
            </div>

            <div className="st-field">
              <label htmlFor="co-company">{t('shop.checkout.fCompany')} <span className="req">*</span></label>
              <input id="co-company" name="company" type="text" placeholder={t('shop.checkout.fCompanyPh')} required />
            </div>

            <div className="st-field">
              <label htmlFor="co-email">{t('shop.checkout.fEmail')} <span className="req">*</span></label>
              <input id="co-email" name="email" type="email" placeholder="name@company.com" required />
            </div>

            <div className="st-field">
              <label htmlFor="co-phone">{t('shop.checkout.fPhone')} <span className="req">*</span></label>
              <input id="co-phone" name="phone" type="tel" placeholder="+966 5X XXX XXXX" required />
              <label className="st-check" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, fontSize: 13 }}>
                <input type="checkbox" name="whatsapp" />
                <span>{t('shop.checkout.whatsappOptIn')}</span>
              </label>
            </div>

            <div className="st-field">
              <label htmlFor="co-country">{t('shop.checkout.fCountry')} <span className="req">*</span></label>
              <select
                id="co-country"
                name="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              >
                <option value="">{t('shop.checkout.chooseCountry')}</option>
                {rfqCountries.map((c) => (
                  <option key={c.code} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="st-field">
              <label htmlFor="co-city">{t('shop.checkout.fCity')} <span className="req">*</span></label>
              <input id="co-city" name="city" type="text" placeholder={t('shop.checkout.fCityPh')} required />
            </div>

            <div className="st-field">
              <label htmlFor="co-port">{t('shop.checkout.fPort')} <span className="req">*</span></label>
              <select id="co-port" name="port" required disabled={!country} defaultValue="">
                <option value="">{country ? t('shop.checkout.choosePort') : t('shop.checkout.chooseCountryFirst')}</option>
                {ports.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="st-field">
              <label htmlFor="co-incoterm">{t('shop.checkout.fIncoterm')} <span className="req">*</span></label>
              <select
                id="co-incoterm"
                name="incoterm"
                value={incoterm}
                onChange={(e) => onIncoterm(e.target.value)}
                required
              >
                {incoterms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.id} — {t(`shop.checkout.${term.noteKey}`)}
                  </option>
                ))}
              </select>
              <span className="hint">{t('shop.checkout.fIncotermHint')}</span>
            </div>

            <div className="st-field">
              <label htmlFor="co-customs-party">{t('shop.checkout.fCustomsParty')} <span className="req">*</span></label>
              <select
                id="co-customs-party"
                name="customs_party"
                value={customsParty}
                onChange={(e) => setCustomsParty(e.target.value as CustomsParty)}
                required
              >
                {customsParties.map((party) => (
                  <option key={party.id} value={party.id}>{t(`shop.checkout.${party.labelKey}`)}</option>
                ))}
              </select>
              <span className="hint">
                {t(`shop.checkout.${customsParties.find((p) => p.id === customsParty)?.noteKey ?? 'cpBuyerNote'}`)}
              </span>
            </div>

            <div className="st-field">
              <label htmlFor="co-buyer-vat">{t('shop.checkout.fBuyerVat')}</label>
              <input
                id="co-buyer-vat"
                name="buyer_vat_no"
                type="text"
                inputMode="numeric"
                value={buyerVatNo}
                onChange={(e) => setBuyerVatNo(e.target.value)}
                placeholder="3000 0000 0000 003"
              />
              <span className="hint">{t('shop.checkout.fBuyerVatHint')}</span>
            </div>

            <div className="st-field full">
              <label htmlFor="co-address">{t('shop.checkout.fAddress')} <span className="req">*</span></label>
              <input
                id="co-address"
                name="address"
                type="text"
                placeholder={t('shop.checkout.fAddressPh')}
                required
              />
            </div>

            <div className="st-field full">
              <label htmlFor="co-notes">{t('shop.checkout.fNotes')}</label>
              <textarea
                id="co-notes"
                name="notes"
                maxLength={500}
                placeholder={t('shop.checkout.fNotesPh')}
              />
              <span className="hint">{t('shop.checkout.fNotesHint')}</span>
            </div>
          </div>
        </section>

        <section className="st-co-card">
          <div className="st-co-step">
            <span className="n">2</span>
            <h3>{t('shop.checkout.step2')}</h3>
            <span className="hint">{t('shop.checkout.step2Hint', { weight: weightKg.toLocaleString('en-US') })}</span>
          </div>

          <div className="st-co-methods">
            {methods.map((m) => (
              <label key={m.id} className={`st-co-method ${shipping === m.id ? 'is-on' : ''}`}>
                <input
                  type="radio"
                  name="shipping_method"
                  value={t(`shop.checkout.${m.labelKey}`)}
                  checked={shipping === m.id}
                  onChange={() => setShipping(m.id)}
                />
                <span className="dot"><i className="ri-check-line" /></span>
                <span className="body">
                  <span className="t">
                    <i className={m.icon} /> {t(`shop.checkout.${m.labelKey}`)}
                    {suggested === m.id && m.id !== shipping && (
                      <em className="st-co-badge">{t('shop.checkout.suggested')}</em>
                    )}
                  </span>
                  <span className="e">
                    {t(`shop.checkout.${m.etaKey}`, { min: estimate.etaDays?.[0] ?? '', max: estimate.etaDays?.[1] ?? '', people: config.shipping.groupOrder.minParticipants })}
                    {' · '}
                    {t(`shop.checkout.${m.noteKey}`, { people: config.shipping.groupOrder.minParticipants })}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {shipping === 'group' && (
            <div className="st-field" style={{ marginTop: 12 }}>
              <label htmlFor="co-group">{t('shop.checkout.groupCode')} <span className="req">*</span></label>
              <input
                id="co-group"
                name="group_code"
                dir="ltr"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value)}
                placeholder="G-7K2QF"
              />
              <span className="hint">
                {group?.ok
                  ? t('shop.checkout.groupJoined', { n: group.participants, min: group.min })
                  : groupCode.trim() ? t('shop.checkout.groupInvalid') : t('shop.checkout.groupCodeHint')}
              </span>
            </div>
          )}

          {blockedByMinimum && (
            <div className="st-form-status err" role="alert">
              <i className="ri-error-warning-line" />
              <span>{t('shop.checkout.minOrderBlock', { min: formatSAR(estimate.minOrder ?? 0) })}</span>
            </div>
          )}
          {!blockedByMinimum && countryCode && estimate.withinTarget === false && (
            <div className="st-co-note warn" role="status">
              <i className="ri-scales-3-line" />
              <span>
                {t('shop.checkout.shareOver', {
                  share: Math.round((estimate.share ?? 0) * 100),
                  target: Math.round(config.shipping.retail.maxShare * 100),
                })}
                {suggested !== shipping && suggested === 'group' ? ` ${t('shop.checkout.shareOverGroup')}` : ''}
              </span>
            </div>
          )}

          <div className="st-co-estimate">
            <div className="erow">
              <span className="k"><i className="ri-scales-3-line" /> {t('shop.checkout.estWeightRow')}</span>
              <span className="v">{t('shop.checkout.estWeightValue', { weight: weightKg.toLocaleString('en-US') })}</span>
            </div>
            <div className="erow">
              <span className="k"><i className="ri-ship-2-line" /> {t('shop.checkout.estShippingRow')}</span>
              <span className="v">{freeShipping ? t('shop.checkout.estFree') : t('shop.checkout.estApprox', { value: estimate.shipping.toLocaleString('en-US') })}</span>
            </div>
            <div className="erow">
              <span className="k"><i className="ri-bank-line" /> {t('shop.checkout.estCustomsRow')}</span>
              <span className="v">{t('shop.checkout.estApprox', { value: estimate.customs.toLocaleString('en-US') })}</span>
            </div>
            <div className="erow">
              <span className="k"><i className="ri-percent-line" /> {t('shop.checkout.estVatRow')}</span>
              <span className="v">
                {tax.exempt
                  ? t('shop.checkout.estVatExport')
                  : t('shop.checkout.estVatAmount', { value: tax.amount.toLocaleString('en-US') })}
              </span>
            </div>
          </div>
        </section>

        <section className="st-co-card">
          <div className="st-co-step">
            <span className="n">
              <i className="ri-bank-card-line" />
            </span>
            <h3>{t('shop.checkout.step3')}</h3>
            <span className="hint">{t('shop.checkout.step3Hint')}</span>
          </div>

          <div className="st-co-paylist">
            {paysIn.map((p) => (
              <div className="st-co-pay" key={p.id}>
                <span className="ic"><i className={p.icon} /></span>
                <span className="t">{t(`shop.checkout.${p.labelKey}`)}</span>
                <span className="soon">{PAYMENTS_ENABLED ? t('shop.checkout.payEnabled') : t('shop.checkout.payOnLink')}</span>
              </div>
            ))}
          </div>

          <div className="st-co-note">
            <i className="ri-information-line" />
            <span>
              {PAYMENTS_ENABLED ? t('shop.checkout.payNoteLive') : t('shop.checkout.payNote')}
              {displayCurrency.code !== 'SAR' && (
                <>
                  <br />
                  {t('shop.checkout.chargedInSar', { amount: formatSarStrict(orderTotal) })}
                </>
              )}
            </span>
          </div>
        </section>
      </div>

      <aside className="st-co-aside">
        <div className="st-co-card">
          <OrderReview
            items={items}
            count={count}
            subtotal={subtotal}
            savings={savings}
            discount={discount}
            shipping={estimate.shipping}
            customs={estimate.customs}
            vat={tax.amount}
            vatRate={tax.rate}
            vatExempt={tax.exempt}
            incoterm={incoterm}
            customsParty={customsParty}
            invoiceNo={invoiceNo}
            buyerVatNo={buyerVatNo}
            weightKg={estimate.weightKg}
            freeShipping={freeShipping}
          />

          {status === 'error' && (
            <div className="st-form-status err" role="alert">
              <i className="ri-error-warning-line" />
              <span>{formError}</span>
            </div>
          )}

          <button type="submit" className="st-btn primary block" disabled={status === 'sending' || blockedByMinimum || groupMissing}>
            {status === 'sending' ? (
              <>
                <i className="ri-loader-4-line" /> {t('shop.checkout.confirming')}
              </>
            ) : (
              <>
                <i className="ri-lock-2-line" /> {t('shop.checkout.confirm')}
              </>
            )}
          </button>

          <p className="hint" style={{ textAlign: 'center' }}>
            {t('shop.checkout.confirmHint')}
          </p>

          <p className="st-co-legal">
            {t('shop.checkout.legalNoteLead')}{' '}
            <Link to="/terms">{t('legal.terms.crumb')}</Link>
            {' · '}
            <Link to="/returns">{t('legal.returns.crumb')}</Link>
            {' · '}
            <Link to="/privacy">{t('legal.privacy.crumb')}</Link>
          </p>

          <ul className="trust">
            <li><i className="ri-truck-line" /> {t('shop.checkout.trustUnified')}</li>
            <li><i className="ri-shield-check-line" /> {t('shop.checkout.trustEscrow')}</li>
            <li><i className="ri-refund-2-line" /> {t('shop.checkout.trustReplace')}</li>
          </ul>
        </div>
      </aside>

      <input
        className="st-extra-field"
        type="text"
        name="website_alt"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        readOnly
      />
    </form>
  );
}