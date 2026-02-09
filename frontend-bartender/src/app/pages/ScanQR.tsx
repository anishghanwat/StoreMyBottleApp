import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import QRScanner from "../components/QRScanner";

export default function ScanQR() {
  const navigate = useNavigate();
  const [bartender, setBartender] = useState<any>(null);
  // Auto-start scanner
  const [showScanner, setShowScanner] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("bartender");
    if (!stored) {
      navigate("/");
      return;
    }
    const user = JSON.parse(stored);
    setBartender(user);
  }, [navigate]);

  const handleBack = () => {
    navigate("/home");
  };

  if (!bartender) return null;

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full">
            <p className="text-sm font-medium text-white">{bartender.venueName || bartender.venue_name || "Scanning..."}</p>
          </div>
        </div>
      </div>

      {/* Full Screen Scanner */}
      <div className="flex-1 relative bg-black">
        <div className="absolute inset-0">
          <QRScanner onClose={handleBack} />
        </div>

        {/* Overlay Guide */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-purple-500 rounded-tl-xl -mt-1 -ml-1"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-purple-500 rounded-tr-xl -mt-1 -mr-1"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-purple-500 rounded-bl-xl -mb-1 -ml-1"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-purple-500 rounded-br-xl -mb-1 -mr-1"></div>
          </div>
        </div>

        <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
          <p className="text-white/80 text-lg font-medium drop-shadow-md">Point camera at QR code</p>
        </div>
      </div>
    </div>
  );
}