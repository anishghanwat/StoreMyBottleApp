import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Redemption, UserBottle } from "../../types/api.types";
import { redemptionService } from "../../services/redemption.service";
import { motion, AnimatePresence } from "motion/react";

export default function RedemptionQR() {
  const { bottleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { redemption, bottle } = (location.state || {}) as { redemption?: Redemption; bottle?: UserBottle };

  const [countdown, setCountdown] = useState(900);
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!bottle || !redemption) { navigate("/my-bottles"); return; }

    let dateStr = String(redemption.qr_expires_at);
    if (!dateStr.endsWith("Z") && !dateStr.includes("+")) dateStr += "Z";
    const expiryTime = new Date(dateStr).getTime();
    const initial = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
    setCountdown(initial);

    timerRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsExpired(true);
          setTimeout(() => navigate("/my-bottles"), 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [redemption, bottle, navigate]);

  // Poll for redemption
  useEffect(() => {
    if (!redemption || isRedeemed || isExpired) return;
    const poll = setInterval(async () => {
      try {
        const updated = await redemptionService.getRedemptionStatus(redemption.id);
        if (updated.status === "redeemed") {
          setIsRedeemed(true);
          clearInterval(poll);
          setTimeout(() => navigate("/my-bottles"), 3500);
        }
      } catch { }
    }, 3000);
    return () => clearInterval(poll);
  }, [redemption, isRedeemed, isExpired, navigate]);

  if (!bottle || !redemption) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const pct = (countdown / 900) * 100;
  const isLow = countdown < 120;
  const circumference = 2 * Math.PI * 54; // r=54

  return (
    <div className="min-h-screen bg-[#09090F] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient glow that changes color near expiry */}
      <div className={`absolute inset-0 transition-colors duration-1000 pointer-events-none ${isRedeemed
        ? "bg-gradient-radial from-emerald-900/20 to-transparent"
        : isLow
          ? "bg-gradient-radial from-red-900/15 to-transparent"
          : "bg-gradient-radial from-violet-900/15 to-transparent"
        }`} />

      <AnimatePresence mode="wait">
        {isRedeemed ? (
          /* ── Success State ── */
          <motion.div
            key="success"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.7 }}
            className="flex flex-col items-center text-center"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-3xl animate-pulse scale-150" />
              <CheckCircle2 className="relative w-28 h-28 text-emerald-400" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Cheers! 🥂</h1>
            <p className="text-[#7171A0]">Your {redemption.peg_size_ml} ml has been poured</p>
            <p className="text-[#4A4A6A] text-sm mt-1">Redirecting to my bottles...</p>
          </motion.div>
        ) : isExpired ? (
          /* ── Expired State ── */
          <motion.div
            key="expired"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">QR Expired</h1>
            <p className="text-[#7171A0] text-sm mb-6">Generate a new QR code to redeem</p>
            <button
              onClick={() => navigate(`/redeem/${bottleId}`)}
              className="btn-primary px-8 py-3.5 rounded-2xl font-bold text-sm text-white"
            >
              Generate New QR
            </button>
          </motion.div>
        ) : (
          /* ── Active QR State ── */
          <motion.div
            key="qr"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center w-full"
          >
            {/* Instructions */}
            <p className="text-xs text-[#7171A0] uppercase tracking-widest mb-1">Show to bartender</p>
            <h1 className="text-2xl font-black tracking-tight mb-6 text-center">Scan to Pour</h1>

            {/* QR with SVG countdown ring */}
            <div className="relative mb-6">
              {/* Outer timer ring */}
              <svg className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)]" viewBox="0 0 124 124">
                {/* Background ring */}
                <circle cx="62" cy="62" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                {/* Progress ring */}
                <circle
                  cx="62" cy="62" r="54"
                  fill="none"
                  stroke={isLow ? "#EF4444" : "#7C3AED"}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - pct / 100)}
                  transform="rotate(-90 62 62)"
                  style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
                />
              </svg>

              {/* QR Code */}
              <div className="relative">
                {/* Glow behind QR */}
                <div className={`absolute inset-0 rounded-3xl blur-2xl opacity-30 ${isLow ? "bg-red-500" : "bg-violet-500"} transition-colors duration-500`} />
                <div className="relative bg-white p-5 rounded-3xl shadow-2xl">
                  <QRCodeSVG
                    value={redemption.qr_data}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>
            </div>

            {/* Timer */}
            <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-bold mb-6 transition-colors duration-500 ${isLow
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-violet-500/10 border-violet-500/30 text-violet-300"
              }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${isLow ? "bg-red-400" : "bg-violet-400"}`} />
              {minutes}:{seconds.toString().padStart(2, "0")} remaining
            </div>

            {/* Details pill */}
            <div className="w-full max-w-xs card-surface p-4 space-y-3 mb-6">
              <div>
                <p className="text-[11px] text-violet-400 font-semibold uppercase tracking-wider">{bottle.bottleBrand}</p>
                <h3 className="font-bold text-base">{bottle.bottleName}</h3>
                <p className="text-xs text-[#7171A0] mt-0.5">{bottle.venueName}</p>
              </div>
              <div className="border-t border-white/[0.07] pt-3 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[11px] text-[#4A4A6A]">Peg Size</p>
                  <p className="font-black text-xl text-violet-400">{redemption.peg_size_ml} <span className="text-sm text-[#7171A0] font-normal">ml</span></p>
                </div>
                <div>
                  <p className="text-[11px] text-[#4A4A6A]">After Pour</p>
                  <p className="font-bold text-xl text-emerald-400">{bottle.remainingMl - redemption.peg_size_ml} <span className="text-sm text-[#7171A0] font-normal">ml</span></p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
