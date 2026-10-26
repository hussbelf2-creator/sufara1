import { createContext, useContext } from 'react';

/* A tiny bridge so any dashboard view can jump to another section without the
   page having to pass the navigation callback down as props. The provider sits
   in src/pages/dashboard/page.tsx and exposes the same "pick" behaviour used
   by the sidebar. */
type DashboardNav = { go: (key: string) => void };

export const DashboardNavContext = createContext<DashboardNav>({ go: () => {} });

export const useDashboardNav = () => useContext(DashboardNavContext);