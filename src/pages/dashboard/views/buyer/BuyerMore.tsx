import { useEffect, useState } from 'react';
import type { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { loadJson, saveJson } from '@/pages/dashboard/lib/persist';
import { useBuyerExport } from '@/hooks/useBuyerExport';
import { Card, Pill, PageHead, Modal, Switch, Bar, Toast } from '@/pages/dashboard/components/ui';

type Address = { name: string; country: string; detail: string; phone: string; def: boolean };

function BuyerAddresses() {
  const { t } = useTranslation();
  const d = useDashboard();
  const [list, setList] = useState<Address[]>(
    () => loadJson<Address[]>('sta-buyer-addresses', d.buyerAddresses.map((a) => ({ ...a }))),
  );
  const [open, setOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState<Address>({ name: '', country: '', detail: '', phone: '', def: false });
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => { saveJson('sta-buyer-addresses', list); }, [list]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2800);
  };

  const openNew = () => {
    setEditIdx(null);
    setError('');
    setForm({ name: '', country: '', detail: '', phone: '', def: list.length === 0 });
    setOpen(true);
  };

  const openEdit = (i: number) => {
    setEditIdx(i);
    setError('');
    const a = list[i];
    setForm({ name: a.name, country: a.country, detail: a.detail, phone: a.phone, def: !!a.def });
    setOpen(true);
  };

  const save = () => {
    const name = form.name.trim();
    const country = form.country.trim();
    if (!name || !country) {
      setError(t('dashboard.buyerAddr.required'));
      return;
    }
    const entry: Address = {
      name, country, detail: form.detail.trim(), phone: form.phone.trim(), def: form.def,
    };
    setList((prev) => {
      let next = editIdx !== null ? prev.map((a, i) => (i === editIdx ? entry : a)) : [...prev, entry];
      if (entry.def) {
        const defIndex = editIdx !== null ? editIdx : next.length - 1;
        next = next.map((a, i) => ({ ...a, def: i === defIndex }));
      } else if (next.length && !next.some((a) => a.def)) {
        next = next.map((a, i) => ({ ...a, def: i === 0 }));
      }
      return next;
    });
    setOpen(false);
    flash(t('dashboard.buyerAddr.savedToast'));
  };

  const remove = (i: number) => {
    setList((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      if (next.length && !next.some((a) => a.def)) {
        return next.map((a, idx) => ({ ...a, def: idx === 0 }));
      }
      return next;
    });
    flash(t('dashboard.buyerAddr.removedToast'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.buyerAddr.eyebrow')}
        title={t('dashboard.buyerAddr.title')}
        sub={t('dashboard.buyerAddr.sub')}
        actions={<button type="button" className="btn primary" onClick={openNew}><i className="ri-add-line" /> {t('dashboard.buyerAddr.addNew')}</button>}
      />
      <div className="grid c3">
        {list.map((a, i) => (
          <Card key={`${a.name}-${i}`} className="tight">
            <div className="card-head">
              <div>
                <h3>{a.name}</h3>
                <div className="sub">{a.country}</div>
              </div>
              {a.def && <Pill tone="ok">{t('dashboard.common.defaultBadge')}</Pill>}
            </div>
            <p className="small muted mb">{a.detail}</p>
            {a.phone && <p className="small"><i className="ri-phone-line" /> {a.phone}</p>}
            <div className="divider" />
            <div className="row-between" style={{ gap: 8 }}>
              <button type="button" className="btn sm ghost" onClick={() => openEdit(i)}><i className="ri-pencil-line" /> {t('dashboard.common.edit')}</button>
              <button type="button" className="btn sm ghost" onClick={() => remove(i)}><i className="ri-delete-bin-6-line" /> {t('dashboard.common.remove')}</button>
            </div>
          </Card>
        ))}
        {!list.length && (
          <div className="empty" style={{ gridColumn: '1 / -1' }}>
            <i className="ri-map-pin-add-line" />
            <div>{t('dashboard.buyerAddr.empty')}</div>
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editIdx !== null ? t('dashboard.buyerAddr.modalTitleEdit') : t('dashboard.buyerAddr.modalTitleNew')}
        sub={t('dashboard.buyerAddr.modalSub')}
      >
        <div className="grid c2">
          <div className="field">
            <label htmlFor="addr-name">{t('dashboard.buyerAddr.labelField')}</label>
            <input
              id="addr-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={t('dashboard.buyerAddr.labelPlaceholder')}
            />
          </div>
          <div className="field">
            <label htmlFor="addr-country">{t('dashboard.buyerAddr.countryField')}</label>
            <input
              id="addr-country"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              placeholder={t('dashboard.buyerAddr.countryPlaceholder')}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="addr-detail">{t('dashboard.buyerAddr.detailField')}</label>
          <textarea
            id="addr-detail"
            maxLength={500}
            value={form.detail}
            onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
            placeholder={t('dashboard.buyerAddr.detailPlaceholder')}
          />
        </div>
        <div className="field">
          <label htmlFor="addr-phone">{t('dashboard.buyerAddr.phoneField')}</label>
          <input
            id="addr-phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder={t('dashboard.buyerAddr.phonePlaceholder')}
          />
        </div>
        <Switch
          checked={form.def}
          onChange={(v) => setForm((f) => ({ ...f, def: v }))}
          label={t('dashboard.buyerAddr.defaultToggle')}
        />
        {error && <div className="pill danger" style={{ marginTop: 12 }}><i className="ri-error-warning-line" /> {error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={save}><i className="ri-save-3-line" /> {t('dashboard.common.save')}</button>
          <button type="button" className="btn ghost" onClick={() => setOpen(false)}>{t('dashboard.common.cancel')}</button>
        </div>
      </Modal>

      <Toast message={toast} />
    </>
  );
}

type SavedCard = { brand: string; last4: string; exp: string; holder: string; def: boolean };

function cardBrand(digits: string) {
  if (digits.startsWith('4')) return 'VISA';
  if (digits.startsWith('5') || digits.startsWith('2')) return 'MASTERCARD';
  if (digits.startsWith('34') || digits.startsWith('37')) return 'AMEX';
  return 'CARD';
}

function BuyerPayments() {
  const { t } = useTranslation();
  const d = useDashboard();
  const [balance] = useState(d.buyerStats[1]?.num ?? '');
  const [cards, setCards] = useState<SavedCard[]>(
    () => loadJson<SavedCard[]>('sta-buyer-cards', d.buyerCards.map((c) => ({ ...c }))),
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ number: '', holder: '', exp: '', def: false });
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => { saveJson('sta-buyer-cards', cards); }, [cards]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2800);
  };

  const openNew = () => {
    setError('');
    setForm({ number: '', holder: '', exp: '', def: cards.length === 0 });
    setOpen(true);
  };

  const formatNumber = (v: string) => v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
  const formatExp = (v: string) => {
    const n = v.replace(/\D/g, '').slice(0, 4);
    return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
  };

  const save = () => {
    const digits = form.number.replace(/\s/g, '');
    if (digits.length < 12 || !form.holder.trim()) {
      setError(t('dashboard.buyerPay.cardRequired'));
      return;
    }
    const entry: SavedCard = {
      brand: cardBrand(digits),
      last4: digits.slice(-4),
      exp: form.exp || '—',
      holder: form.holder.trim().toUpperCase(),
      def: form.def,
    };
    setCards((prev) => {
      let next = [...prev, entry];
      if (entry.def) next = next.map((c, i) => ({ ...c, def: i === next.length - 1 }));
      else if (!next.some((c) => c.def)) next = next.map((c, i) => ({ ...c, def: i === 0 }));
      return next;
    });
    setOpen(false);
    flash(t('dashboard.buyerPay.cardSavedToast'));
  };

  const removeCard = (i: number) => {
    setCards((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      if (next.length && !next.some((c) => c.def)) return next.map((c, idx) => ({ ...c, def: idx === 0 }));
      return next;
    });
    flash(t('dashboard.buyerPay.cardRemovedToast'));
  };

  const makeDefault = (i: number) => setCards((prev) => prev.map((c, idx) => ({ ...c, def: idx === i })));

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.buyerPay.eyebrow')}
        title={t('dashboard.buyerPay.title')}
        sub={t('dashboard.buyerPay.sub')}
        actions={<button type="button" className="btn primary" onClick={openNew}><i className="ri-add-line" /> {t('dashboard.buyerPay.addCard')}</button>}
      />
      <div className="split">
        <Card title={t('dashboard.buyerPay.savedCards')} sub={t('dashboard.buyerPay.savedCardsSub')}>
          <div className="grid c2">
            {cards.map((c, i) => (
              <div className="paycard" key={`${c.brand}-${c.last4}-${i}`}>
                <button type="button" className="paycard-del" aria-label={t('dashboard.common.remove')} onClick={() => removeCard(i)}>
                  <i className="ri-delete-bin-6-line" />
                </button>
                <div className="row-between">
                  <span className="strong">{c.brand}</span>
                  {c.def ? (
                    <span className="pill ok">{t('dashboard.buyerPay.defaultCard')}</span>
                  ) : (
                    <button type="button" className="paycard-mini" onClick={() => makeDefault(i)}>{t('dashboard.buyerPay.makeDefault')}</button>
                  )}
                </div>
                <div className="num">•••• •••• •••• {c.last4}</div>
                <div className="row">
                  <span>{c.holder}</span>
                  <span>{c.exp}</span>
                </div>
              </div>
            ))}
            <button type="button" className="paycard add" onClick={openNew}>
              <i className="ri-add-circle-line" style={{ fontSize: 26 }} />
              <span>{t('dashboard.buyerPay.addCardTile')}</span>
            </button>
          </div>
        </Card>

        <Card title={t('dashboard.buyerPay.wallet')} sub={t('dashboard.buyerPay.walletSub')}>
          <div className="stat" style={{ border: 'none', padding: 0 }}>
            <div className="num accent">{balance}</div>
            <div className="lbl">{t('dashboard.buyerPay.availableFor')}</div>
          </div>
          <div className="divider" />
          <div className="list">
            <div className="list-row">
              <div className="ic"><i className="ri-gift-line" /></div>
              <div className="body">
                <div className="t">{t('dashboard.buyerPay.bonusCredit')}</div>
                <div className="s">{t('dashboard.buyerPay.bonusCreditSub')}</div>
              </div>
            </div>
          </div>
          <button type="button" className="btn block primary" style={{ marginTop: 12 }}>
            <i className="ri-shopping-bag-3-line" /> {t('dashboard.buyerPay.useBalance')}
          </button>
        </Card>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('dashboard.buyerPay.addCardTitle')}
        sub={t('dashboard.buyerPay.addCardSub')}
      >
        <div className="field">
          <label htmlFor="card-number">{t('dashboard.buyerPay.cardNumberField')}</label>
          <input
            id="card-number"
            inputMode="numeric"
            autoComplete="cc-number"
            value={form.number}
            onChange={(e) => setForm((f) => ({ ...f, number: formatNumber(e.target.value) }))}
            placeholder={t('dashboard.buyerPay.cardNumberPlaceholder')}
          />
        </div>
        <div className="field">
          <label htmlFor="card-holder">{t('dashboard.buyerPay.cardHolderField')}</label>
          <input
            id="card-holder"
            value={form.holder}
            onChange={(e) => setForm((f) => ({ ...f, holder: e.target.value }))}
            placeholder={t('dashboard.buyerPay.cardHolderPlaceholder')}
          />
        </div>
        <div className="field">
          <label htmlFor="card-exp">{t('dashboard.buyerPay.cardExpField')}</label>
          <input
            id="card-exp"
            inputMode="numeric"
            autoComplete="cc-exp"
            value={form.exp}
            onChange={(e) => setForm((f) => ({ ...f, exp: formatExp(e.target.value) }))}
            placeholder={t('dashboard.buyerPay.cardExpPlaceholder')}
          />
        </div>
        <Switch
          checked={form.def}
          onChange={(v) => setForm((f) => ({ ...f, def: v }))}
          label={t('dashboard.buyerPay.setDefaultToggle')}
        />
        {error && <div className="pill danger" style={{ marginTop: 12 }}><i className="ri-error-warning-line" /> {error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={save}><i className="ri-save-3-line" /> {t('dashboard.buyerPay.addCardBtn')}</button>
          <button type="button" className="btn ghost" onClick={() => setOpen(false)}>{t('dashboard.common.cancel')}</button>
        </div>
      </Modal>

      <Toast message={toast} />
    </>
  );
}

type ReturnRow = { id: string; order: string; item: string; reason: string; amount: string; status: string; tone: string };
type ReturnImage = { name: string; url: string };

function BuyerReturns() {
  const { t } = useTranslation();
  const d = useDashboard();
  const [list, setList] = useState<ReturnRow[]>(
    () => loadJson<ReturnRow[]>('sta-buyer-returns', d.buyerReturns.map((r) => ({ ...r }))),
  );
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState('SFR-20481');
  const [reason, setReason] = useState('');
  const [images, setImages] = useState<ReturnImage[]>([]);
  const pkg = useBuyerExport();
  const [toast, setToast] = useState('');

  useEffect(() => { saveJson('sta-buyer-returns', list); }, [list]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2800);
  };

  const reasons = [
    t('dashboard.buyerReturns.reasonDamaged'),
    t('dashboard.buyerReturns.reasonMismatch'),
    t('dashboard.buyerReturns.reasonSize'),
  ];

  const openModal = () => {
    setOrder('SFR-20481');
    setReason(reasons[0]);
    setImages([]);
    setOpen(true);
  };

  const onImages = (files: FileList | null) => {
    if (!files || !files.length) return;
    const room = 5 - images.length;
    if (room <= 0) return;
    const next = Array.from(files).slice(0, room).map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    setImages((prev) => [...prev, ...next]);
    flash(t('dashboard.buyerReturns.imageAddedToast'));
  };

  const submitReturn = () => {
    const row: ReturnRow = {
      id: `RET-${120 + list.length + 1}`,
      order,
      item: t('dashboard.buyerReturns.newRequestItem'),
      reason,
      amount: '—',
      status: d.buyerReturns[0]?.status ?? '',
      tone: 'warn',
    };
    setList((prev) => [row, ...prev]);
    setOpen(false);
    setImages([]);
    flash(t('dashboard.buyerReturns.createdToast'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.buyerReturns.eyebrow')}
        title={t('dashboard.buyerReturns.title')}
        sub={t('dashboard.buyerReturns.sub')}
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
            <button type="button" className="btn primary" onClick={openModal}>
              <i className="ri-arrow-go-back-line" /> {t('dashboard.buyerReturns.openRequest')}
            </button>
          </div>
        )}
      />
      <Card title={t('dashboard.buyerReturns.prevTitle')} sub={t('dashboard.buyerReturns.count', { count: list.length })}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('dashboard.buyerReturns.thId')}</th>
                <th>{t('dashboard.buyerReturns.thOrder')}</th>
                <th>{t('dashboard.buyerReturns.thItem')}</th>
                <th>{t('dashboard.buyerReturns.thReason')}</th>
                <th>{t('dashboard.buyerReturns.thAmount')}</th>
                <th>{t('dashboard.buyerReturns.thStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td className="strong">{r.id}</td>
                  <td className="muted">{r.order}</td>
                  <td>{r.item}</td>
                  <td className="muted">{r.reason}</td>
                  <td className="strong">{r.amount}</td>
                  <td><Pill tone={r.tone}>{r.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('dashboard.buyerReturns.modalTitle')}
        sub={t('dashboard.buyerReturns.modalSub')}
      >
        <div className="field">
          <label htmlFor="ret-order">{t('dashboard.buyerReturns.orderLabel')}</label>
          <select id="ret-order" value={order} onChange={(e) => setOrder(e.target.value)}>
            <option value="SFR-20481">SFR-20481</option>
            <option value="SFR-20462">SFR-20462</option>
            <option value="SFR-20430">SFR-20430</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="ret-reason">{t('dashboard.buyerReturns.reasonLabel')}</label>
          <select id="ret-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
            {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ret-note">{t('dashboard.buyerReturns.noteLabel')}</label>
          <textarea id="ret-note" maxLength={500} placeholder={t('dashboard.buyerReturns.notePlaceholder')} />
        </div>

        <label className={`drop-zone ${images.length ? 'has-file' : ''}`} htmlFor="ret-images">
          <i className={images.length ? 'ri-image-2-line' : 'ri-camera-line'} />
          <span>{images.length ? t('dashboard.buyerReturns.imagesLabel') : t('dashboard.buyerReturns.addImages')}</span>
          <span className="small">{t('dashboard.buyerReturns.imagesHint')}</span>
          <input
            id="ret-images"
            type="file"
            accept="image/*"
            multiple
            className="file-input-hidden"
            onChange={(e) => { onImages(e.target.files); e.target.value = ''; }}
          />
        </label>

        {images.length > 0 && (
          <div className="upload-grid">
            {images.map((img, i) => (
              <div className="upload-thumb" key={`${img.name}-${i}`}>
                <img src={img.url} alt={img.name} />
                <button
                  type="button"
                  className="upload-x"
                  aria-label={t('dashboard.common.remove')}
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <i className="ri-close-line" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="note" style={{ marginTop: 12 }}><i className="ri-camera-line" /> {t('dashboard.buyerReturns.note')}</div>
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={submitReturn}>{t('dashboard.common.send')}</button>
          <button type="button" className="btn ghost" onClick={() => setOpen(false)}>{t('dashboard.common.cancel')}</button>
        </div>
      </Modal>

      <Toast message={toast || pkg.toast} />
    </>
  );
}

type ChatMsg = { from: string; text: string; time: string };

function BuyerMessages() {
  const { t } = useTranslation();
  const d = useDashboard();
  const [active, setActive] = useState(d.buyerThreads[0].name);
  const [draft, setDraft] = useState('');
  const [logs, setLogs] = useState<Record<string, ChatMsg[]>>(
    () => loadJson<Record<string, ChatMsg[]>>('sta-buyer-messages', { [d.buyerThreads[0].name]: d.buyerMessages }),
  );

  useEffect(() => { saveJson('sta-buyer-messages', logs); }, [logs]);

  const log = logs[active] ?? [];

  const send = () => {
    if (!draft.trim()) return;
    const msg: ChatMsg = { from: 'me', text: draft, time: t('dashboard.common.now') };
    setLogs((prev) => ({ ...prev, [active]: [...(prev[active] ?? []), msg] }));
    setDraft('');
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.buyerMsg.eyebrow')}
        title={t('dashboard.buyerMsg.title')}
        sub={t('dashboard.buyerMsg.sub')}
      />
      <div className="split wide">
        <Card title={t('dashboard.buyerMsg.threads')} sub={t('dashboard.buyerMsg.count', { count: d.buyerThreads.length })}>
          <div className="list">
            {d.buyerThreads.map((thread) => (
              <div
                key={thread.name}
                className="list-row"
                onClick={() => setActive(thread.name)}
                style={{ cursor: 'pointer', background: active === thread.name ? 'var(--surface)' : 'transparent', borderRadius: 10, paddingInline: 10 }}
              >
                <div className="ic"><i className="ri-store-2-line" /></div>
                <div className="body">
                  <div className="t">{thread.name}</div>
                  <div className="s">{thread.last}</div>
                </div>
                <div className="end">
                  <span className="small muted">{thread.time}</span>
                  {thread.unread && <span className="pill warn">{t('dashboard.common.newBadge')}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title={active}
          sub={t('dashboard.buyerMsg.liveTranslation')}
          action={<span className="pill info"><i className="ri-translate-2" /> {t('dashboard.buyerMsg.auto')}</span>}
        >
          <div className="stack" style={{ gap: 10, marginBottom: 14 }}>
            {log.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.from === 'me' ? 'flex-start' : 'flex-end',
                  background: m.from === 'me' ? 'color-mix(in srgb, var(--accent) 14%, var(--panel))' : 'var(--surface)',
                  padding: '10px 13px',
                  borderRadius: 12,
                  maxWidth: '82%',
                }}
              >
                <div style={{ fontSize: 13.5 }}>{m.text}</div>
                <div className="small muted" style={{ marginTop: 3 }}>{m.time}</div>
              </div>
            ))}
          </div>
          <div className="row-between" style={{ gap: 8 }}>
            <div className="field" style={{ margin: 0, flex: 1 }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder={t('dashboard.buyerMsg.draftPlaceholder')}
                aria-label={t('dashboard.buyerMsg.draftAria')}
              />
            </div>
            <button type="button" className="btn primary" onClick={send}><i className="ri-send-plane-2-line" /></button>
          </div>
        </Card>
      </div>
    </>
  );
}

function BuyerAccount() {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const lang = (i18n.resolvedLanguage || i18n.language || 'ar').split('-')[0];
  const [notif, setNotif] = useState(true);
  const [offers, setOffers] = useState(true);
  const [profile, setProfile] = useState(() => ({
    name: d.buyerUser.name,
    phone: '+962 79 555 1212',
    email: 'ahmad@example.com',
    currency: 'SAR',
  }));
  const [accError, setAccError] = useState('');
  const [upOpen, setUpOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [biz, setBiz] = useState({ company: '', cr: '', volume: '' });
  const [docName, setDocName] = useState('');
  const [agree, setAgree] = useState(false);
  const [upError, setUpError] = useState('');
  const [toast, setToast] = useState('');

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2800);
  };

  const changeLang = (next: string) => {
    if (next !== lang) i18n.changeLanguage(next);
  };

  const saveProfile = () => {
    if (!profile.name.trim() || !profile.email.trim()) {
      setAccError(t('dashboard.buyerAccount.required'));
      return;
    }
    setAccError('');
    try {
      window.localStorage.setItem('sta-profile', JSON.stringify({ ...profile, lang }));
    } catch {
      /* storage may be unavailable — the toast still confirms the change */
    }
    flash(t('dashboard.buyerAccount.savedToast'));
  };

  const openUpgrade = () => {
    setStep(1);
    setUpError('');
    setUpOpen(true);
  };

  const nextStep = () => {
    if (step === 1 && (!biz.company.trim() || !biz.cr.trim())) {
      setUpError(t('dashboard.buyerAccount.bizRequired'));
      return;
    }
    if (step === 2 && !docName) {
      setUpError(t('dashboard.buyerAccount.docRequired'));
      return;
    }
    setUpError('');
    setStep((s) => Math.min(3, s + 1));
  };

  const submitUpgrade = () => {
    if (!agree) {
      setUpError(t('dashboard.buyerAccount.agreeRequired'));
      return;
    }
    setUpOpen(false);
    setStep(1);
    setBiz({ company: '', cr: '', volume: '' });
    setDocName('');
    setAgree(false);
    setUpError('');
    flash(t('dashboard.buyerAccount.requestSubmittedToast'));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.buyerAccount.eyebrow')}
        title={t('dashboard.buyerAccount.title')}
        sub={t('dashboard.buyerAccount.sub')}
      />
      <div className="split">
        <Card title={t('dashboard.buyerAccount.personal')} sub={t('dashboard.buyerAccount.personalSub')}>
          <div className="grid c2">
            <div className="field"><label htmlFor="acc-name">{t('dashboard.buyerAccount.fullName')}</label><input id="acc-name" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="field"><label htmlFor="acc-phone">{t('dashboard.buyerAccount.phone')}</label><input id="acc-phone" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} /></div>
          </div>
          <div className="field"><label htmlFor="acc-email">{t('dashboard.buyerAccount.email')}</label><input id="acc-email" type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} /></div>
          <div className="grid c2">
            <div className="field">
              <label htmlFor="acc-lang">{t('dashboard.buyerAccount.language')}</label>
              <select id="acc-lang" value={lang} onChange={(e) => changeLang(e.target.value)}>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="acc-cur">{t('dashboard.buyerAccount.currency')}</label>
              <select id="acc-cur" value={profile.currency} onChange={(e) => setProfile((p) => ({ ...p, currency: e.target.value }))}>
                <option value="SAR">SAR — ر.س</option>
                <option value="JOD">JOD — د.أ</option>
                <option value="USD">USD — $</option>
              </select>
            </div>
          </div>
          <div className="note" style={{ marginBottom: 14 }}>
            <i className="ri-information-line" />
            <span>{t('dashboard.buyerAccount.languageNote')} {t('dashboard.buyerAccount.currencyNote')}</span>
          </div>
          {accError && <div className="pill danger" style={{ marginBottom: 12 }}><i className="ri-error-warning-line" /> {accError}</div>}
          <button type="button" className="btn primary" onClick={saveProfile}><i className="ri-save-3-line" /> {t('dashboard.common.save')}</button>
        </Card>

        <div className="stack">
          <Card title={t('dashboard.buyerAccount.notifications')}>
            <div className="stack" style={{ gap: 14 }}>
              <Switch checked={notif} onChange={setNotif} label={t('dashboard.buyerAccount.notifOrders')} />
              <Switch checked={offers} onChange={setOffers} label={t('dashboard.buyerAccount.notifOffers')} />
            </div>
          </Card>

          <Card title={t('dashboard.buyerAccount.merchantAccount')}>
            <p className="small muted mb">{t('dashboard.buyerAccount.merchantText')}</p>
            <Bar value={30} />
            <p className="small muted" style={{ marginTop: 8 }}>{t('dashboard.buyerAccount.merchantProgress')}</p>
            <button type="button" className="btn block" style={{ marginTop: 12 }} onClick={openUpgrade}><i className="ri-store-2-line" /> {t('dashboard.buyerAccount.merchantUpgrade')}</button>
          </Card>
        </div>
      </div>

      <Modal
        open={upOpen}
        onClose={() => setUpOpen(false)}
        title={t('dashboard.buyerAccount.merchantModalTitle')}
        sub={t('dashboard.buyerAccount.merchantModalSub')}
      >
        <div className="steps">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`sdot ${step === n ? 'is-on' : ''} ${step > n ? 'is-done' : ''}`} />
          ))}
        </div>
        <div className="small muted" style={{ marginBottom: 14 }}>{t('dashboard.buyerAccount.stepOf', { n: step, total: 3 })}</div>

        {step === 1 && (
          <>
            <div className="step-title">{t('dashboard.buyerAccount.stepBizTitle')}</div>
            <div className="step-sub">{t('dashboard.buyerAccount.stepBizSub')}</div>
            <div className="field">
              <label htmlFor="biz-company">{t('dashboard.buyerAccount.companyLabel')}</label>
              <input id="biz-company" value={biz.company} onChange={(e) => setBiz((b) => ({ ...b, company: e.target.value }))} placeholder={t('dashboard.buyerAccount.companyPlaceholder')} />
            </div>
            <div className="field">
              <label htmlFor="biz-cr">{t('dashboard.buyerAccount.crLabel')}</label>
              <input id="biz-cr" value={biz.cr} onChange={(e) => setBiz((b) => ({ ...b, cr: e.target.value }))} placeholder={t('dashboard.buyerAccount.crPlaceholder')} />
            </div>
            <div className="field">
              <label htmlFor="biz-volume">{t('dashboard.buyerAccount.volumeLabel')}</label>
              <select id="biz-volume" value={biz.volume} onChange={(e) => setBiz((b) => ({ ...b, volume: e.target.value }))}>
                <option value="">—</option>
                <option value="low">{t('dashboard.buyerAccount.volumeLow')}</option>
                <option value="mid">{t('dashboard.buyerAccount.volumeMid')}</option>
                <option value="high">{t('dashboard.buyerAccount.volumeHigh')}</option>
              </select>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="step-title">{t('dashboard.buyerAccount.stepDocTitle')}</div>
            <div className="step-sub">{t('dashboard.buyerAccount.stepDocSub')}</div>
            <label className={`drop-zone ${docName ? 'has-file' : ''}`} htmlFor="merchant-doc">
              <i className={docName ? 'ri-file-text-line' : 'ri-upload-cloud-2-line'} />
              {docName ? (
                <>
                  <span className="fname">{t('dashboard.buyerAccount.docChosen')}</span>
                  <span className="small">{docName}</span>
                </>
              ) : (
                <>
                  <span>{t('dashboard.buyerAccount.docDropText')}</span>
                  <span className="small">{t('dashboard.buyerAccount.docHint')}</span>
                </>
              )}
              <input
                id="merchant-doc"
                type="file"
                accept=".pdf,image/*"
                className="file-input-hidden"
                onChange={(e) => setDocName(e.target.files?.[0]?.name ?? '')}
              />
            </label>
          </>
        )}

        {step === 3 && (
          <>
            <div className="step-title">{t('dashboard.buyerAccount.stepTermsTitle')}</div>
            <div className="step-sub">{t('dashboard.buyerAccount.stepTermsSub')}</div>
            <ul className="terms-list">
              <li><i className="ri-checkbox-circle-line" /> <span>{t('dashboard.buyerAccount.term1')}</span></li>
              <li><i className="ri-checkbox-circle-line" /> <span>{t('dashboard.buyerAccount.term2')}</span></li>
              <li><i className="ri-checkbox-circle-line" /> <span>{t('dashboard.buyerAccount.term3')}</span></li>
              <li><i className="ri-checkbox-circle-line" /> <span>{t('dashboard.buyerAccount.term4')}</span></li>
            </ul>
            <Switch checked={agree} onChange={setAgree} label={t('dashboard.buyerAccount.agreeLabel')} />
            <div className="note" style={{ marginTop: 12 }}><i className="ri-mail-line" /> {t('dashboard.buyerAccount.reviewNote')}</div>
          </>
        )}

        {upError && <div className="pill danger" style={{ marginTop: 12 }}><i className="ri-error-warning-line" /> {upError}</div>}

        <div className="modal-actions">
          {step > 1 && (
            <button type="button" className="btn ghost" onClick={() => { setUpError(''); setStep((s) => s - 1); }}>
              <i className="ri-arrow-go-back-line" /> {t('dashboard.buyerAccount.back')}
            </button>
          )}
          {step < 3 ? (
            <button type="button" className="btn primary" onClick={nextStep}>
              {t('dashboard.buyerAccount.next')} <i className="ri-arrow-left-line" />
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={submitUpgrade}>
              <i className="ri-send-plane-2-line" /> {t('dashboard.buyerAccount.submitRequest')}
            </button>
          )}
        </div>
      </Modal>

      <Toast message={toast} />
    </>
  );
}

export const buyerMoreViews: Record<string, FunctionComponent> = {
  addresses: BuyerAddresses,
  payments: BuyerPayments,
  returns: BuyerReturns,
  messages: BuyerMessages,
  account: BuyerAccount,
};