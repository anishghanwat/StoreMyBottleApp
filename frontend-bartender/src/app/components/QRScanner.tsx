import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { X, CheckCircle2, AlertTriangle, AlertCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import QrScanner from "react-qr-scanner";
import { authService } from "../../services/api";
import { toast } from "sonner";
import { parseApiError } from "../../utils/parseApiError";

interface QRScannerProps {
  onClose: () => void;
  kioskMode?: boolean;
}

type ScanResult =
  | null
  | { type: "success"; customer: string; bottle: string; mlPoured: number; remainingMl: number; totalMl: number; redemptionId: string; isLow: boolean; isEmpty: boolean }
  | { type: "warning"; message: string }
  | { type: "error"; message: string };

export default function QRScanner({ onClose, kioskMode = false }: QRScannerProps) {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss overlay and reset to scan-ready
  useEffect(() => {
    if (!scanResult) return;
    if (resetTimer.current) clearTimeout(resetTimer.current);

    const delay =
      scanResult.type === "success" && (scanResult.isLow || scanResult.isEmpty) ? 3000
        : scanResult.type === "error" ? 2500
          : scanResult.type === "warning" ? 2000
            : 1500;

    resetTimer.current = setTimeout(() => {
      setScanResult(null);
      setIsProcessing(false);
    }, delay);

    return () => { if (resetTimer.current) clearTimeout(resetTimer.current); };
  }, [scanResult]);

  const handleScan = async (data: any) => {
    if (!data || isProcessing || scanResult) return;
    setIsProcessing(true);

    try {
      const qrContent = data?.text || data;
      let token = qrContent;
      try {
        const parsed = JSON.parse(qrContent);
        if (parsed.id) token = parsed.id;
      } catch { /* not JSON, use raw */ }

      const response = await authService.validateQR(token);

      if (response.success && response.redemption) {
        const r = response.redemption;
        const remainingMl = r.remaining_ml ?? 0;
        const totalMl = r.total_ml ?? 750;
        const isLow = totalMl > 0 && (remainingMl / totalMl) < 0.2;
        const isEmpty = remainingMl === 0;

        if (navigator.vibrate) navigator.vibrate(isEmpty ? [100, 50, 100] : isLow ? [100, 50, 50] : 80);

        setScanResult({
          type: "success",
          customer: r.customer_name || "Customer",
          bottle: r.bottle_name ? `${r.bottle_brand} ${r.bottle_name}` : "Bottle",
          mlPoured: r.peg_size_ml,
          remainingMl,
          totalMl,
          redemptionId: r.id,
          isLow,
          isEmpty,
        });
      } else {
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        const msg = response.message || "Invalid QR code";
        if (msg.toLowerCase().includes("already")) {
          setScanResult({ type: "warning", message: "Already served" });
        } else {
          setScanResult({ type: "error", message: msg });
        }
        toast.error(msg);
      }
    } catch (err: any) {
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
      const msg = parseApiError(err, "Validation failed");
      setScanResult({ type: "error", message: msg });
      toast.error(msg);
    }
  };

  const handleError = (err: any) => {
    setScanResult({ type: "error", message: "Camera error — check permissions" });
  };

  const handleViewDetails = () => {
    if (!scanResult || scanResult.type !== "success") return;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    navigate("/drink-details", {
      state: {
        redemptionId: scanResult.redemptionId,
        bottle: scanResult.bottle,
        pegSize: scanResult.mlPoured,
        customer: scanResult.customer,
        remainingMl: scanResult.remainingMl,
        totalMl: scanResult.totalMl,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-5 pt-12 pb-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <p className="text-xs font-semibold text-white">
            {isProcessing ? "Validating…" : scanResult ? "" : "Ready to scan"}
          </p>
        </div>
        <div className="w-10" />
      </div>

      {/* Camera — always mounted */}
      <div className="flex-1 relative">
        <QrScanner
          delay={scanResult ? false : 300}
          onError={handleError}
          onScan={handleScan}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          constraints={{ video: { facingMode: "environment" } }}
        />

        {/* Scan target overlay */}
        {!scanResult && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-64 h-64">
              <div className="absolute top-0 left-0 w-9 h-9 scan-corner-tl -mt-1 -ml-1" />
              <div className="absolute top-0 right-0 w-9 h-9 scan-corner-tr -mt-1 -mr-1" />
              <div className="absolute bottom-0 left-0 w-9 h-9 scan-corner-bl -mb-1 -ml-1" />
              <div className="absolute bottom-0 right-0 w-9 h-9 scan-corner-br -mb-1 -mr-1" />
              {!isProcessing && <div className="scan-laser" />}
            </div>
          </div>
        )}

        {/* Processing spinner */}
        {isProcessing && !scanResult && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="w-12 h-12 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white font-semibold text-sm">Validating…</p>
          </div>
        )}

        {/* Result overlays */}
        <AnimatePresence>
          {scanResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6"
              style={{
                background:
                  scanResult.type === "success"
                    ? "rgba(6,6,13,0.92)"
                    : scanResult.type === "warning"
                      ? "rgba(120,80,0,0.92)"
                      : "rgba(80,10,10,0.92)",
              }}
            >
              {/* SUCCESS */}
              {scanResult.type === "success" && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 14, stiffness: 200 }}
                  className="w-full max-w-sm"
                >
                  {/* Icon */}
                  <div className="flex justify-center mb-5">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl ${scanResult.isEmpty ? "bg-violet-600 shadow-violet-500/40" : "bg-emerald-500 shadow-emerald-500/40"}`}>
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  {/* Main info */}
                  <div className="text-center mb-5">
                    <p className="text-4xl font-black text-white mb-1">
                      {scanResult.mlPoured}<span className="text-xl font-normal text-white/60 ml-1">ml</span>
                    </p>
                    <p className="text-lg font-bold text-white/90">{scanResult.customer}</p>
                    <p className="text-sm text-white/50 mt-0.5">{scanResult.bottle}</p>
                  </div>

                  {/* Remaining bar */}
                  <div className="bg-white/10 rounded-2xl p-4 mb-4">
                    <div className="flex justify-between text-xs text-white/60 mb-2">
                      <span>Remaining</span>
                      <span className={`font-bold ${scanResult.isLow ? "text-amber-400" : "text-white"}`}>
                        {scanResult.remainingMl} ml
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${scanResult.isEmpty ? "bg-white/20" : scanResult.isLow ? "bg-amber-400" : "bg-emerald-400"}`}
                        style={{ width: `${Math.max(0, (scanResult.remainingMl / scanResult.totalMl) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Low / empty warning */}
                  {(scanResult.isLow || scanResult.isEmpty) && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 ${scanResult.isEmpty ? "bg-violet-500/20 border border-violet-500/30" : "bg-amber-500/20 border border-amber-500/30"}`}>
                      <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${scanResult.isEmpty ? "text-violet-400" : "text-amber-400"}`} />
                      <p className={`text-sm font-semibold ${scanResult.isEmpty ? "text-violet-300" : "text-amber-300"}`}>
                        {scanResult.isEmpty ? "Bottle is now empty 🏁" : `Low — only ${scanResult.remainingMl}ml left`}
                      </p>
                    </div>
                  )}

                  {/* View details link */}
                  <button
                    onClick={handleViewDetails}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors py-2"
                  >
                    View details <ChevronRight className="w-3 h-3" />
                  </button>
                </motion.div>
              )}

              {/* WARNING */}
              {scanResult.type === "warning" && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-amber-500/40">
                    <AlertTriangle className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-2xl font-black text-white mb-2">{scanResult.message}</p>
                  <p className="text-sm text-white/50">This QR was already used</p>
                </motion.div>
              )}

              {/* ERROR */}
              {scanResult.type === "error" && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-red-500/40">
                    <AlertCircle className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-2xl font-black text-white mb-2">{scanResult.message}</p>
                  <p className="text-xs text-white/40 mt-4">Tap anywhere to scan again</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom instruction — only when idle */}
        {!scanResult && !isProcessing && (
          <div className="absolute bottom-12 left-0 right-0 text-center pointer-events-none">
            <p className="text-white/70 text-base font-semibold drop-shadow-lg">
              Point at customer's QR code
            </p>
            {kioskMode && (
              <p className="text-white/30 text-xs mt-1">Kiosk mode active</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
