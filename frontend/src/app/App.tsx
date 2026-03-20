import { useState, Suspense } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "../contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import AgeGate from "./screens/AgeGate";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { InstallPrompt } from "./components/InstallPrompt";

const AGE_GATE_KEY = "age_gate_passed";

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#09090F] flex items-center justify-center">
      <div className="w-10 h-10 border-[3px] border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const [agePassed, setAgePassed] = useState(
    () => localStorage.getItem(AGE_GATE_KEY) === "true"
  );

  const handleAgeConfirm = () => {
    localStorage.setItem(AGE_GATE_KEY, "true");
    setAgePassed(true);
  };

  if (!agePassed) {
    return <AgeGate onConfirm={handleAgeConfirm} />;
  }

  return (
    <ErrorBoundary>
      <OfflineIndicator />
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <RouterProvider router={router} />
        </Suspense>
        <InstallPrompt />
        <Toaster />
      </AuthProvider>
    </ErrorBoundary>
  );
}
