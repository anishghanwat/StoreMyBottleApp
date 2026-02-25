import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import QRScanner from "../components/QRScanner";

export default function ScanQR() {
  const navigate = useNavigate();
  const [bartender, setBartender] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("bartender");
    if (!stored) { navigate("/"); return; }
    setBartender(JSON.parse(stored));
  }, [navigate]);

  if (!bartender) return null;

  return (
    <div className="min-h-screen flex flex-col bg-black relative">
      {/* Frosted header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-5 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/home")}
          className="p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <p className="text-xs font-semibold text-white">
            {bartender.venueName || bartender.venue_name || "Scanning…"}
          </p>
        </div>
      </div>

      {/* Full-screen scanner */}
      <div className="flex-1 relative">
        <div className="absolute inset-0">
          <QRScanner onClose={() => navigate("/home")} />
        </div>

        {/* Cyan scan target overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-64 h-64">
            {/* Dim surrounding */}
            <div className="absolute w-screen -left-[calc(50vw-128px)] top-0 h-full bg-transparent" />

            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-9 h-9 scan-corner-tl -mt-1 -ml-1" />
            <div className="absolute top-0 right-0 w-9 h-9 scan-corner-tr -mt-1 -mr-1" />
            <div className="absolute bottom-0 left-0 w-9 h-9 scan-corner-bl -mb-1 -ml-1" />
            <div className="absolute bottom-0 right-0 w-9 h-9 scan-corner-br -mb-1 -mr-1" />

            {/* Cyan laser sweep */}
            <div className="scan-laser" />
          </div>
        </div>

        {/* Bottom instruction */}
        <div className="absolute bottom-12 left-0 right-0 text-center pointer-events-none">
          <p className="text-white/70 text-base font-semibold drop-shadow-lg">
            Point at customer's bottle QR
          </p>
          <p className="text-white/35 text-xs mt-1">QR expires in 5 minutes</p>
        </div>
      </div>
    </div>
  );
}