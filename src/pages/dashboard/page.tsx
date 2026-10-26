import { useEffect, useMemo, useRef, useState } from 'react';
import type { FunctionComponent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import type { Mode } from './components/TopBar';
import { useDashboard } from '@/hooks/useDashboard';
import { initPanels } from '@/pages/home/lib/panels';
import { buyerCoreViews } from './views/buyer/BuyerCore';
import { buyerMoreViews } from './views/buyer/BuyerMore';
import { buyerContractsViews } from './views/buyer/BuyerContracts';
import BuyerTickets from './views/buyer/BuyerTickets';
import { ambCoreViews } from './views/ambassador/AmbCore';
import { ambMoreViews } from './views/ambassador/AmbMore';
import { ambPageViews } from './views/ambassador/AmbPages';
import { adminCoreViews } from './views/admin/AdminCore';
import { adminMoreViews } from './views/admin/AdminMore';
import { adminOpsDemoViews } from './views/admin/AdminOpsDemo';
import { adminAmbViews } from './views/admin/AdminAmbPages';
import { adminContractsViews } from './views/admin/AdminContracts';
import AdminAccounts from './views/admin/AdminAccounts';
import AdminContent from './views/admin/AdminContent';
import { factoryCoreViews } from './views/factory/FactoryCore';
import { factoryMoreViews } from './views/factory/FactoryMore';
import { factoryCustomViews } from './views/factory/FactoryCustom';
import { factoryAmbViews } from './views/factory/FactoryAmbassadors';
import { factoryContractsViews } from './views/factory/FactoryContracts';
import { DashboardNavContext } from './components/DashboardNav';
import { useAccess } from '@/pages/auth/RequireAccess';
import { useAuth } from '@/pages/auth/AuthProvider';
import AdminMfa from '@/pages/auth/AdminMfa';
import { usePlatformConfig } from '@/config/store';
import AdminPlatformSettings from './views/admin/AdminPlatformSettings';
import { leaderViews } from './views/ambassador/LeaderTeam';
import { IllustrativeNote, liveViews, selfLiveViews } from './views/live/LiveViews';
import { useIsLive } from './views/live/useLive';
import { liveOpsViews } from './views/live/LiveOps';
import { liveLogisticsViews } from './views/live/LiveLogistics';
import { liveMessagingViews } from './views/live/LiveMessaging';
import { LegalGate, liveTrustViews } from './views/live/LiveTrust';
import './dash.css';

const buyerViews: Record<string, FunctionComponent> = {
  ...buyerCoreViews,
  ...buyerMoreViews,
  ...buyerContractsViews,
  tickets: BuyerTickets,
};
const ambViews: Record<string, FunctionComponent> = { ...ambCoreViews, ...ambMoreViews, ...ambPageViews, ...leaderViews };
const adminViews: Record<string, FunctionComponent> = {
  ...adminCoreViews, ...adminMoreViews, ...adminOpsDemoViews, ...adminAmbViews, ...adminContractsViews,
  'admin-accounts': AdminAccounts, 'admin-content': AdminContent, 'admin-platform': AdminPlatformSettings,
};
const factoryViews: Record<string, FunctionComponent> = { ...factoryCoreViews, ...factoryMoreViews, ...factoryCustomViews, ...factoryAmbViews, ...factoryContractsViews };

export default function Dashboard() {
  const { t } = useTranslation();
  const dash = useDashboard();
  const [params] = useSearchParams();
  const { allowed, demo } = useAccess();
  const { mfa, role } = useAuth();
  const config = usePlatformConfig();
  const live = useIsLive();
  /* ?mode= can only choose among the panels the server granted. Asking for
     ?mode=admin without the admin role simply opens the account's own panel. */
  const initialMode = ((): Mode => {
    const requested = params.get('mode') as Mode | null;
    if (requested && allowed.includes(requested)) return requested;
    if (role && allowed.includes(role)) return role;
    return allowed[0] ?? 'buyer';
  })();
  const navOf = (m: Mode) => {
    if (m === 'ambassador') return dash.ambassadorNav;
    if (m === 'factory') return dash.factoryNav;
    if (m === 'admin') return dash.adminNav;
    return dash.buyerNav;
  };
  const [mode, setMode] = useState<Mode>(initialMode);
  const [view, setView] = useState<string>(() => {
    const requested = params.get('view');
    const list = navOf(initialMode);
    if (requested && list.some((item) => item.key === requested)) return requested;
    return list[0].key;
  });
  const [menu, setMenu] = useState(false);
  const deepLinkApplied = useRef(false);

  useEffect(() => initPanels(), []);

  /* Deep links such as /dashboard?view=tickets (sent from the support form)
     open the buyer section on the requested view, once. */
  useEffect(() => {
    if (deepLinkApplied.current) return;
    const requested = params.get('view');
    if (!requested || !dash.buyerNav.some((item) => item.key === requested)) return;
    deepLinkApplied.current = true;
    setMode('buyer');
    setView(requested);
  }, [params, dash]);

  const nav = useMemo(() => {
    if (mode === 'buyer') return dash.buyerNav;
    if (mode === 'ambassador') return dash.ambassadorNav;
    if (mode === 'factory') return dash.factoryNav;
    return dash.adminNav;
  }, [mode, dash]);

  const switchMode = (m: Mode) => {
    if (!allowed.includes(m)) return;
    setMode(m);
    const first = m === 'buyer'
      ? dash.buyerNav[0]
      : m === 'ambassador'
        ? dash.ambassadorNav[0]
        : m === 'factory'
          ? dash.factoryNav[0]
          : dash.adminNav[0];
    setView(first.key);
    setMenu(false);
  };

  const pick = (key: string) => {
    setView(key);
    setMenu(false);
  };

  const views = mode === 'buyer'
    ? buyerViews
    : mode === 'ambassador'
      ? ambViews
      : mode === 'factory'
        ? factoryViews
        : adminViews;
  const View = views[view] ?? views[nav[0].key];
  /* The operations room needs a second factor on a real admin session. */
  const mfaBlocked = mode === 'admin' && !demo && config.security.requireMfaForAdmin && !mfa;

  const profile = useMemo(() => {
    if (mode === 'buyer') {
      return {
        name: dash.buyerUser.name,
        initials: dash.buyerUser.initials,
        sub: `${dash.buyerUser.country} · ${dash.buyerUser.level}`,
      };
    }
    if (mode === 'ambassador') {
      return {
        name: dash.ambassadorUser.name,
        initials: dash.ambassadorUser.initials,
        sub: `${dash.ambassadorUser.country} · ${dash.ambassadorUser.level}`,
      };
    }
    if (mode === 'factory') {
      return {
        name: dash.factoryUser.name,
        initials: dash.factoryUser.initials,
        sub: `${dash.factoryUser.factory} · ${dash.factoryUser.role}`,
      };
    }
    return {
      name: dash.adminUser.name,
      initials: dash.adminUser.initials,
      sub: `${dash.adminUser.country} · ${dash.adminUser.role}`,
    };
  }, [mode, dash]);

  const groupLabel = mode === 'buyer'
    ? t('dashboard.group.buyer')
    : mode === 'ambassador'
      ? t('dashboard.group.ambassador')
      : mode === 'factory'
        ? t('dashboard.group.factory')
        : t('dashboard.group.admin');

  const title = mode === 'buyer'
    ? t('dashboard.buyerTitle')
    : mode === 'ambassador'
      ? dash.ambassadorUser.level
      : mode === 'factory'
        ? dash.factoryUser.factory
        : t('dashboard.adminTitle');

  return (
    <div className="dash-scope">
      <div className="dash">
        <Sidebar
          nav={nav}
          active={view}
          onPick={pick}
          open={menu}
          onClose={() => setMenu(false)}
          name={profile.name}
          initials={profile.initials}
          sub={profile.sub}
          groupLabel={groupLabel}
          panelKey={mode}
        />

        <div className="dash-main">
          <TopBar
            mode={mode}
            allowed={allowed}
            onMode={switchMode}
            onMenu={() => setMenu(true)}
            title={title}
          />
          <main className="dash-body">
            <DashboardNavContext.Provider value={{ go: pick }}>
              {(() => {
                if (mfaBlocked) return <AdminMfa />;
                /* A real account sees database rows where a live screen exists,
                   and a clear note wherever the screen is still illustrative. */
                const LiveView = live ? (liveViews[mode]?.[view] ?? liveOpsViews[mode]?.[view] ?? liveLogisticsViews[mode]?.[view] ?? liveMessagingViews[mode]?.[view] ?? liveTrustViews[mode]?.[view]) : undefined;
                if (LiveView) return <LegalGate><LiveView key={`live-${mode}-${view}`} /></LegalGate>;
                const page = (
                  <>
                    {live && !selfLiveViews.has(view) && <IllustrativeNote />}
                    <View key={`${mode}-${view}`} />
                  </>
                );
                /* A signed-in account must accept current legal versions before any screen. */
                return live ? <LegalGate>{page}</LegalGate> : page;
              })()}
            </DashboardNavContext.Provider>
          </main>
        </div>
      </div>
    </div>
  );
}