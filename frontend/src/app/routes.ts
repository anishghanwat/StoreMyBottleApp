import { createBrowserRouter } from "react-router";
import { lazy } from "react";

const VenueSelection = lazy(() => import("./screens/VenueSelection"));
const VenueDetails = lazy(() => import("./screens/VenueDetails"));
const BottleMenu = lazy(() => import("./screens/BottleMenu"));
const BottleDetails = lazy(() => import("./screens/BottleDetails"));
const Login = lazy(() => import("./screens/Login"));
const ForgotPassword = lazy(() => import("./screens/ForgotPassword"));
const ResetPassword = lazy(() => import("./screens/ResetPassword"));
const Payment = lazy(() => import("./screens/Payment"));
const PaymentSuccess = lazy(() => import("./screens/PaymentSuccess"));
const MyBottles = lazy(() => import("./screens/MyBottles"));
const RedeemPeg = lazy(() => import("./screens/RedeemPeg"));
const RedemptionQR = lazy(() => import("./screens/RedemptionQR"));
const Profile = lazy(() => import("./screens/Profile"));
const Terms = lazy(() => import("./screens/Terms"));
const Privacy = lazy(() => import("./screens/Privacy"));
const SettingsPage = lazy(() => import("./screens/SettingsPage"));
const PrivacySecurityPage = lazy(() => import("./screens/PrivacySecurityPage"));
const HelpSupport = lazy(() => import("./screens/HelpSupport"));
const RedemptionHistory = lazy(() => import("./screens/RedemptionHistory"));

export const router = createBrowserRouter([
  { path: "/", Component: VenueSelection },
  { path: "/venue/:venueId/details", Component: VenueDetails },
  { path: "/venue/:venueId", Component: BottleMenu },
  { path: "/venue/:venueId/bottle/:bottleId", Component: BottleDetails },
  { path: "/login", Component: Login },
  { path: "/forgot-password", Component: ForgotPassword },
  { path: "/reset-password", Component: ResetPassword },
  { path: "/payment", Component: Payment },
  { path: "/payment-success", Component: PaymentSuccess },
  { path: "/my-bottles", Component: MyBottles },
  { path: "/redeem/:bottleId", Component: RedeemPeg },
  { path: "/redeem-qr/:bottleId", Component: RedemptionQR },
  { path: "/profile", Component: Profile },
  { path: "/terms", Component: Terms },
  { path: "/privacy", Component: Privacy },
  { path: "/settings", Component: SettingsPage },
  { path: "/privacy-security", Component: PrivacySecurityPage },
  { path: "/help", Component: HelpSupport },
  { path: "/redemption-history", Component: RedemptionHistory },
]);
