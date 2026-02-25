import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { X, ScanLine, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import QrScanner from "react-qr-scanner";
import { authService } from "../../services/api";
import { toast } from "sonner";

interface QRScannerProps {
  onClose: () => void;
}

export default function QRScanner({ onClose }: QRScannerProps) {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const handleScan = async (data: any) => {
    if (data && !isProcessing && !warning && !error) {
      setIsProcessing(true);
      setError("");
      setWarning("");

      try {
        const qrContent = data?.text || data; // react-qr-scanner returns object or string
        console.log("Scanned:", qrContent);

        // Parse QR content if it's JSON (our app generates JSON)
        let token = qrContent;
        try {
          const parsed = JSON.parse(qrContent);
          if (parsed.id) token = parsed.id;
        } catch (e) {
          // Not JSON, assume token
        }

        const response = await authService.validateQR(token);

        if (response.success && response.redemption) {
          const r = response.redemption;
          // Parse qr_data from response if it's a string
          let qrDataObj: any = {};
          try {
            qrDataObj = JSON.parse(r.qr_data);
          } catch (e) { }

          toast.success("QR code validated!");
          navigate("/drink-details", {
            state: {
              redemptionId: r.id,
              bottle: r.bottle_name ? `${r.bottle_brand} ${r.bottle_name}` : (qrDataObj.bottle || "Unknown Bottle"),
              pegSize: r.peg_size_ml,
              customer: r.customer_name || "Valued Customer",
              remainingMl: r.remaining_ml ?? 0,
              totalMl: r.total_ml ?? 750,
              qrId: r.qr_token
            }
          });
        } else {
          if (response.message === "QR code already used") {
            setWarning("Already Served");
            toast.error("QR code already used");
            setTimeout(() => {
              setWarning("");
              setIsProcessing(false);
            }, 3000);
          } else {
            setError(response.message || "Invalid QR Code");
            toast.error(response.message || "Invalid QR code");
            setTimeout(() => {
              setError("");
              setIsProcessing(false);
            }, 2000);
          }
        }
      } catch (err: any) {
        console.error("Validation error:", err);
        const errorMsg = err.response?.data?.detail || "Validation Failed";
        setError(errorMsg);
        toast.error(errorMsg);
        setTimeout(() => {
          setError("");
          setIsProcessing(false);
        }, 2000);
      }
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    setError("Camera error. Please ensure permissions are granted.");
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0f]">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-[rgba(17,17,27,0.8)] border border-purple-500/30 flex items-center justify-center hover:bg-[rgba(17,17,27,1)] transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Scanner Frame */}
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="relative w-full max-w-sm aspect-square bg-black rounded-3xl overflow-hidden">
          <QrScanner
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            constraints={{
              video: { facingMode: "environment" }
            }}
          />

          {/* Overlay UI */}
          <div className="absolute inset-0 border-2 border-purple-500/50 rounded-3xl pointer-events-none">
            <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-purple-500 rounded-tl-3xl" />
            <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-purple-500 rounded-tr-3xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-purple-500 rounded-bl-3xl" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-purple-500 rounded-br-3xl" />
          </div>

          {/* Scanning Line */}
          {!isProcessing && !error && !warning && (
            <motion.div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-lg shadow-purple-400/50"
              animate={{ top: ["10%", "90%", "10%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {/* Processing State */}
          {isProcessing && !error && !warning && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
              <p className="text-white font-semibold">Validating...</p>
            </div>
          )}

          {/* Warning State (Already Redeemed) */}
          {warning && (
            <div className="absolute inset-0 bg-yellow-900/80 flex flex-col items-center justify-center backdrop-blur-sm p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-black" />
              </div>
              <p className="text-white font-bold text-xl mb-1">{warning}</p>
              <p className="text-yellow-200 text-sm">This code was used previously</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center backdrop-blur-sm p-4 text-center">
              <X className="w-12 h-12 text-white mb-4" />
              <p className="text-white font-semibold">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400">Position the QR code within the frame</p>
        </div>
      </div>
    </div>
  );
}
