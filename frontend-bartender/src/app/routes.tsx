import { createBrowserRouter } from "react-router";
import BartenderLogin from "./pages/BartenderLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PendingApproval from "./pages/PendingApproval";
import BartenderHome from "./pages/BartenderHome";
import ScanQR from "./pages/ScanQR";
import DrinkDetails from "./pages/DrinkDetails";
import Stats from "./pages/Stats";
import Inventory from "./pages/Inventory";
import CustomerLookup from "./pages/CustomerLookup";
import RedemptionHistory from "./pages/RedemptionHistory";
import NotFound from "./pages/NotFound";
import AuthGuard from "./components/AuthGuard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: BartenderLogin,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/reset-password",
    Component: ResetPassword,
  },
  {
    path: "/pending-approval",
    Component: PendingApproval,
  },
  {
    path: "/home",
    element: <AuthGuard><BartenderHome /></AuthGuard >,
  },
  {
    path: "/scan",
    element: <AuthGuard><ScanQR /></AuthGuard >,
  },
  {
    path: "/drink-details",
    element: <AuthGuard><DrinkDetails /></AuthGuard >,
  },
  {
    path: "/stats",
    element: <AuthGuard><Stats /></AuthGuard >,
  },
  {
    path: "/inventory",
    element: <AuthGuard><Inventory /></AuthGuard >,
  },
  {
    path: "/customers",
    element: <AuthGuard><CustomerLookup /></AuthGuard >,
  },
  {
    path: "/history",
    element: <AuthGuard><RedemptionHistory /></AuthGuard >,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
