import { useState } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "../contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import AgeGate from "./screens/AgeGate";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OfflineIndicator } from "./components/OfflineIndicator";

const AGE_GATE_KEY = "age_gate_passed";

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
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </ErrorBoundary>
  );
}
