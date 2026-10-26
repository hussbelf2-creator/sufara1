import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, PageHead, Pill, Stat, Toast } from '@/pages/dashboard/components/ui';
import { useAuth } from '@/pages/auth/AuthProvider';
import { useAccess } from '@/pages/auth/RequireAccess';
import {
  configProblems, normalizeConfig, worstCaseRetailMargin, worstCaseWholesaleMargin,
  type LangCode, type PlatformConfig, type SalesChannel,
} from '@/config/platform';
import { loadPlatformConfig, publishConfig, usePlatformConfig, usePlatformVersions } from '@/config/store';
import { categories as baseCategories } from '@/mocks/shop';
import { categoryText } from '@/mocks/catalog/en/categories';
import PromoCodesCard from './PromoCodesCard';

/* Platform settings — the admin's single control room for every business
   number: take rates, ambassador tiers, the discount cap, costs, shipping
   lanes and zones, the curated catalogue, acquisition channels, languages,
   currencies and security switches.

   Editing works on a draft. Publishing writes a new, dated version (it can
   take effect today or be scheduled), and is refused while the guardrails
   report a problem — a combination of rates that loses money on a normal
   order cannot be published by accident. */

type Tab = 'revenue' | 'promo' | 'shipping' | 'catalog' | 'locale' | 'security' | 'history';
const TABS: { key: Tab; icon: string }[] = [
  { key: 'revenue', icon: 'ri-percent-line' },
  { key: 'promo', icon: 'ri-coupon-3-line' },
  { key: 'shipping', icon: 'ri-truck-line' },
  { key: 'catalog', icon: 'ri-apps-2-line' },
  { key: 'locale', icon: 'ri-translate-2' },
  { key: 'security', icon: 'ri-shield-keyhole-line' },
  { key: 'history', icon: 'ri-history-line' },
];

const LANG_NAMES: Record<LangCode, string> = { ar: 'العربية', en: 'English', ur: 'اردو', id: 'Bahasa Indonesia' };

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const today = () => new Date().toISOString().slice(0, 10);

function PctInput({ value, onChange, min, max, step = 0.1, id }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; id: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input
        id={id}
        type="number"
        dir="ltr"
        step={step}
        min={min !== undefined ? min * 100 : undefined}
        max={max !== undefined ? max * 100 : undefined}
        value={Number((value * 100).toFixed(2))}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
      <span className="muted small">%</span>
    </div>
  );
}

