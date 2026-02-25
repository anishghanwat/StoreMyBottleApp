import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Bottle, Venue, Purchase } from "../../types/api.types";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bottle, venue, purchase } = (location.state || {}) as { bottle?: Bottle; venue?: Venue; purchase?: Purchase };
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!bottle || !venue) {
      setIsRedirecting(true);
      const t = setTimeout(() => navigate("/"), 100);
      return () => clearTimeout(t);
    }
  }, [bottle, venue, navigate]);

  if (isRedirecting || !bottle || !venue) return (
    <div className="min-h-screen bg-[#09090F] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090F] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Emerald ambient */}
      <div className="absolute inset-0 bg-gradient-radial from-emerald-900/20 via-transparent to-transparent pointer-events-none" />
      {/* Violet corner accent */}
      <div className="absolute top-[-60px] right-[-60px] w-48 h-48 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", bounce: 0.5, duration: 0.7 }}
        className="mb-8 relative"
      >
        <div className="absolute inset-0 bg-emerald-500/25 rounded-full blur-3xl scale-150 animate-pulse" />
        <div className="relative w-28 h-28 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-400" strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl font-black tracking-tight mb-2">You're all set! 🎉</h1>
        <p className="text-[#7171A0] text-sm">Bottle stored · Ready to redeem anytime</p>
      </motion.div>

      {/* Purchase summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="w-full max-w-xs card-surface p-5 mb-8 space-y-3"
      >
        <div>
          <p className="text-[11px] text-violet-400 font-semibold uppercase tracking-wider">{bottle.brand}</p>
          <h3 className="font-bold text-lg">{bottle.name}</h3>
        </div>
        <div className="border-t border-white/[0.07] pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#7171A0]">Venue</span>
            <span className="font-medium">{venue.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#7171A0]">Volume</span>
            <span className="font-semibold text-emerald-400">{bottle.volume_ml} ml</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#7171A0]">Paid</span>
            <span className="font-black text-gold">₹{bottle.price.toLocaleString()}</span>
          </div>
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-xs space-y-3"
      >
        <button
          onClick={() => navigate("/my-bottles")}
          className="btn-primary w-full py-4 rounded-2xl font-bold text-base text-white"
        >
          View My Bottles →
        </button>
        <button
          onClick={() => navigate("/")}
          className="w-full py-3.5 rounded-2xl border border-white/[0.07] text-[#7171A0] text-sm font-semibold hover:bg-white/5 transition-colors"
        >
          Browse More Venues
        </button>
      </motion.div>
    </div>
  );
}