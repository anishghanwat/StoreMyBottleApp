import { useState } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "../contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import AgeGate from "./screens/AgeGate";

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
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  );
}
