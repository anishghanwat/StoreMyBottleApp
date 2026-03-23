
import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.2,
  enabled: import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN,
});

createRoot(document.getElementById("root")!).render(<App />);
