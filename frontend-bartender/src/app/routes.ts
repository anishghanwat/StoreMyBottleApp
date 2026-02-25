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
    Component: BartenderHome,
  },
  {
    path: "/scan",
    Component: ScanQR,
  },
  {
    path: "/drink-details",
    Component: DrinkDetails,
  },
  {
    path: "/stats",
    Component: Stats,
  },
  {
    path: "/inventory",
    Component: Inventory,
  },
  {
    path: "/customers",
    Component: CustomerLookup,
  },
  {
    path: "/history",
    Component: RedemptionHistory,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
