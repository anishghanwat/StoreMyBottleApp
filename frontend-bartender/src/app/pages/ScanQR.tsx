import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import QRScanner from "../components/QRScanner";

const KIOSK_KEY = "bartender_kiosk_mode";

export default function ScanQR() {
  const navigate = useNavigate();
  const [bartender, setBartender] = useState<any>(null);
  const kioskMode = localStorage.getItem(KIOSK_KEY) === "true";

  useEffect(() => {
    const stored = localStorage.getItem("bartender");
    if (!stored) { navigate("/"); return; }
    setBartender(JSON.parse(stored));
  }, [navigate]);

  if (!bartender) return null;

  return (
    <QRScanner
      onClose={() => navigate("/home")}
      kioskMode={kioskMode}
    />
  );
}
