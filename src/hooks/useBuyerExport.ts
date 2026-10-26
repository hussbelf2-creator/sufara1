import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import * as arTickets from '@/mocks/tickets';
import * as enTickets from '@/mocks/tickets.en';
import type { SupportTicket } from '@/pages/support/lib/ticketStore';
import { exportBuyerPackage, readExportMeta } from '@/pages/dashboard/lib/buyerExport';
import type { BuyerPackageRange, ExportMeta } from '@/pages/dashboard/lib/buyerExport';

/* One shared action for the whole account package (tickets + orders + returns),
   used from the buyer home, the tickets section and the returns section so the
   download is identical wherever the buyer starts it. The tickets view can pass
   a date range so the exported tickets sheet matches the range on screen. */
export function useBuyerExport() {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const lang = (i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase();
  const isEn = lang.match(/^(en|ur|id)/) !== null;

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [meta, setMeta] = useState<ExportMeta | null>(() => readExportMeta());

  const run = useCallback(async (range?: BuyerPackageRange) => {
    if (busy) return;
    setBusy(true);
    try {
      const seed = (isEn ? enTickets.supportTickets : arTickets.supportTickets) as SupportTicket[];
      const result = await exportBuyerPackage({
        t,
        isEn,
        ticketsSeed: seed,
        orders: d.buyerOrders,
        returnsFallback: d.buyerReturns,
        from: range?.from || undefined,
        to: range?.to || undefined,
      });
      setMeta(result);
      setToast(t('dashboard.buyerExport.done', { count: result.count }));
    } catch {
      setToast(t('dashboard.buyerExport.failed'));
    } finally {
      setBusy(false);
      window.setTimeout(() => setToast(''), 3600);
    }
  }, [busy, t, isEn, d]);

  return {
    run, busy, toast, meta,
  };
}