function NumInput({ value, onChange, id, step = 1, suffix }: {
  value: number; onChange: (v: number) => void; id: string; step?: number; suffix?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input id={id} type="number" dir="ltr" step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {suffix && <span className="muted small">{suffix}</span>}
    </div>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <div className="small muted" style={{ marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function Toggle({ id, checked, onChange, label }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="switch" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" />
      <span className="small">{label}</span>
    </label>
  );
}

export default function AdminPlatformSettings() {
  const { t, i18n } = useTranslation();
  const isAr = (i18n.resolvedLanguage || i18n.language || 'ar').startsWith('ar');
  const live = usePlatformConfig();
  const versions = usePlatformVersions();
  const { fullName, user } = useAuth();
  const { demo } = useAccess();

  const [tab, setTab] = useState<Tab>('revenue');
  const [draft, setDraft] = useState<PlatformConfig>(() => clone(live));
  const [effectiveFrom, setEffectiveFrom] = useState(today());
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => { loadPlatformConfig(); }, []);
  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const normalized = useMemo(() => normalizeConfig(draft), [draft]);
  const problems = configProblems(normalized);
  const dirty = JSON.stringify(normalizeConfig(live)) !== JSON.stringify(normalized);
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const L = (key: string, opts?: Record<string, unknown>) => t(`platform.settings.${key}`, opts);

  /* Immutable update helper: edit(d => { d.take.retail.value = 0.17 }) */
  const edit = (fn: (d: PlatformConfig) => void) => setDraft((prev) => {
    const next = clone(prev);
    fn(next);
    return next;
  });

  const publish = async () => {
    if (problems.length) {
      setToast(L('blocked'));
      return;
    }
    if (!note.trim()) {
      setToast(L('noteRequired'));
      return;
    }
    setBusy(true);
    const res = await publishConfig(normalized, {
      note: note.trim(),
      effectiveFrom,
      author: fullName || user?.email || 'admin',
      demo,
    });
    setBusy(false);
    if (!res.ok) {
      setToast(L('publishFailed', { error: res.error ?? '' }));
      return;
    }
    setNote('');
    setToast(L('published', { version: res.version }));
  };

  const worstR = worstCaseRetailMargin(normalized);
  const worstW = worstCaseWholesaleMargin(normalized);
  const catName = (id: string, fallback: string) => (isAr ? fallback : ((categoryText as Record<string, { name?: string }>)[id]?.name ?? fallback));

  return (
    <>
      <PageHead eyebrow={L('eyebrow')} title={L('title')} sub={L('sub')} />
      <div className="grid c4 mb">
        <Stat icon="ri-store-2-line" num={pct(normalized.take.retail.value)} lbl={L('statRetailTake')} />
        <Stat icon="ri-stack-line" num={pct(normalized.take.wholesale.value)} lbl={L('statWholesaleTake')} />
        <Stat icon="ri-shield-check-line" num={pct(worstR)} lbl={L('statWorstRetail')} up={worstR >= 0} delta={worstR >= normalized.costs.netFloor ? L('ok') : L('loss')} />
        <Stat icon="ri-scales-3-line" num={pct(worstW)} lbl={L('statWorstWholesale')} up={worstW >= 0} delta={worstW >= normalized.costs.netFloor ? L('ok') : L('loss')} />
      </div>

      <div className="row-between wrap mb" style={{ gap: 10 }}>
        <div className="seg compact" role="tablist" aria-label={L('title')}>
          {TABS.map((tb) => (
            <button key={tb.key} type="button" role="tab" aria-selected={tab === tb.key} className={tab === tb.key ? 'is-on' : ''} onClick={() => setTab(tb.key)}>
              <i className={tb.icon} /> {L(`tab_${tb.key}`)}
            </button>
          ))}
        </div>
        <Pill tone={dirty ? 'warn' : 'ok'}>{dirty ? L('draftDirty') : L('draftClean', { version: live.version })}</Pill>
      </div>

      {tab === 'revenue' && (
        <>
          <Card className="mb" title={L('takeTitle')} sub={L('takeSub')}>
            <div className="grid c2">
              {(['retail', 'wholesale'] as SalesChannel[]).map((ch) => (
                <Field key={ch} id={`take-${ch}`} label={L(`take_${ch}`)} hint={L('band', { min: pct(draft.take[ch].min), max: pct(draft.take[ch].max) })}>
                  <PctInput id={`take-${ch}`} value={draft.take[ch].value} min={draft.take[ch].min} max={draft.take[ch].max} onChange={(v) => edit((d) => { d.take[ch].value = v; })} />
                </Field>
              ))}
            </div>
          </Card>

          <Card className="mb" title={L('tiersTitle')} sub={L('tiersSub', { days: draft.ambassador.tierWindowDays })}>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>{L('tierName')}</th><th>{L('tierNameEn')}</th><th>{L('tierMin')}</th><th>{L('tierRate')}</th></tr>
                </thead>
                <tbody>
                  {draft.ambassador.retailTiers.map((tier, i) => (
                    <tr key={tier.id}>
                      <td className="field" style={{ marginBottom: 0 }}><input aria-label={L('tierName')} value={tier.labelAr} onChange={(e) => edit((d) => { d.ambassador.retailTiers[i].labelAr = e.target.value; })} /></td>
                      <td className="field" style={{ marginBottom: 0 }}><input aria-label={L('tierNameEn')} dir="ltr" value={tier.labelEn} onChange={(e) => edit((d) => { d.ambassador.retailTiers[i].labelEn = e.target.value; })} /></td>
                      <td className="field" style={{ marginBottom: 0 }}><NumInput id={`tier-min-${i}`} value={tier.minOrders} onChange={(v) => edit((d) => { d.ambassador.retailTiers[i].minOrders = v; })} /></td>
                      <td className="field" style={{ marginBottom: 0 }}><PctInput id={`tier-rate-${i}`} value={tier.rate} max={0.1} onChange={(v) => edit((d) => { d.ambassador.retailTiers[i].rate = v; })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid c3" style={{ marginTop: 14 }}>
              <Field id="tier-window" label={L('tierWindow')}>
                <NumInput id="tier-window" value={draft.ambassador.tierWindowDays} suffix={L('days')} onChange={(v) => edit((d) => { d.ambassador.tierWindowDays = v; })} />
              </Field>
              <Field id="retail-scope" label={L('retailScope')} hint={L('retailScopeHint')}>
                <select id="retail-scope" value={draft.ambassador.retailScope} onChange={(e) => edit((d) => { d.ambassador.retailScope = e.target.value as PlatformConfig['ambassador']['retailScope']; })}>
                  <option value="first_order">{L('scopeFirst')}</option>
                  <option value="every_order_in_window">{L('scopeWindow')}</option>
                </select>
              </Field>
              <Field id="attr-days" label={L('attributionDays')}>
                <NumInput id="attr-days" value={draft.ambassador.attributionDays} suffix={L('days')} onChange={(v) => edit((d) => { d.ambassador.attributionDays = v; })} />
              </Field>
            </div>
          </Card>

          <Card className="mb" title={L('wholesaleAmbTitle')} sub={L('wholesaleAmbSub')}>
            <div className="grid c4">
              <Field id="amb-w" label={L('ambWholesale')} hint={L('band', { min: pct(draft.ambassador.wholesale.min), max: pct(draft.ambassador.wholesale.max) })}>
                <PctInput id="amb-w" value={draft.ambassador.wholesale.value} onChange={(v) => edit((d) => { d.ambassador.wholesale.value = v; })} />
              </Field>
              <Field id="amb-months" label={L('recurringMonths')}>
                <NumInput id="amb-months" value={draft.ambassador.wholesaleRecurringMonths} suffix={L('months')} onChange={(v) => edit((d) => { d.ambassador.wholesaleRecurringMonths = v; })} />
              </Field>
              <Field id="leader" label={L('leaderBonus')} hint={L('leaderHint')}>
                <PctInput id="leader" value={draft.ambassador.leaderBonus} max={0.02} onChange={(v) => edit((d) => { d.ambassador.leaderBonus = v; })} />
              </Field>
              <Field id="min-payout" label={L('minPayout')}>
                <NumInput id="min-payout" value={draft.ambassador.minPayout} suffix={L('sar')} onChange={(v) => edit((d) => { d.ambassador.minPayout = v; })} />
              </Field>
            </div>
          </Card>

          <Card className="mb" title={L('costsTitle')} sub={L('costsSub')}>
            <div className="grid c3">
              {(['retail', 'wholesale'] as SalesChannel[]).map((ch) => (
                <Field key={`fee-${ch}`} id={`fee-${ch}`} label={L(`fee_${ch}`)}>
                  <PctInput id={`fee-${ch}`} value={draft.costs.paymentFee[ch]} onChange={(v) => edit((d) => { d.costs.paymentFee[ch] = v; })} />
                </Field>
              ))}
              {(['retail', 'wholesale'] as SalesChannel[]).map((ch) => (
                <Field key={`res-${ch}`} id={`res-${ch}`} label={L(`reserve_${ch}`)}>
                  <PctInput id={`res-${ch}`} value={draft.costs.returnReserve[ch]} onChange={(v) => edit((d) => { d.costs.returnReserve[ch] = v; })} />
                </Field>
              ))}
              <Field id="floor" label={L('netFloor')} hint={L('netFloorHint')}>
                <PctInput id="floor" value={draft.costs.netFloor} onChange={(v) => edit((d) => { d.costs.netFloor = v; })} />
              </Field>
            </div>
          </Card>
        </>
      )}

      {tab === 'promo' && (
        <Card className="mb" title={L('promoTitle')} sub={L('promoSub')}>
          <div className="grid c3">
            <Field id="cap" label={L('promoCap')} hint={L('promoCapHint')}>
              <PctInput id="cap" value={draft.promo.capRate} max={0.1} onChange={(v) => edit((d) => { d.promo.capRate = v; })} />
            </Field>
            <Field id="amb-code" label={L('ambCodeRate')} hint={L('ambCodeHint')}>
              <PctInput id="amb-code" value={draft.promo.ambassadorCodeRate} max={draft.promo.capRate} onChange={(v) => edit((d) => { d.promo.ambassadorCodeRate = v; })} />
            </Field>
            <div className="field">
              <label>{L('promoChannels')}</label>
              {(['retail', 'wholesale'] as SalesChannel[]).map((ch) => (
                <div key={ch} style={{ marginBottom: 8 }}>
                  <Toggle
                    id={`promo-${ch}`}
                    checked={draft.promo.channels.includes(ch)}
                    label={L(`channel_${ch}`)}
                    onChange={(on) => edit((d) => {
                      d.promo.channels = on ? Array.from(new Set([...d.promo.channels, ch])) : d.promo.channels.filter((c) => c !== ch);
                    })}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="note"><i className="ri-information-line" /><span>{L('promoNote')}</span></div>
        </Card>
      )}
      {tab === 'promo' && <PromoCodesCard capRate={live.promo.capRate} demo={demo} onToast={setToast} />}

      {tab === 'shipping' && (
        <>
          <Card className="mb" title={L('retailShipTitle')} sub={L('retailShipSub')}>
            <div className="grid c4">
              <Field id="min-order" label={L('minOrder')}>
                <NumInput id="min-order" value={draft.shipping.retail.minOrder} suffix={L('sar')} onChange={(v) => edit((d) => { d.shipping.retail.minOrder = v; })} />
              </Field>
              <Field id="max-share" label={L('maxShare')}>
                <PctInput id="max-share" value={draft.shipping.retail.maxShare} onChange={(v) => edit((d) => { d.shipping.retail.maxShare = v; })} />
              </Field>
              <div className="field">
                <label>{L('shareCustoms')}</label>
                <Toggle id="share-customs" checked={draft.shipping.retail.shareIncludesCustoms} label={draft.shipping.retail.shareIncludesCustoms ? L('yes') : L('no')} onChange={(v) => edit((d) => { d.shipping.retail.shareIncludesCustoms = v; })} />
              </div>
              <div className="field">
                <label>{L('groupOrder')}</label>
                <Toggle id="group-on" checked={draft.shipping.groupOrder.enabled} label={draft.shipping.groupOrder.enabled ? L('enabled') : L('disabled')} onChange={(v) => edit((d) => { d.shipping.groupOrder.enabled = v; })} />
              </div>
              <Field id="group-fee" label={L('groupFee')}>
                <NumInput id="group-fee" value={draft.shipping.groupOrder.handlingFee} suffix={L('sar')} onChange={(v) => edit((d) => { d.shipping.groupOrder.handlingFee = v; })} />
              </Field>
              <Field id="group-min" label={L('groupMin')}>
                <NumInput id="group-min" value={draft.shipping.groupOrder.minParticipants} onChange={(v) => edit((d) => { d.shipping.groupOrder.minParticipants = v; })} />
              </Field>
              <Field id="w-handling" label={L('wholesaleHandling')}>
                <NumInput id="w-handling" value={draft.shipping.wholesale.handlingFee} suffix={L('sar')} onChange={(v) => edit((d) => { d.shipping.wholesale.handlingFee = v; })} />
              </Field>
              <Field id="w-seamin" label={L('seaMinimum')}>
                <NumInput id="w-seamin" value={draft.shipping.wholesale.seaMinimum} suffix={L('sar')} onChange={(v) => edit((d) => { d.shipping.wholesale.seaMinimum = v; })} />
              </Field>
            </div>
          </Card>

          <Card className="mb" title={L('zonesTitle')} sub={L('zonesSub')}>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{L('zone')}</th><th>{L('expBase')}</th><th>{L('expPerKg')}</th><th>{L('customs')}</th>
                    <th>{L('returnDays')}</th><th>{L('seaPerKg')}</th><th>{L('airPerKg')}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(draft.shipping.express).map((z) => (
                    <tr key={z}>
                      <td className="strong">{L(`zone_${z}`)}</td>
                      <td className="field" style={{ marginBottom: 0 }}><NumInput id={`zb-${z}`} value={draft.shipping.express[z].base} onChange={(v) => edit((d) => { d.shipping.express[z].base = v; })} /></td>
                      <td className="field" style={{ marginBottom: 0 }}><NumInput id={`zk-${z}`} step={0.5} value={draft.shipping.express[z].perKg} onChange={(v) => edit((d) => { d.shipping.express[z].perKg = v; })} /></td>
                      <td className="field" style={{ marginBottom: 0 }}><PctInput id={`zc-${z}`} value={draft.shipping.express[z].customs} onChange={(v) => edit((d) => { d.shipping.express[z].customs = v; if (d.shipping.consolidated[z]) d.shipping.consolidated[z].customs = v; })} /></td>
                      <td className="field" style={{ marginBottom: 0 }}><NumInput id={`zr-${z}`} value={draft.shipping.express[z].returnDays} onChange={(v) => edit((d) => { d.shipping.express[z].returnDays = v; if (d.shipping.consolidated[z]) d.shipping.consolidated[z].returnDays = v; })} /></td>
                      <td className="field" style={{ marginBottom: 0 }}><NumInput id={`zs-${z}`} step={0.5} value={draft.shipping.consolidated[z]?.sea ?? 0} onChange={(v) => edit((d) => { d.shipping.consolidated[z].sea = v; })} /></td>
                      <td className="field" style={{ marginBottom: 0 }}><NumInput id={`za-${z}`} step={0.5} value={draft.shipping.consolidated[z]?.air ?? 0} onChange={(v) => edit((d) => { d.shipping.consolidated[z].air = v; })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="mb" title={L('countriesTitle')} sub={L('countriesSub')}>
            <div className="grid c4">
              {Object.keys(draft.shipping.countryZone).sort().map((cc) => (
                <Field key={cc} id={`cz-${cc}`} label={cc.toUpperCase()}>
                  <select id={`cz-${cc}`} value={draft.shipping.countryZone[cc]} onChange={(e) => edit((d) => { d.shipping.countryZone[cc] = e.target.value; })}>
                    {Object.keys(draft.shipping.express).map((z) => <option key={z} value={z}>{L(`zone_${z}`)}</option>)}
                  </select>
                </Field>
              ))}
            </div>
          </Card>
        </>
      )}

      {tab === 'catalog' && (
        <>
          <Card className="mb" title={L('categoriesTitle')} sub={L('categoriesSub')}>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>{L('category')}</th><th>{L('visible')}</th><th>{L('retailEligible')}</th></tr></thead>
                <tbody>
                  {baseCategories.map((c) => (
                    <tr key={c.id}>
                      <td><i className={c.icon} /> {catName(c.id, c.name)}</td>
                      <td>
                        <Toggle id={`cat-${c.id}`} checked={draft.catalog.enabledCategories.includes(c.id)} label="" onChange={(on) => edit((d) => {
                          d.catalog.enabledCategories = on ? [...d.catalog.enabledCategories, c.id] : d.catalog.enabledCategories.filter((x) => x !== c.id);
                        })} />
                      </td>
                      <td>
                        <Toggle id={`ret-${c.id}`} checked={draft.catalog.retailCategories.includes(c.id)} label="" onChange={(on) => edit((d) => {
                          d.catalog.retailCategories = on ? [...d.catalog.retailCategories, c.id] : d.catalog.retailCategories.filter((x) => x !== c.id);
                        })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{L('categoriesNote')}</span></div>
          </Card>

          <Card className="mb" title={L('channelsTitle')} sub={L('channelsSub')}>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>{L('channel')}</th><th>{L('enabled')}</th><th>{L('launch')}</th></tr></thead>
                <tbody>
                  {draft.channels.map((c, i) => (
                    <tr key={c.id}>
                      <td><i className={c.icon} /> {isAr ? c.labelAr : c.labelEn}</td>
                      <td><Toggle id={`ch-${c.id}`} checked={c.enabled} label="" onChange={(on) => edit((d) => { d.channels[i].enabled = on || d.channels[i].launch; })} /></td>
                      <td>
                        <input
                          type="radio"
                          name="launch-channel"
                          aria-label={L('launch')}
                          checked={c.launch}
                          onChange={() => edit((d) => { d.channels.forEach((x, j) => { x.launch = j === i; if (j === i) x.enabled = true; }); })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === 'locale' && (
        <>
          <Card className="mb" title={L('languagesTitle')} sub={L('languagesSub')}>
            <div className="grid c4">
              {(['ar', 'en', 'ur', 'id'] as LangCode[]).map((lng) => (
                <Toggle
                  key={lng}
                  id={`lng-${lng}`}
                  checked={draft.locale.languages.includes(lng)}
                  label={LANG_NAMES[lng]}
                  onChange={(on) => edit((d) => {
                    if (lng === 'ar') return;
                    d.locale.languages = on ? Array.from(new Set([...d.locale.languages, lng])) : d.locale.languages.filter((x) => x !== lng);
                  })}
                />
              ))}
            </div>
          </Card>
          <Card className="mb" title={L('fxTitle')} sub={L('fxSub')}>
            <div className="grid c4">
              {draft.locale.currencies.map((c, i) => (
                <Field key={c.code} id={`fx-${c.code}`} label={`${c.code} ${L('perSar')}`}>
                  <NumInput id={`fx-${c.code}`} step={0.0001} value={c.perSar} onChange={(v) => edit((d) => { if (d.locale.currencies[i].code !== 'SAR') d.locale.currencies[i].perSar = v; })} />
                </Field>
              ))}
            </div>
          </Card>
        </>
      )}

      {tab === 'security' && (
        <Card className="mb" title={L('securityTitle')} sub={L('securitySub')}>
          <div className="grid c2">
            <Toggle id="sec-mfa" checked={draft.security.requireMfaForAdmin} label={L('requireMfa')} onChange={(v) => edit((d) => { d.security.requireMfaForAdmin = v; })} />
            <Toggle id="sec-demo" checked={draft.security.demoLogin} label={L('demoLogin')} onChange={(v) => edit((d) => { d.security.demoLogin = v; })} />
          </div>
          <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{L('securityNote')}</span></div>
        </Card>
      )}

      {tab === 'history' && (
        <Card className="mb" title={L('historyTitle')} sub={L('historySub')}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{L('version')}</th><th>{L('effectiveFrom')}</th><th>{L('note')}</th><th>{L('author')}</th><th /></tr></thead>
              <tbody>
                {versions.length === 0 && (
                  <tr><td colSpan={5} className="muted small">{L('historyEmpty', { version: live.version })}</td></tr>
                )}
                {versions.map((v) => (
                  <tr key={v.version}>
                    <td className="strong">v{v.version} {v.version === live.version && <Pill tone="ok">{L('active')}</Pill>}</td>
                    <td>{v.effectiveFrom} {v.effectiveFrom > today() && <Pill tone="warn">{L('scheduled')}</Pill>}</td>
                    <td className="small">{v.note}</td>
                    <td className="small muted">{v.createdBy}</td>
                    <td>
                      <button type="button" className="btn ghost sm" onClick={() => { setDraft(clone(v.payload)); setTab('revenue'); setToast(L('loadedDraft', { version: v.version })); }}>
                        <i className="ri-file-copy-2-line" /> {L('useAsDraft')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card title={L('publishTitle')} sub={L('publishSub')}>
        {problems.length > 0 && (
          <div className="note mb" role="alert">
            <i className="ri-error-warning-line" style={{ color: '#b3261e' }} />
            <span>{problems.map((p) => L(`problem_${p}`)).join(' · ')}</span>
          </div>
        )}
        <div className="grid c3">
          <Field id="eff" label={L('effectiveFrom')} hint={L('effectiveHint')}>
            <input id="eff" type="date" dir="ltr" value={effectiveFrom} min={today()} onChange={(e) => setEffectiveFrom(e.target.value)} />
          </Field>
          <Field id="pub-note" label={L('decisionNote')} hint={L('decisionHint')}>
            <input id="pub-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={L('decisionPh')} />
          </Field>
          <div className="field" style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <button type="button" className="btn ghost" onClick={() => setDraft(clone(live))} disabled={!dirty}>
              <i className="ri-arrow-go-back-line" /> {L('discard')}
            </button>
            <button type="button" className="btn primary" onClick={publish} disabled={busy || !dirty || problems.length > 0}>
              <i className={busy ? 'ri-loader-4-line' : 'ri-send-plane-line'} /> {L('publish')}
            </button>
          </div>
        </div>
        {demo && <div className="note"><i className="ri-flask-line" /><span>{L('demoNote')}</span></div>}
      </Card>

      <Toast message={toast} />
    </>
  );
}
