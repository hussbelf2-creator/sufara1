import { BrowserRouter, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { useDirection } from "./hooks/useDirection";
import { useCms } from "./hooks/useCms";
import { ShopModalsProvider } from "./pages/shop/components/ShopModals";
import { CompareProvider } from "./pages/shop/components/CompareProvider";
import { CartProvider } from "./pages/shop/components/CartProvider";
import { FavoritesProvider } from "./pages/shop/components/FavoritesProvider";
import { AuthProvider } from "./pages/auth/AuthProvider";
import { useEffect } from "react";
import { loadPlatformConfig } from "./config/store";
import { loadPromoCodes } from "./pages/shop/lib/promo";
import { loadCatalogLive } from "./lib/catalogSync";

/* Keeps the document direction (rtl/ltr) aligned with the active language. */
function DirectionSync() {
  useDirection();
  return null;
}

/* Loads the published site content once for the whole app (not just the home
   page), so edited copy is already in place wherever the visitor lands. */
function ContentSync() {
  useCms();
  return null;
}

/* Loads the active PlatformConfig version (rates, zones, catalogue,
   languages) once; every price and rule on the site reads from it. */
function SettingsSync() {
  useEffect(() => {
    loadPlatformConfig();
    loadPromoCodes();
    loadCatalogLive();
  }, []);
  return null;
}

/* Softens every route change with a short lift so pages arrive, not cut. */
function RouteFade({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div className="route-fade" key={location.pathname}>
      {children}
    </div>
  );
}


function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <DirectionSync />
      <ContentSync />
      <SettingsSync />
      <BrowserRouter basename={__BASE_PATH__}>
        <AuthProvider>
        <ShopModalsProvider>
          <FavoritesProvider>
            <CompareProvider>
              <CartProvider>
                <RouteFade>
                  <AppRoutes />
                </RouteFade>
              </CartProvider>
            </CompareProvider>
          </FavoritesProvider>
        </ShopModalsProvider>
        </AuthProvider>
      </BrowserRouter>
    </I18nextProvider>
  );
}

export default App;
