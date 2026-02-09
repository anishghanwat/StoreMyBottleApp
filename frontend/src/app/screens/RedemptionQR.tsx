import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Timer, ScanLine } from "lucide-react";
import { Redemption, UserBottle } from "../../types/api.types";
import { redemptionService } from "../../services/redemption.service";
import { motion } from "motion/react";

export default function RedemptionQR() {
  const { bottleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { redemption, bottle } = (location.state || {}) as { redemption?: Redemption; bottle?: UserBottle };

  const [countdown, setCountdown] = useState(900); // 15 minutes validity
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!bottle || !redemption) {
      navigate("/my-bottles");
      return;
    }

    // Calculate countdown from QR expiry time
    let expiryStr = new Date(redemption.qr_expires_at).toISOString(); // Ensure format
    // But wait, if redemption.qr_expires_at is naive string, new Date() might parse as local.
    // Better to modify the string directly if needed.

    // Check if timezone info is missing
    let dateStr = String(redemption.qr_expires_at);
    if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
      dateStr += 'Z';
    }

    const expiryTime = new Date(dateStr).getTime();
    const now = Date.now();
    const secondsRemaining = Math.floor((expiryTime - now) / 1000);
    setCountdown(Math.max(0, secondsRemaining));

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // QR expired, navigate back
          setTimeout(() => navigate("/my-bottles"), 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [bottle, redemption, navigate]);

  // Poll for redemption status
  useEffect(() => {
    if (!redemption || isRedeemed || isValidating) return;

    const pollInterval = setInterval(async () => {
      try {
        const updated = await redemptionService.getRedemptionStatus(redemption.id);
        if (updated.status === 'redeemed') {
          setIsRedeemed(true);
          clearInterval(pollInterval);
          setTimeout(() => navigate("/my-bottles"), 3000);
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [redemption, isRedeemed, isValidating, navigate]);

  const handleSimulateScan = async () => {
    if (!redemption) return;

    try {
      setIsValidating(true);
      // Simulate bartender scanning the QR
      const response = await redemptionService.validateQR(redemption.qr_token);

      if (response.success) {
        setIsRedeemed(true);
        // Navigate back after a delay
        setTimeout(() => navigate("/my-bottles"), 3000);
      } else {
        alert(response.message || "Redemption failed");
      }
    } catch (err) {
      console.error(err);
      alert("Validation failed");
    } finally {
      setIsValidating(false);
    }
  };

  if (!bottle || !redemption) {
    return null;
  }

  // Use real QR data from backend (contains JSON with venue, bottle, etc.)
  const qrData = redemption.qr_data;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      {/* Status Badge */}
      {!isRedeemed && (
        <div className="mb-8">
          <div className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full backdrop-blur-xl">
            <Timer className="w-4 h-4" />
            <span className="text-sm font-medium">
              {minutes}:{seconds.toString().padStart(2, "0")} remaining
            </span>
          </div>
        </div>
      )}

      {isRedeemed ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6, bounce: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-2xl opacity-40 animate-pulse" />
            <CheckCircle2 className="relative w-24 h-24 text-green-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold">Drink Redeemed!</h1>
          <p className="text-gray-400 text-sm mt-2">Enjoy your drink</p>
        </motion.div>
      ) : (
        <>
          {/* Title */}
          <h1 className="text-2xl font-bold mb-2 text-center">Show QR to Bartender</h1>
          <p className="text-gray-400 text-sm mb-8 text-center">Valid for one drink only</p>

          {/* QR Code */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-30 animate-pulse" />
            <div className="relative bg-white p-8 rounded-3xl shadow-2xl">
              <QRCodeSVG
                value={qrData}
                size={240}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Redemption Info */}
          <div className="w-full max-w-sm bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 space-y-4 mb-8">
            <div>
              <p className="text-xs text-purple-400 font-medium mb-1">{bottle.bottleBrand}</p>
              <h3 className="text-xl font-semibold">{bottle.bottleName}</h3>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-zinc-800">
              <span className="text-gray-400">Peg Size</span>
              <span className="text-2xl font-bold text-purple-400">{redemption.peg_size_ml} ml</span>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-zinc-800">
              <span className="text-gray-400">After Redemption</span>
              <span className="font-medium text-green-400">{bottle.remainingMl - redemption.peg_size_ml} ml</span>
            </div>
          </div>

          {/* Simulation Button (Demo only) */}
          <button
            onClick={handleSimulateScan}
            disabled={isValidating}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors text-sm text-gray-300 border border-zinc-700"
          >
            <ScanLine className="w-4 h-4" />
            {isValidating ? "Simulating..." : "Simulate Bartender Scan"}
          </button>

          {/* Warning */}
          <p className="text-gray-500 text-xs mt-6 text-center max-w-xs">
            This QR code will expire after redemption or when the timer runs out
          </p>
        </>
      )}
    </div>
  );
}
