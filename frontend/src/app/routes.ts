import { createBrowserRouter } from "react-router";
import VenueSelection from "./screens/VenueSelection";
import VenueDetails from "./screens/VenueDetails";
import BottleMenu from "./screens/BottleMenu";
import BottleDetails from "./screens/BottleDetails";
import Login from "./screens/Login";
import ForgotPassword from "./screens/ForgotPassword";
import ResetPassword from "./screens/ResetPassword";
import Payment from "./screens/Payment";
import PaymentSuccess from "./screens/PaymentSuccess";
import MyBottles from "./screens/MyBottles";
import RedeemPeg from "./screens/RedeemPeg";
import RedemptionQR from "./screens/RedemptionQR";
import Profile from "./screens/Profile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: VenueSelection,
  },
  {
    path: "/venue/:venueId/details",
    Component: VenueDetails,
  },
  {
    path: "/venue/:venueId",
    Component: BottleMenu,
  },
  {
    path: "/venue/:venueId/bottle/:bottleId",
    Component: BottleDetails,
  },
  {
    path: "/login",
    Component: Login,
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
    path: "/payment",
    Component: Payment,
  },
  {
    path: "/payment-success",
    Component: PaymentSuccess,
  },
  {
    path: "/my-bottles",
    Component: MyBottles,
  },
  {
    path: "/redeem/:bottleId",
    Component: RedeemPeg,
  },
  {
    path: "/redeem-qr/:bottleId",
    Component: RedemptionQR,
  },
  {
    path: "/profile",
    Component: Profile,
  },
]);
