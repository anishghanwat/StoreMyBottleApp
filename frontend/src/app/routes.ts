import { createBrowserRouter } from "react-router";
import VenueSelection from "./screens/VenueSelection";
import BottleMenu from "./screens/BottleMenu";
import Login from "./screens/Login";
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
    path: "/venue/:venueId",
    Component: BottleMenu,
  },
  {
    path: "/login",
    Component: Login,
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
