import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Category, Factory, FactoryExtra, Order, Product } from '@/pages/shop/types';
import {
  products as baseProducts,
  factories as baseFactories,
  categories as baseCategories,
  factoryExtra as baseFactoryExtra,
  rfqCountries as baseCountries,
  rfqIncoterms,
} from '@/mocks/shop';
import { sampleOrders } from '@/mocks/orders';
import { productText } from '@/mocks/catalog/en/products';
import { factoryText, factoryExtraText } from '@/mocks/catalog/en/factories';
import { categoryText } from '@/mocks/catalog/en/categories';
import { countryText } from '@/mocks/catalog/en/countries';
import { orderText } from '@/mocks/catalog/en/orders';
import { usePlatformConfig } from '@/config/store';
import { useCatalogLive } from '@/lib/catalogSync';

interface OrderOverride {
  customerName?: string;
  country?: string;
  city?: string;
  port?: string;
  shippingMethod?: string;
  eta?: string;
  lines?: { name?: string; factoryName?: string }[];
}

/* Returns the storefront catalogue with every human-readable field resolved in
   the shopper's current language. Arabic is the base data; English is layered
   on top from src/mocks/catalog/en/*. Structural data (prices, images, tiers,
   stock) never changes, so all consumers read the exact same shapes.

   The storefront shows only the curated categories enabled in the platform
   settings (Decision Log §2): products of other categories, and factories
   left with no visible product, are hidden everywhere — store, search,
   factory directory and checkout alike. */
const PLACEHOLDER_IMAGE = 'https://readdy.ai/api/search-image?query=Saudi%20export%20product%20in%20a%20kraft%20carton%20on%20a%20warm%20sand%20background%2C%20soft%20natural%20light%2C%20editorial%20product%20photography&width=900&height=900&seq=safeer-placeholder&orientation=squarish';

export function useCatalog() {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase();
  const en = lang.match(/^(en|ur|id)/) !== null;
  const enabled = usePlatformConfig().catalog.enabledCategories;
  const enabledKey = enabled.join(',');
  const live = useCatalogLive();

  const full = useMemo(() => {
    if (!en) {
      return {
        products: baseProducts as Product[],
        factories: baseFactories as Factory[],
        categories: baseCategories as Category[],
        factoryExtra: baseFactoryExtra as Record<string, FactoryExtra>,
        rfqCountries: baseCountries,
        rfqIncoterms,
        sampleOrders: sampleOrders as Order[],
      };
    }

    const pText = productText as Record<string, Record<string, unknown>>;
    const fText = factoryText as Record<string, Record<string, unknown>>;
    const cText = categoryText as Record<string, Record<string, unknown>>;
    const feText = factoryExtraText as Record<string, Record<string, unknown>>;
    const coText = countryText as Record<string, Record<string, unknown>>;
    const oText = orderText as Record<string, OrderOverride>;

    const products = (baseProducts as Product[]).map((p) => ({
      ...p,
      ...(pText[p.id] ?? {}),
    })) as Product[];

    const factories = (baseFactories as Factory[]).map((f) => ({
      ...f,
      ...(fText[f.id] ?? {}),
    })) as Factory[];

    const categories = (baseCategories as Category[]).map((c) => ({
      ...c,
      ...(cText[c.id] ?? {}),
    })) as Category[];

    const extra: Record<string, FactoryExtra> = {};
    Object.keys(baseFactoryExtra).forEach((id) => {
      extra[id] = { ...baseFactoryExtra[id], ...(feText[id] ?? {}) } as FactoryExtra;
    });

    const countries = baseCountries.map((c) => ({
      ...c,
      ...(coText[c.code] ?? {}),
    })) as typeof baseCountries;

    const orders = (sampleOrders as Order[]).map((o) => {
      const ov = oText[o.id];
      if (!ov) return o;
      return {
        ...o,
        customerName: ov.customerName ?? o.customerName,
        country: ov.country ?? o.country,
        city: ov.city ?? o.city,
        port: ov.port ?? o.port,
        shippingMethod: ov.shippingMethod ?? o.shippingMethod,
        eta: ov.eta ?? o.eta,
        lines: o.lines.map((l, i) => ({ ...l, ...(ov.lines?.[i] ?? {}) })),
      };
    });

    return {
      products,
      factories,
      categories,
      factoryExtra: extra,
      rfqCountries: countries,
      rfqIncoterms,
      sampleOrders: orders,
    };
  }, [en]);

  return useMemo(() => {
    const on = new Set(enabledKey.split(','));
    /* Database rows win on everything that affects the charge. Products the
       database does not list as active are not sold, and products a factory
       added from its dashboard (published by the admin) join the store. */
    const rows = live?.products;
    const known = new Set(full.products.map((p) => p.id));
    const priced: Product[] = rows
      ? [
        ...full.products.flatMap((p) => {
          const row = rows[p.id];
          if (!row || !row.active) return [];
          return [{ ...p, ...(row.images.length ? { image: row.images[0], images: row.images } : {}), price: row.price, stock: row.stock, wholesale: row.moq ? { moq: row.moq, tiers: row.tiers } : undefined }];
        }),
        ...Object.entries(rows).filter(([id, r]) => r.active && !known.has(id)).map(([id, r]) => ({
          id,
          name: (en && r.name_en) || r.name_ar,
          categoryId: r.category_id,
          factoryId: r.factory_id,
          price: r.price,
          rating: 0,
          reviews: 0,
          image: r.images[0] || r.image_url || PLACEHOLDER_IMAGE,
          images: r.images.length ? r.images : undefined,
          tags: [],
          shortDesc: (en && r.short_en) || r.short_ar,
          description: (en && r.short_en) || r.short_ar,
          weight: en ? `${r.weight_kg} kg` : `${r.weight_kg} كجم`,
          hs: r.hs_code ?? '',
          origin: en ? 'Saudi Arabia' : 'المملكة العربية السعودية',
          stock: r.stock,
          isNew: true,
          wholesale: r.moq ? { moq: r.moq, tiers: r.tiers } : undefined,
        } as Product)),
      ]
      : full.products;
    const knownFactories = new Set(full.factories.map((f) => f.id));
    const extraFactories: Factory[] = live
      ? Object.values(live.factories).filter((f) => !knownFactories.has(f.id)).map((f) => ({
        id: f.id, name: (en && f.name_en) || f.name_ar, city: f.city, since: new Date(f.created_at).getFullYear(),
        rating: 0, products: priced.filter((p) => p.factoryId === f.id).length, verified: true, blurb: '',
      }))
      : [];
    const products = priced.filter((p) => on.has(p.categoryId));
    const withProducts = new Set(products.map((p) => p.factoryId));
    const categories = full.categories
      .filter((c) => on.has(c.id))
      .map((c) => ({ ...c, count: c.count }));
    return {
      ...full,
      products,
      categories,
      factories: [...full.factories, ...extraFactories].filter((f) => withProducts.has(f.id)),
    };
  }, [full, enabledKey, live, en]);
}