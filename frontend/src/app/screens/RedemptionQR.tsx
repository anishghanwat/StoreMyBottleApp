import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, AlertCircle, ArrowLeft, Droplets, Wine, Loader2 } from "lucide-react";
import { Redemption, UserBottle } from "../../types/api.types";
import { redemptionService } from "../../services/redemption.service";
import { purchaseService } from "../../services/purchase.service";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { motion, AnimatePresence } from "motion/react";

const ACTIVE_REDEMPTION_KEY = "activeRedemptionId";
const ACTIVE_BOTTLE_KEY = "activeRedemptionBottleId";

export default function RedemptionQR() {
  const { bottleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const stateData = (location.state || {}) as { redemption?: Redemption; bottle?: UserBottle };

  const [redemption, setRedemption] = useState<Redemption | null>(stateData.redemption ?? null);
  const [bottle, setBottle] = useState<UserBottle | null>(stateData.bottle ?? null);
  const [recovering, setRecovering] = useState(!stateData.redemption || !stateData.bottle);

  const [countdown, setCountdown] = useState(900);
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef<number | null>(null);

  // ── Recovery: fetch from API when navigated back (state is gone) ──
  useEffect(() => {
    if (redemption && bottle) { setRecovering(false); return; }

    // Try localStorage first, then fall back to URL param
    const savedRedemptionId = localStorage.getItem(ACTIVE_REDEMPTION_KEY);
    const savedBottleId = localStorage.getItem(ACTIVE_BOTTLE_KEY) || bottleId;

    if (!savedRedemptionId || !savedBottleId) {
      navigate("/my-bottles", { replace: true });
      return;
    }

    (async () => {
      try {
        const [fetchedRedemption, bottles] = await Promise.all([
          redemptionService.getRedemptionStatus(savedRedemptionId),
          purchaseService.getUserBottles(),
        ]);

        if (fetchedRedemption.status === "redeemed" || fetchedRedemption.status === "expired") {
          localStorage.removeItem(ACTIVE_REDEMPTION_KEY);
          localStorage.removeItem(ACTIVE_BOTTLE_KEY);
          navigate("/my-bottles", { replace: true });
          return;
        }

        // Match by savedBottleId or by purchase_id on the redemption
        const matchedBottle = bottles.find(b => b.id === savedBottleId)
          ?? bottles.find(b => b.purchaseId === fetchedRedemption.purchase_id);

        if (!matchedBottle) {
          navigate("/my-bottles", { replace: true });
          return;
        }

        setRedemption(fetchedRedemption);
        setBottle(matchedBottle);
      } catch {
        navigate("/my-bottles", { replace: true });
      } finally {
        setRecovering(false);
      }
    })();
  }, []);

  // ── Countdown timer ──
  useEffect(() => {
    if (!redemption || recovering) return;

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
          localStorage.removeItem(ACTIVE_REDEMPTION_KEY);
          localStorage.removeItem(ACTIVE_BOTTLE_KEY);
          setTimeout(() => navigate("/my-bottles"), 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [redemption, recovering]);

  // ── Poll for redemption status ──
  useEffect(() => {
    if (!redemption || isRedeemed || isExpired || recovering) return;
    const poll = setInterval(async () => {
      try {
        const updated = await redemptionService.getRedemptionStatus(redemption.id);
        if (updated.status === "redeemed") {
          setIsRedeemed(true);
          clearInterval(poll);
          localStorage.removeItem(ACTIVE_REDEMPTION_KEY);
          localStorage.removeItem(ACTIVE_BOTTLE_KEY);
          setTimeout(() => navigate("/my-bottles"), 3500);
        }
      } catch { }
    }, 3000);
    return () => clearInterval(poll);
  }, [redemption, isRedeemed, isExpired, recovering]);

  // ── Loading / recovery spinner ──
  if (recovering) {
    return (
      <div className="min-h-screen bg-[#09090F] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!bottle || !redemption) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const pct = (countdown / 900) * 100;
  const isLow = countdown < 120;
  const circumference = 2 * Math.PI * 54;
  const afterPour = Math.max(0, bottle.remainingMl - redemption.peg_size_ml);

  /* ── Success State ── */
  if (isRedeemed) {
    return (
      <div className="min-h-screen bg-[#09090F] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-emerald-900/20 to-transparent pointer-events-none" />
        <motion.div
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
      </div>
    );
  }

  /* ── Expired State ── */
  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#09090F] text-white flex flex-col items-center justify-center px-6">
        <motion.div
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
            className="bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-fuchsia-500/30"
          >
            Generate New QR
          </button>
        </motion.div>
      </div>
    );
  }

  /* ── Active QR State ── */
  return (
    <div className="flex flex-col h-screen bg-[#09090F] text-white overflow-hidden">

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* Hero — bottle image with gradient, back button + header overlaid */}
        <div className="relative h-52 bg-black overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center p-8 opacity-80">
            <ImageWithFallback
              src={bottle.image || "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"}
              alt={bottle.bottleName}
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090F] via-[#09090F]/30 to-transparent" />

          <button
            onClick={() => navigate(-1)}
            className="absolute top-5 left-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="absolute bottom-0 inset-x-0 px-5 pb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-fuchsia-400 mb-0.5">{bottle.bottleBrand}</p>
            <h1 className="text-xl font-extrabold text-white leading-tight">{bottle.bottleName}</h1>
            <p className="text-xs text-white/50 mt-0.5">{bottle.venueName}</p>
          </div>
        </div>

        <div className="px-5 pt-5 pb-6 space-y-4">

          {/* Instructions label */}
          <div className="text-center">
            <p className="text-[11px] text-[#7171A0] uppercase tracking-widest mb-0.5">Show to bartender</p>
            <p className="text-lg font-black tracking-tight">Scan to Pour</p>
          </div>

          {/* QR Code card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-surface p-5 flex flex-col items-center space-y-5"
          >
            {/* QR with timer ring */}
            <div className="relative">
              <svg className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)]" viewBox="0 0 124 124">
                <circle cx="62" cy="62" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
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

              <div className="relative">
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

            {/* Timer pill */}
            <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-bold transition-colors duration-500 ${isLow
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-violet-500/10 border-violet-500/30 text-violet-300"
              }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${isLow ? "bg-red-400" : "bg-violet-400"}`} />
              {minutes}:{seconds.toString().padStart(2, "0")} remaining
            </div>

            {/* Timestamp watermark - security feature */}
            {redemption.qr_data && (() => {
              try {
                const qrData = JSON.parse(redemption.qr_data);
                if (qrData.created) {
                  const createdDate = new Date(qrData.created);
                  return (
                    <div className="text-[10px] text-[#4A4A6A] text-center">
                      Generated: {createdDate.toLocaleTimeString()}
                    </div>
                  );
                }
              } catch { }
              return null;
            })()}
          </motion.div>

          {/* Pour details card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-surface p-4 space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-[#4A4A6A] mb-1 flex items-center gap-1">
                  <Wine className="w-3 h-3" /> Peg Size
                </p>
                <p className="font-black text-xl text-violet-400">
                  {redemption.peg_size_ml} <span className="text-sm font-normal text-[#7171A0]">ml</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#4A4A6A] mb-1 flex items-center gap-1">
                  <Droplets className="w-3 h-3" /> After Pour
                </p>
                <p className="font-black text-xl text-emerald-400">
                  {afterPour} <span className="text-sm font-normal text-[#7171A0]">ml</span>
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${(bottle.remainingMl / bottle.totalMl) * 100}%` }}
              />
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 absolute top-0 left-0 transition-all duration-500"
                style={{ width: `${(afterPour / bottle.totalMl) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[#4A4A6A] text-right">
              {bottle.remainingMl} ml → {afterPour} ml
            </p>
          </motion.div>

        </div>
      </div>

      {/* Pinned bottom */}
      <div className="px-5 pb-8 pt-3 bg-gradient-to-t from-[#09090F] via-[#09090F]/90 to-transparent flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/my-bottles")}
          className="w-full py-4 rounded-2xl font-bold text-base bg-[#111118] border border-white/[0.08] text-[#7171A0] hover:border-white/20 transition-all duration-200"
        >
          Back to My Bottles
        </motion.button>
      </div>
    </div>
  );
}
