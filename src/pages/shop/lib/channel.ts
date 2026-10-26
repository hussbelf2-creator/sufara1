/* Retail vs wholesale for a cart (Decision Log §3).

   Retail is the spread engine: single parcels, from one unit, express route,
   platform-funded codes. Wholesale is the profit engine: as soon as a line
   reaches its factory's MOQ the wholesale tier price applies, the order ships
   consolidated from Jeddah, and promo codes stop applying — the price is the
   negotiated tier. */

import type { Product } from '@/pages/shop/types';
import type { SalesChannel } from '@/config/platform';

export interface ChannelLine {
  product: Pick<Product, 'wholesale'>;
  qty: number;
}

export function lineIsWholesale(line: ChannelLine): boolean {
  const moq = line.product.wholesale?.moq;
  return !!moq && line.qty >= moq;
}

export function cartChannel(lines: ChannelLine[]): SalesChannel {
  return lines.some(lineIsWholesale) ? 'wholesale' : 'retail';
}
