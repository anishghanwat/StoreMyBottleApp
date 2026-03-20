import { createBrowserRouter } from "react-router";
import { lazy } from "react";
import AuthGuard from "./components/AuthGuard";

const BartenderLogin = lazy(() => import("./pages/BartenderLogin"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const BartenderHome = lazy(() => import("./pages/BartenderHome"));
const ScanQR = lazy(() => import("./pages/ScanQR"));
const DrinkDetails = lazy(() => import("./pages/DrinkDetails"));
const Stats = lazy(() => import("./pages/Stats"));
const Inventory = lazy(() => import("./pages/Inventory"));
const CustomerLookup = lazy(() => import("./pages/CustomerLookup"));
const RedemptionHistory = lazy(() => import("./pages/RedemptionHistory"));
const NotFound = lazy(() => import("./pages/NotFound"));

export const router = createBrowserRouter([
  { path: "/", Component: BartenderLogin },
  { path: "/forgot-password", Component: ForgotPassword },
  { path: "/reset-password", Component: ResetPassword },
  { path: "/pending-approval", Component: PendingApproval },
  { path: "/home", element: <AuthGuard><BartenderHome /></AuthGuard> },
  { path: "/scan", element: <AuthGuard><ScanQR /></AuthGuard> },
  { path: "/drink-details", element: <AuthGuard><DrinkDetails /></AuthGuard> },
  { path: "/stats", element: <AuthGuard><Stats /></AuthGuard> },
  { path: "/inventory", element: <AuthGuard><Inventory /></AuthGuard> },
  { path: "/customers", element: <AuthGuard><CustomerLookup /></AuthGuard> },
  { path: "/history", element: <AuthGuard><RedemptionHistory /></AuthGuard> },
  { path: "*", Component: NotFound },
]);
