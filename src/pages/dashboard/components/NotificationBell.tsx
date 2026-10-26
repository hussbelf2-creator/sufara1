import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useIsLive } from '@/pages/dashboard/views/live/useLive';

interface Notif { id: number; title: string; body: string; link: string | null; read_at: string | null; created_at: string }

/* The top-bar bell. With a real session it lists the account's notifications
   (and, for admins, the shared admin queue: group orders short of their
   minimum, documents to review, carrier exceptions…) and polls once a minute.
   The demo keeps the static icon. */
export default function NotificationBell() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const live = useIsLive();
  const [rows, setRows] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('notifications')
      .select('id, title, body, link, read_at, created_at').order('created_at', { ascending: false }).limit(12);
    setRows((data as Notif[]) ?? []);
  }, []);

  useEffect(() => {
    if (!live) return undefined;
    load();
    const id = window.setInterval(load, 60_000);
    return () => window.clearInterval(id);
  }, [live, load]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const unread = rows.filter((n) => !n.read_at);
  const pick = async (n: Notif) => {
    if (!n.read_at) await supabase.rpc('mark_notifications_read', { p_ids: [n.id] });
    setOpen(false);
    load();
    if (n.link) navigate(n.link);
  };
  const label = t('dashboard.topbar.notifications');

  if (!live) {
    return (
      <button type="button" className="icon-btn" aria-label={label}>
        <i className="ri-notification-3-line" />
        <span className="dot" />
      </button>
    );
  }
  return (
    <div className="notif-wrap" ref={box}>
      <button type="button" className="icon-btn" aria-label={label} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <i className="ri-notification-3-line" />
        {unread.length > 0 && <span className="notif-count">{unread.length > 9 ? '9+' : unread.length}</span>}
      </button>
      {open && (
        <div className="notif-pop" role="menu">
          <div className="notif-head">
            <strong>{t('platform.logi.bell')}</strong>
            {unread.length > 0 && (
              <button type="button" className="btn ghost sm" onClick={async () => { await supabase.rpc('mark_notifications_read', { p_ids: unread.map((n) => n.id) }); load(); }}>
                {t('platform.logi.markAllRead')}
              </button>
            )}
          </div>
          {!rows.length ? <div className="empty small">{t('platform.logi.noMessages')}</div> : rows.map((n) => (
            <button type="button" role="menuitem" key={n.id} className={`notif-item ${n.read_at ? '' : 'unread'}`} onClick={() => pick(n)}>
              <span className="t">{n.title}</span>
              <span className="s">{n.body}</span>
              <span className="s">{new Date(n.created_at).toLocaleString(i18n.language.startsWith('ar') ? 'ar-EG' : 'en-US')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
