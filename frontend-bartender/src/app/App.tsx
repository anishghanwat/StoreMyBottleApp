import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OfflineIndicator } from "./components/OfflineIndicator";

export default function App() {
  return (
    <ErrorBoundary>
      <OfflineIndicator />
      <RouterProvider router={router} />
      <Toaster />
    </ErrorBoundary>
  );
}