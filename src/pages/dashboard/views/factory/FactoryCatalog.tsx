import { useRef, useState } from 'react';
import type { ChangeEvent, FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { useDashboardNav } from '@/pages/dashboard/components/DashboardNav';
import { downloadCsv, parseCsv } from '@/pages/dashboard/lib/csv';
import { useFactoryOps, productTone } from '@/pages/dashboard/lib/factoryStore';
import {
  Card, Pill, PageHead, Modal, Toast,
} from '@/pages/dashboard/components/ui';

/* One row of the products table. The base catalogue carries rich detail
   fields; products the owner adds after the fact only have the essentials, so
   every extra field is optional and the detail modal degrades gracefully. */
interface ProductRow {
  key: string;
  name: string;
  price: string;
  stock: string;
  sales: string;
  img: string;
  cat?: string;
  sku?: string;
  hs?: string;
  cost?: string;
  margin?: string;
  min?: string;
  low?: boolean;
  rating?: string;
  views?: string;
  wishes?: string;
  updated?: string;
  desc?: string;
  baseStatus?: string;
  baseTone?: string;
  statusKey?: string;
}

function FactoryProducts() {
  const { t } = useTranslation();
  const d = useDashboard();
  const ops = useFactoryOps();
  const { go } = useDashboardNav();
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [lowOnly, setLowOnly] = useState(false);
  const [detail, setDetail] = useState<ProductRow | null>(null);
  const [editing, setEditing] = useState(false);
  const [eName, setEName] = useState('');
  const [ePrice, setEPrice] = useState('');
  const [eStock, setEStock] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  /* The table merges the base catalogue with everything the owner added, and
     resolves each status through the persisted overrides, then applies the
     saved edits so a renamed / repriced product shows its latest values. */
  const baseRows: ProductRow[] = [
    ...d.factoryProducts.map((p) => ({
      key: p.name, name: p.name, price: p.price, stock: p.stock, sales: p.sales, img: p.img,
      cat: p.category, sku: p.sku, hs: p.hs, cost: p.cost, margin: p.margin, min: p.min, low: p.low,
      rating: p.rating, views: p.views, wishes: p.wishes, updated: p.updated, desc: p.desc,
      baseStatus: p.status as string | undefined, baseTone: p.tone as string | undefined,
      statusKey: ops.productStatus[p.name] as string | undefined,
    })),
    ...ops.customProducts.map((p) => ({
      key: p.name, name: p.name, price: p.price, stock: p.stock, sales: p.sales, img: p.img,
      low: /^\s*0\s*$/.test(p.stock),
      baseStatus: undefined as string | undefined, baseTone: undefined as string | undefined,
      statusKey: (ops.productStatus[p.name] ?? p.statusKey) as string | undefined,
    })),
  ];
  const rows: ProductRow[] = baseRows.map((r) => {
    const edit = ops.productEdits[r.key];
    if (!edit) return r;
    const stock = edit.stock ?? r.stock;
    return { ...r, name: edit.name ?? r.name, price: edit.price ?? r.price, stock, low: /^\s*0\s*$/.test(stock) };
  });

  /* Opens the detail modal straight in edit mode and seeds the form. */
  const openEdit = (row: ProductRow) => {
    setDetail(row);
    setEName(row.name);
    setEPrice(row.price);
    setEStock(row.stock);
    setEditing(true);
  };

  /* Persists the name, price and stock changes, then reflects them in the
     open modal immediately. */
  const saveEdit = () => {
    if (!detail) return;
    const nextName = eName.trim() || detail.name;
    const nextPrice = ePrice.trim() || detail.price;
    const nextStock = eStock.trim() || detail.stock;
    ops.setProductEdit(detail.key, { name: nextName, price: nextPrice, stock: nextStock }, d.factoryUser.name);
    setDetail({ ...detail, name: nextName, price: nextPrice, stock: nextStock, low: /^\s*0\s*$/.test(nextStock) });
    setEditing(false);
    flash(t('dashboard.factory.products.savedEditToast'));
  };

  const statusKeyOf = (r: ProductRow): string => {
    if (r.statusKey) return r.statusKey;
    const raw = r.baseStatus ?? '';
    if (/منشور|publish/i.test(raw)) return 'published';
    if (/بانتظار|pending|await/i.test(raw)) return 'pending';
    if (/مرفوض|reject/i.test(raw)) return 'rejected';
    if (/مسودة|draft/i.test(raw)) return 'draft';
    return 'other';
  };
  const statusText = (r: ProductRow) => (statusKeyOf(r) !== 'other' ? t(`dashboard.factory.status.${statusKeyOf(r)}`) : (r.baseStatus ?? ''));
  const statusTone = (r: ProductRow) => (statusKeyOf(r) !== 'other' ? productTone(statusKeyOf(r)) : (r.baseTone ?? 'info'));

  const categories = Array.from(new Set(rows.map((r) => r.cat).filter(Boolean))) as string[];
  const lowCount = rows.filter((r) => r.low).length;
  const hasFilters = query.trim() !== '' || status !== 'all' || category !== 'all' || lowOnly;

  const filtered = rows.filter((r) => {
    if (status !== 'all' && statusKeyOf(r) !== status) return false;
    if (category !== 'all' && r.cat !== category) return false;
    if (lowOnly && !r.low) return false;
    const q = query.trim().toLowerCase();
    if (q) {
      return r.name.toLowerCase().includes(q) || (r.sku ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  const exportCsv = () => {
    downloadCsv(
      'factory-products.csv',
      [
        t('dashboard.factory.products.thProduct'),
        t('dashboard.factory.products.skuLabel'),
        t('dashboard.factory.products.thStatus'),
        t('dashboard.factory.products.thPrice'),
        t('dashboard.factory.products.thStock'),
        t('dashboard.factory.products.thSales'),
      ],
      filtered.map((p) => [p.name, p.sku ?? '', statusText(p), p.price, p.stock, p.sales]),
    );
    flash(t('dashboard.common.exportedFile', { file: 'factory-products.csv' }));
  };

  /* Reads a real CSV file, maps its columns (by header when present, otherwise
     positionally) and appends the rows to the products table. */
  const importCsv = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCsv(String(reader.result ?? ''));
        if (!parsed.length) { flash(t('dashboard.factory.products.importError')); return; }
        const header = parsed[0].map((c) => c.trim().toLowerCase());
        const cols = {
          name: ['product', 'name', 'product name', 'المنتج', 'الاسم', 'اسم المنتج'],
          status: ['status', 'الحالة'],
          price: ['price', 'السعر'],
          stock: ['stock', 'inventory', 'المخزون'],
          sales: ['sales', 'المبيعات'],
        };
        const idxOf = (list: string[]) => header.findIndex((h) => list.includes(h));
        const hasHeader = header.some((h) => cols.name.includes(h) || cols.status.includes(h) || cols.price.includes(h));
        const map = hasHeader
          ? { name: idxOf(cols.name), status: idxOf(cols.status), price: idxOf(cols.price), stock: idxOf(cols.stock), sales: idxOf(cols.sales) }
          : { name: 0, status: 1, price: 2, stock: 3, sales: 4 };
        const dataRows = hasHeader ? parsed.slice(1) : parsed;
        const imported = dataRows
          .map((r) => {
            const get = (i: number) => (i >= 0 && r[i] != null ? r[i].trim() : '');
            const rawStatus = get(map.status);
            const statusKey = /منشور|publish/i.test(rawStatus) ? 'published'
              : /بانتظار|pending|await/i.test(rawStatus) ? 'pending'
                : /مرفوض|reject/i.test(rawStatus) ? 'rejected' : 'draft';
            return {
              name: get(map.name),
              statusKey,
              price: get(map.price) || '—',
              stock: get(map.stock) || '0',
              sales: get(map.sales) || '0',
              img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20assorted%20Saudi%20dates%20in%20a%20simple%20kraft%20box%20on%20a%20clean%20warm%20beige%20background%2C%20soft%20amber%20light%2C%20top%20view%2C%20high%20detail&width=800&height=600&seq=sta-fac-import-01&orientation=landscape',
            };
          })
          .filter((p) => p.name);
        if (!imported.length) { flash(t('dashboard.factory.products.importError')); return; }
        imported.forEach((p) => ops.addProduct(p));
        flash(t('dashboard.factory.products.importedToast', { count: imported.length }));
      } catch {
        flash(t('dashboard.factory.products.importError'));
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.products.title')}
        sub={t('dashboard.factory.products.sub')}
        actions={(
          <>
            <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()}><i className="ri-file-excel-2-line" /> {t('dashboard.factory.products.import')}</button>
            <button type="button" className="btn ghost" onClick={exportCsv}><i className="ri-download-2-line" /> {t('dashboard.factory.products.export')}</button>
            <button type="button" className="btn primary" onClick={() => go('f-newproduct')}><i className="ri-add-line" /> {t('dashboard.factory.products.add')}</button>
          </>
        )}
      />

      <input ref={fileRef} className="file-input-hidden" type="file" accept=".csv,text/csv" onChange={importCsv} />

      {lowCount > 0 && (
        <div className="note mb">
          <i className="ri-alarm-warning-line" />
          <span>{t('dashboard.factory.products.lowAlert', { count: lowCount })}</span>
          <button type="button" className="btn sm ghost" style={{ marginInlineStart: 'auto' }} onClick={() => setLowOnly(true)}>
            <i className="ri-filter-3-line" /> {t('dashboard.factory.products.lowOnly')}
          </button>
        </div>
      )}

      <Card>
        <div className="audit-bar">
          <div className="fld grow">
            <i className="ri-search-line" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('dashboard.factory.products.searchPlaceholder')} aria-label={t('dashboard.factory.products.searchPlaceholder')} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t('dashboard.factory.products.thStatus')}>
            <option value="all">{t('dashboard.factory.products.filterAll')}</option>
            {['published', 'pending', 'draft', 'rejected'].map((s) => <option key={s} value={s}>{t(`dashboard.factory.status.${s}`)}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t('dashboard.factory.products.categoryLabel')}>
            <option value="all">{t('dashboard.factory.products.filterAllCategories')}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="button" className={`chip ${lowOnly ? 'is-on' : ''}`} onClick={() => setLowOnly((v) => !v)}>
            <i className="ri-alarm-warning-line" /> {t('dashboard.factory.products.lowOnly')}
          </button>
          {hasFilters && (
            <button type="button" className="btn sm ghost" onClick={() => { setQuery(''); setStatus('all'); setCategory('all'); setLowOnly(false); }}>
              <i className="ri-close-line" /> {t('dashboard.factory.products.clearFilters')}
            </button>
          )}
          <span className="small muted audit-count">{t('dashboard.factory.products.count', { count: filtered.length, total: rows.length })}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty"><i className="ri-inbox-line" /><div>{t('dashboard.factory.products.noResults')}</div></div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('dashboard.factory.products.thProduct')}</th>
                  <th>{t('dashboard.factory.products.thStatus')}</th>
                  <th>{t('dashboard.factory.products.thPrice')}</th>
                  <th>{t('dashboard.factory.products.thStock')}</th>
                  <th>{t('dashboard.factory.products.thSales')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={`${p.name}-${i}`}>
                    <td className="tbl-name">
                      <img className="mini" src={p.img} alt={p.name} />
                      <div>
                        <div className="t">{p.name}</div>
                        {p.sku && <div className="s">{p.sku}{p.cat ? ` · ${p.cat}` : ''}</div>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Pill tone={statusTone(p)}>{statusText(p)}</Pill>
                        {p.low && <Pill tone="danger">{t('dashboard.factory.products.lowBadge')}</Pill>}
                      </div>
                    </td>
                    <td className="strong accent">{p.price}</td>
                    <td className="strong">{p.stock}</td>
                    <td className="strong">{p.sales}</td>
                    <td>
                      <div className="row-between" style={{ gap: 6 }}>
                        <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.products.details')} onClick={() => { setDetail(p); setEditing(false); }}><i className="ri-eye-line" /></button>
                        <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.products.edit')} onClick={() => openEdit(p)}><i className="ri-edit-line" /></button>
                        <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.products.duplicate')} onClick={() => { ops.addProduct({ name: `${p.name} (2)`, statusKey: 'draft', price: p.price, stock: p.stock, sales: p.sales, img: p.img }, d.factoryUser.name); flash(t('dashboard.factory.products.duplicateToast')); }}><i className="ri-file-copy-2-line" /></button>
                        <button type="button" className="btn sm ghost" aria-label={t('dashboard.factory.products.publish')} onClick={() => { ops.setProductStatus(p.key, 'published', d.factoryUser.name); flash(t('dashboard.factory.products.publishedToast')); }}><i className="ri-send-plane-line" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={t('dashboard.factory.products.detailTitle')} sub={t('dashboard.factory.products.detailSub', { name: detail?.name ?? '' })}>
        {detail && (
          <>
            {editing ? (
              <>
                <div className="field">
                  <label htmlFor="pe-name">{t('dashboard.factory.products.editNameLabel')}</label>
                  <input id="pe-name" value={eName} onChange={(e) => setEName(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="pe-price">{t('dashboard.factory.products.editPriceLabel')}</label>
                  <input id="pe-price" value={ePrice} onChange={(e) => setEPrice(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="pe-stock">{t('dashboard.factory.products.editStockLabel')}</label>
                  <input id="pe-stock" value={eStock} onChange={(e) => setEStock(e.target.value)} />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn primary" onClick={saveEdit}><i className="ri-save-3-line" /> {t('dashboard.factory.products.saveEdit')}</button>
                  <button type="button" className="btn ghost" onClick={() => setEditing(false)}>{t('dashboard.common.cancel')}</button>
                </div>
              </>
            ) : (
              <>
            <div className="media mb" style={{ gridTemplateColumns: '1fr' }}>
              <div className="tile">
                <img className="thumb" src={detail.img} alt={detail.name} />
              </div>
            </div>
            <div className="row-between mb" style={{ gap: 8, flexWrap: 'wrap' }}>
              <Pill tone={statusTone(detail)}>{statusText(detail)}</Pill>
              {detail.low && <Pill tone="danger">{t('dashboard.factory.products.lowBadge')}</Pill>}
              <span className="strong accent" style={{ marginInlineStart: 'auto' }}>{detail.price}</span>
            </div>
            {detail.desc && <p className="small muted mb">{detail.desc}</p>}

            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>{t('dashboard.factory.products.overviewTitle')}</h3>
            <div className="od-kv">
              <div><div className="small muted">{t('dashboard.factory.products.skuLabel')}</div><div className="strong">{detail.sku ?? '—'}</div></div>
              <div><div className="small muted">{t('dashboard.factory.products.categoryLabel')}</div><div className="strong">{detail.cat ?? '—'}</div></div>
              <div><div className="small muted">{t('dashboard.factory.products.hsLabel')}</div><div className="strong">{detail.hs ?? '—'}</div></div>
              <div><div className="small muted">{t('dashboard.factory.products.costLabel')}</div><div className="strong">{detail.cost ?? '—'}</div></div>
              <div><div className="small muted">{t('dashboard.factory.products.marginLabel')}</div><div className="strong accent">{detail.margin ?? '—'}</div></div>
              <div><div className="small muted">{t('dashboard.factory.products.minLabel')}</div><div className="strong">{detail.min ?? '—'}</div></div>
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '4px 0 10px' }}>{t('dashboard.factory.products.vitalTitle')}</h3>
            <div className="grid c3">
              <div className="stat" style={{ padding: '12px 14px' }}><div className="num" style={{ fontSize: 20 }}>{detail.stock}</div><div className="lbl">{t('dashboard.factory.products.thStock')}</div></div>
              <div className="stat" style={{ padding: '12px 14px' }}><div className="num" style={{ fontSize: 20 }}>{detail.sales}</div><div className="lbl">{t('dashboard.factory.products.thSales')}</div></div>
              <div className="stat" style={{ padding: '12px 14px' }}><div className="num" style={{ fontSize: 20 }}>{detail.rating ?? '—'}</div><div className="lbl">{t('dashboard.factory.products.ratingLabel')}</div></div>
              <div className="stat" style={{ padding: '12px 14px' }}><div className="num" style={{ fontSize: 20 }}>{detail.views ?? '—'}</div><div className="lbl">{t('dashboard.factory.products.viewsLabel')}</div></div>
              <div className="stat" style={{ padding: '12px 14px' }}><div className="num" style={{ fontSize: 20 }}>{detail.wishes ?? '—'}</div><div className="lbl">{t('dashboard.factory.products.wishesLabel')}</div></div>
              <div className="stat" style={{ padding: '12px 14px' }}><div className="num" style={{ fontSize: 14 }}>{detail.updated ?? '—'}</div><div className="lbl">{t('dashboard.factory.products.updatedLabel')}</div></div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn primary" onClick={() => { ops.setProductStatus(detail.key, 'published', d.factoryUser.name); flash(t('dashboard.factory.products.publishedToast')); }}><i className="ri-send-plane-line" /> {t('dashboard.factory.products.publish')}</button>
              <button type="button" className="btn ghost" onClick={() => openEdit(detail)}><i className="ri-edit-line" /> {t('dashboard.factory.products.editFromDetails')}</button>
              <button type="button" className="btn ghost" onClick={() => setDetail(null)}>{t('dashboard.factory.products.closeDetails')}</button>
            </div>
              </>
            )}
          </>
        )}
      </Modal>

      <Toast message={toast} />
    </>
  );
}

/* ------------------------------------------------------------- new product */

function FactoryNewProduct() {
  const { t } = useTranslation();
  const d = useDashboard();
  const ops = useFactoryOps();
  const { go } = useDashboardNav();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [file, setFile] = useState('');
  const [toast, setToast] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  const requireName = () => {
    if (!name.trim()) { flash(t('dashboard.factory.newProduct.nameRequired')); return false; }
    return true;
  };

  /* Adds the product to the shared, persisted products list, then takes the
     owner straight to the products table so they can see it there. */
  const addProduct = (statusKey: string, toastKey: string) => {
    if (!requireName()) return;
    ops.addProduct({
      name: name.trim(),
      statusKey,
      price: price.trim() || '—',
      stock: stock.trim() || '0',
      sales: '0',
      img: 'https://readdy.ai/api/search-image?query=Minimal%20product%20photo%20of%20a%20premium%20box%20of%20Saudi%20dates%20on%20a%20clean%20warm%20beige%20background%2C%20soft%20amber%20light%2C%20top%20view%2C%20high%20detail&width=800&height=600&seq=sta-fac-prod-new-01&orientation=landscape',
    }, d.factoryUser.name);
    flash(t(toastKey));
    setName(''); setDesc(''); setPrice(''); setStock(''); setFile('');
    go('f-products');
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.newProduct.title')}
        sub={t('dashboard.factory.newProduct.sub')}
        actions={(
          <>
            <button type="button" className="btn ghost" onClick={() => addProduct('draft', 'dashboard.factory.newProduct.draftAddedToast')}><i className="ri-draft-line" /> {t('dashboard.factory.newProduct.saveDraft')}</button>
            <button type="button" className="btn primary" onClick={() => addProduct('pending', 'dashboard.factory.newProduct.addedToast')}><i className="ri-send-plane-line" /> {t('dashboard.factory.newProduct.submit')}</button>
          </>
        )}
      />

      <div className="split wide">
        <Card title={t('dashboard.factory.newProduct.basicTitle')}>
          <div className="field">
            <label htmlFor="n-name">{t('dashboard.factory.newProduct.nameLabel')}</label>
            <input id="n-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('dashboard.factory.newProduct.namePlaceholder')} />
          </div>
          <div className="field">
            <label htmlFor="n-cat">{t('dashboard.factory.newProduct.categoryLabel')}</label>
            <select id="n-cat">{d.factoryCategories.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="grid c2" style={{ gap: 10 }}>
            <div className="field"><label htmlFor="n-price">{t('dashboard.factory.newProduct.priceLabel')}</label><input id="n-price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="96" /></div>
            <div className="field"><label htmlFor="n-stock">{t('dashboard.factory.newProduct.stockLabel')}</label><input id="n-stock" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" /></div>
          </div>
          <div className="field">
            <label htmlFor="n-desc">{t('dashboard.factory.newProduct.descLabel')}</label>
            <textarea id="n-desc" maxLength={500} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t('dashboard.factory.newProduct.descPlaceholder')} />
          </div>
          <div className="field">
            <label>{t('dashboard.factory.newProduct.imagesLabel')}</label>
            <label className={`drop-zone ${file ? 'has-file' : ''}`} htmlFor="n-file">
              <i className={file ? 'ri-image-line' : 'ri-add-box-line'} />
              <span>{file ? t('dashboard.factory.join.fileChosen') : t('dashboard.factory.join.chooseFile')}</span>
              {file && <span className="fname">{file}</span>}
            </label>
            <input id="n-file" className="file-input-hidden" type="file" accept="image/*" multiple onChange={(e) => setFile(e.target.files?.[0]?.name ?? '')} />
          </div>
        </Card>

        <Card title={t('dashboard.factory.newProduct.variantsTitle')}>
          <div className="tbl-wrap mb">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('dashboard.factory.inventory.thVariant')}</th>
                  <th>{t('dashboard.factory.newProduct.skuLabel')}</th>
                  <th>{t('dashboard.factory.newProduct.barcodeLabel')}</th>
                  <th>{t('dashboard.factory.newProduct.retailLabel')}</th>
                  <th>{t('dashboard.factory.newProduct.wholesaleLabel')}</th>
                </tr>
              </thead>
              <tbody>
                {d.factoryVariants.map((v) => (
                  <tr key={v.sku}>
                    <td className="strong">{v.name}</td>
                    <td className="muted small">{v.sku}</td>
                    <td className="muted small">{v.barcode}</td>
                    <td>{v.retail}</td>
                    <td>{v.wholesale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid c2" style={{ gap: 10 }}>
            <div className="field"><label htmlFor="n-hs">{t('dashboard.factory.newProduct.hsLabel')}</label><input id="n-hs" placeholder="0804.10" /></div>
            <div className="field"><label htmlFor="n-min">{t('dashboard.factory.newProduct.minLabel')}</label><input id="n-min" placeholder="50" /></div>
            <div className="field"><label htmlFor="n-weight">{t('dashboard.factory.newProduct.weightLabel')}</label><input id="n-weight" placeholder="500g · 20×15×8" /></div>
            <div className="field"><label htmlFor="n-lead">{t('dashboard.factory.newProduct.leadLabel')}</label><input id="n-lead" placeholder="12" /></div>
            <div className="field"><label htmlFor="n-shelf">{t('dashboard.factory.newProduct.shelfLabel')}</label><input id="n-shelf" placeholder="12M" /></div>
            <div className="field"><label htmlFor="n-cert">{t('dashboard.factory.newProduct.certsLabel')}</label><input id="n-cert" placeholder="Halal · ISO 22000" /></div>
            <div className="field"><label htmlFor="n-excl">{t('dashboard.factory.newProduct.excludedLabel')}</label><input id="n-excl" placeholder="—" /></div>
            <div className="field"><label htmlFor="n-samp">{t('dashboard.factory.newProduct.samplesLabel')}</label><input id="n-samp" placeholder="—" /></div>
          </div>
        </Card>
      </div>
      <Toast message={toast} />
    </>
  );
}

/* -------------------------------------------------------------- inventory */

function FactoryInventory() {
  const { t } = useTranslation();
  const d = useDashboard();
  const ops = useFactoryOps();
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [editing, setEditing] = useState<{ sku: string; variant: string } | null>(null);
  const [avail, setAvail] = useState('');
  const [jeddah, setJeddah] = useState('');
  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2000); };

  const rows = d.factoryInventory.map((r) => {
    const patch = ops.stock[r.sku];
    return {
      ...r,
      available: patch?.available ?? r.available,
      jeddah: patch?.jeddah ?? r.jeddah,
    };
  });
  const lowCount = rows.filter((r) => r.alert).length;
  const hasFilters = query.trim() !== '' || lowOnly;

  const filtered = rows.filter((r) => {
    if (lowOnly && !r.alert) return false;
    const q = query.trim().toLowerCase();
    if (q) return r.variant.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q);
    return true;
  });

  const openUpdate = (sku: string, variant: string, available: string, jeddahValue: string) => {
    setEditing({ sku, variant });
    setAvail(available);
    setJeddah(jeddahValue);
  };

  const saveUpdate = () => {
    if (!editing) return;
    ops.setStock(editing.sku, { available: avail.trim() || '0', jeddah: jeddah.trim() || '0' });
    setEditing(null);
    flash(t('dashboard.factory.inventory.updatedToast'));
  };

  const exportCsv = () => {
    downloadCsv(
      'factory-inventory.csv',
      [
        t('dashboard.factory.inventory.thVariant'),
        t('dashboard.factory.inventory.thSku'),
        t('dashboard.factory.inventory.thAvailable'),
        t('dashboard.factory.inventory.thReserved'),
        t('dashboard.factory.inventory.thJeddah'),
        t('dashboard.factory.inventory.minLabel'),
      ],
      filtered.map((r) => [r.variant, r.sku, r.available, r.reserved, r.jeddah, r.min]),
    );
    flash(t('dashboard.common.exportedFile', { file: 'factory-inventory.csv' }));
  };

  return (
    <>
      <PageHead
        eyebrow={t('dashboard.factory.eyebrow')}
        title={t('dashboard.factory.inventory.title')}
        sub={t('dashboard.factory.inventory.sub')}
        actions={(
          <>
            <button type="button" className="btn ghost" onClick={exportCsv}><i className="ri-download-2-line" /> {t('dashboard.factory.inventory.export')}</button>
            <button type="button" className="btn ghost" onClick={() => flash(t('dashboard.factory.inventory.syncToast'))}><i className="ri-plug-line" /> {t('dashboard.factory.inventory.syncErp')}</button>
            <button type="button" className="btn primary" onClick={() => flash(t('dashboard.factory.inventory.bulkToast'))}><i className="ri-stack-line" /> {t('dashboard.factory.inventory.bulk')}</button>
          </>
        )}
      />

      {lowCount > 0 && (
        <div className="note mb">
          <i className="ri-alarm-warning-line" />
          <span>{t('dashboard.factory.inventory.lowAlert')} — {lowCount}</span>
          <button type="button" className="btn sm ghost" style={{ marginInlineStart: 'auto' }} onClick={() => setLowOnly(true)}>
            <i className="ri-filter-3-line" /> {t('dashboard.factory.inventory.lowOnly')}
          </button>
        </div>
      )}

      <Card>
        <div className="audit-bar">
          <div className="fld grow">
            <i className="ri-search-line" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('dashboard.factory.inventory.searchPlaceholder')} aria-label={t('dashboard.factory.inventory.searchPlaceholder')} />
          </div>
          <button type="button" className={`chip ${lowOnly ? 'is-on' : ''}`} onClick={() => setLowOnly((v) => !v)}>
            <i className="ri-alarm-warning-line" /> {t('dashboard.factory.inventory.lowOnly')}
          </button>
          {hasFilters && (
            <button type="button" className="btn sm ghost" onClick={() => { setQuery(''); setLowOnly(false); }}>
              <i className="ri-close-line" /> {t('dashboard.factory.inventory.clearFilters')}
            </button>
          )}
          <span className="small muted audit-count">{t('dashboard.factory.inventory.count', { count: filtered.length, total: rows.length })}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty"><i className="ri-inbox-line" /><div>{t('dashboard.factory.inventory.noResults')}</div></div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('dashboard.factory.inventory.thVariant')}</th>
                  <th>{t('dashboard.factory.inventory.thSku')}</th>
                  <th>{t('dashboard.factory.inventory.thAvailable')}</th>
                  <th>{t('dashboard.factory.inventory.thReserved')}</th>
                  <th>{t('dashboard.factory.inventory.thJeddah')}</th>
                  <th>{t('dashboard.factory.inventory.minLabel')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.sku}>
                    <td className="tbl-name">
                      <div className="t">{row.variant}</div>
                      {row.alert && <Pill tone="danger">{t('dashboard.factory.inventory.lowBadge')}</Pill>}
                    </td>
                    <td className="muted small">{row.sku}</td>
                    <td className="strong">{row.available}</td>
                    <td className="muted">{row.reserved}</td>
                    <td className="muted">{row.jeddah}</td>
                    <td className="muted">{row.min}</td>
                    <td>
                      <button type="button" className="btn sm ghost" onClick={() => openUpdate(row.sku, row.variant, row.available, row.jeddah)}>
                        <i className="ri-edit-line" /> {t('dashboard.factory.inventory.update')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={t('dashboard.factory.inventory.updateTitle')} sub={t('dashboard.factory.inventory.updateSub')}>
        {editing && (
          <>
            <div className="code-box mb">
              <div>
                <div className="small muted">{editing.variant}</div>
                <div className="val">{editing.sku}</div>
              </div>
            </div>
            <div className="field">
              <label htmlFor="inv-avail">{t('dashboard.factory.inventory.availableLabel')}</label>
              <input id="inv-avail" value={avail} onChange={(e) => setAvail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="inv-jed">{t('dashboard.factory.inventory.jeddahLabel')}</label>
              <input id="inv-jed" value={jeddah} onChange={(e) => setJeddah(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn primary" onClick={saveUpdate}>{t('dashboard.common.save')}</button>
              <button type="button" className="btn ghost" onClick={() => setEditing(null)}>{t('dashboard.common.cancel')}</button>
            </div>
          </>
        )}
      </Modal>
      <Toast message={toast} />
    </>
  );
}

export const factoryCatalogViews: Record<string, FunctionComponent> = {
  'f-products': FactoryProducts,
  'f-newproduct': FactoryNewProduct,
  'f-inventory': FactoryInventory,
};