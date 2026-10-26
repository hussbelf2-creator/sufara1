import type { TFunction } from 'i18next';
import type { useDashboard } from '@/hooks/useDashboard';
import { downloadCombinedCsv } from '@/pages/dashboard/lib/csv';
import type { CsvSection } from '@/pages/dashboard/lib/csv';

type Dash = ReturnType<typeof useDashboard>;

/* Gathers every factory table into one combined CSV file and triggers the
   download. Returns the file name so the caller can show a unified toast. */
export function exportAllFactoryData(t: TFunction, d: Dash): string {
  const f = 'dashboard.factory';
  const sections: CsvSection[] = [
    {
      title: t(`${f}.products.title`),
      headers: [
        t(`${f}.products.thProduct`), t(`${f}.products.thStatus`),
        t(`${f}.products.thPrice`), t(`${f}.products.thStock`), t(`${f}.products.thSales`),
      ],
      rows: d.factoryProducts.map((p) => [p.name, p.status, p.price, p.stock, p.sales]),
    },
    {
      title: t(`${f}.inventory.title`),
      headers: [
        t(`${f}.inventory.thVariant`), t(`${f}.inventory.thSku`),
        t(`${f}.inventory.thAvailable`), t(`${f}.inventory.thReserved`), t(`${f}.inventory.thJeddah`),
      ],
      rows: d.factoryInventory.map((r) => [r.variant, r.sku, r.available, r.reserved, r.jeddah]),
    },
    {
      title: t(`${f}.orders.title`),
      headers: [
        t(`${f}.orders.thOrder`), t(`${f}.orders.thBuyer`), t(`${f}.orders.thCountry`),
        t(`${f}.orders.thProduct`), t(`${f}.orders.thQty`), t(`${f}.orders.thDue`),
        t(`${f}.orders.thShip`), t(`${f}.orders.thStatus`),
      ],
      rows: d.factoryOrders.map((o) => [o.id, o.buyer, o.country, o.product, String(o.qty), o.due, o.ship, o.status]),
    },
    {
      title: t(`${f}.rfq.title`),
      headers: [
        t(`${f}.rfq.thBuyer`), t(`${f}.rfq.thProduct`), t(`${f}.rfq.thQty`), t(`${f}.rfq.thCountry`),
        t(`${f}.rfq.thDelivery`), t(`${f}.rfq.thDeadline`), t(`${f}.rfq.thCompetitors`),
      ],
      rows: d.factoryRfqList.map((r) => [r.buyer, r.product, r.qty, r.country, r.delivery, r.deadline, String(r.competitors)]),
    },
    {
      title: t(`${f}.deals.title`),
      headers: [
        t(`${f}.deals.thBuyer`), t(`${f}.deals.thValue`), t(`${f}.deals.thPaid`),
        t(`${f}.deals.thStage`), t(`${f}.deals.thProgress`), t(`${f}.deals.thDocs`),
      ],
      rows: d.factoryDeals.map((x) => [x.buyer, x.value, x.paid, x.stage, `${x.progress}%`, String(x.docs)]),
    },
    {
      title: t(`${f}.shipping.title`),
      headers: [
        t(`${f}.shipping.thId`), t(`${f}.shipping.thCarrier`), t(`${f}.shipping.thCountry`),
        t(`${f}.shipping.thStatus`), t(`${f}.shipping.thPickup`),
      ],
      rows: d.factoryShipments.map((s) => [s.id, s.carrier, s.country, s.status, s.pickup]),
    },
    {
      title: t(`${f}.returns.title`),
      headers: [
        t(`${f}.returns.thId`), t(`${f}.returns.thOrder`), t(`${f}.returns.thItem`), t(`${f}.returns.thReason`),
        t(`${f}.returns.thAmount`), t(`${f}.returns.thDeadline`), t(`${f}.returns.thStatus`),
      ],
      rows: d.factoryReturns.map((r) => [r.id, r.order, r.item, r.reason, r.amount, r.deadline, r.status]),
    },
    {
      title: t(`${f}.finance.statementsTitle`),
      headers: [
        t(`${f}.finance.thPeriod`), t(`${f}.finance.thSales`), t(`${f}.finance.thCommission`),
        t(`${f}.finance.thNet`), t(`${f}.finance.thStatus`),
      ],
      rows: d.factoryFinance.statements.map((s) => [s.period, s.sales, s.commission, s.net, s.status]),
    },
    {
      title: t(`${f}.team.title`),
      headers: [
        t(`${f}.team.thName`), t(`${f}.team.thEmail`), t(`${f}.team.thRole`), t(`${f}.team.thStatus`),
      ],
      rows: d.factoryTeamList.map((m) => [m.name, m.email, m.role, m.active ? t(`${f}.team.active`) : t(`${f}.team.disabled`)]),
    },
  ];

  downloadCombinedCsv('factory-all.csv', sections);
  return 'factory-all.csv';
}