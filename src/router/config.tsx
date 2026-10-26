import type { RouteObject } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/home/page";
import Dashboard from "@/pages/dashboard/page";
import RequireAccess from "@/pages/auth/RequireAccess";
import { Navigate } from "react-router-dom";
import AuthLoginPage from "@/pages/auth/page";
import AuthRegisterPage from "@/pages/auth/register/page";
import AuthVerifyPage from "@/pages/auth/verify/page";
import AuthForgotPage from "@/pages/auth/forgot/page";
import AuthResetPage from "@/pages/auth/reset/page";
import Products from "@/pages/shop/page";
import ProductDetail from "@/pages/shop/detail/page";
import FactoriesDirectory from "@/pages/factories/page";
import FactoryProfile from "@/pages/factories/detail/page";
import CompareProducts from "@/pages/shop/compare/page";
import CartPage from "@/pages/shop/cart/page";
import CheckoutPage from "@/pages/shop/checkout/page";
import OrdersPage from "@/pages/shop/orders/page";
import OrderDetailPage from "@/pages/shop/orders/detail/page";
import ReturnRequestPage from "@/pages/shop/orders/return/page";
import SearchPage from "@/pages/search/page";
import FavoritesPage from "@/pages/favorites/page";
import BrandPage from "@/pages/brand/page";
import AmbassadorFactoryPage from "@/pages/ambassador-factory/page";
import TermsPage from "@/pages/legal/terms/page";
import PrivacyPage from "@/pages/legal/privacy/page";
import ReturnsPage from "@/pages/legal/returns/page";
import AmbassadorAgreementPage from "@/pages/legal/ambassador/page";
import FactoryAgreementPage from "@/pages/legal/factory/page";
import SupportPage from "@/pages/support/page";
import FaqPage from "@/pages/faq/page";
import ReferralRedirect from "@/pages/referral/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/search",
    element: <SearchPage />,
  },
  {
    path: "/products",
    element: <Products />,
  },
  {
    path: "/products/:id",
    element: <ProductDetail />,
  },
  {
    path: "/favorites",
    element: <FavoritesPage />,
  },
  {
    path: "/brand",
    element: <BrandPage />,
  },
  {
    path: "/compare",
    element: <CompareProducts />,
  },
  {
    path: "/terms",
    element: <TermsPage />,
  },
  {
    path: "/privacy",
    element: <PrivacyPage />,
  },
  {
    path: "/returns",
    element: <ReturnsPage />,
  },
  {
    path: "/legal/ambassador",
    element: <AmbassadorAgreementPage />,
  },
  {
    path: "/legal/factory",
    element: <FactoryAgreementPage />,
  },
  {
    path: "/support",
    element: <SupportPage />,
  },
  {
    path: "/faq",
    element: <FaqPage />,
  },
  {
    path: "/cart",
    element: <CartPage />,
  },
  {
    path: "/checkout",
    element: <CheckoutPage />,
  },
  {
    path: "/orders",
    element: <OrdersPage />,
  },
  {
    path: "/orders/:id",
    element: <OrderDetailPage />,
  },
  {
    path: "/orders/:id/return",
    element: <ReturnRequestPage />,
  },
  {
    path: "/factories",
    element: <FactoriesDirectory />,
  },
  {
    path: "/factories/:id",
    element: <FactoryProfile />,
  },
  {
    path: "/r/:code",
    element: <ReferralRedirect />,
  },
  {
    path: "/f/:amb/:factory",
    element: <AmbassadorFactoryPage />,
  },
  {
    path: "/auth/:panel",
    element: <AuthLoginPage />,
  },
  {
    /* Admin accounts are granted by an existing admin, never self-registered. */
    path: "/auth/admin/register",
    element: <Navigate to="/auth/admin" replace />,
  },
  {
    path: "/auth/:panel/register",
    element: <AuthRegisterPage />,
  },
  {
    path: "/auth/:panel/verify",
    element: <AuthVerifyPage />,
  },
  {
    path: "/auth/:panel/forgot",
    element: <AuthForgotPage />,
  },
  {
    path: "/auth/:panel/reset",
    element: <AuthResetPage />,
  },
  {
    path: "/dashboard",
    element: (
      <RequireAccess>
        <Dashboard />
      </RequireAccess>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;