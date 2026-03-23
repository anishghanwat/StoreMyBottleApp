import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Bottle, Venue, Purchase } from "../../types/api.types";
import { venueService } from "../../services/venue.service";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bottle, venue, purchase } = (location.state || {}) as { bottle?: Bottle; venue?: Venue; purchase?: Purchase };
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    if (!bottle || !venue) {
      setIsRedirecting(true);
      const t = setTimeout(() => navigate("/"), 100);
      return () => clearTimeout(t);
    }
    // Mark user as a returning purchaser so BottleDetails hides "How it works"
    localStorage.setItem('smb_purchased', '1');
    // Show rating prompt after a short delay
    const t = setTimeout(() => setShowRating(true), 1200);
    return () => clearTimeout(t);
  }, [bottle, venue, navigate]);

  const handleRatingSubmit = async (star: number) => {
    setSelectedStar(star);
    try {
      await venueService.rateVenue(venue!.id, star);
    } catch { /* silent — rating is non-critical */ }
    setRatingSubmitted(true);
    setTimeout(() => setShowRating(false), 1200);
  };

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
            <span className="font-black text-gold">₹{Math.round(bottle.price).toLocaleString('en-IN')}</span>
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

      <p className="text-[#4A4A6A] text-xs text-center pb-8 px-6">
        🥂 Enjoy responsibly · Please don't drink and drive
      </p>

      {/* Venue rating prompt */}
      <AnimatePresence>
        {showRating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-8"
            onClick={() => setShowRating(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#111118] border border-white/[0.08] rounded-3xl p-6 text-center"
            >
              {ratingSubmitted ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="py-2"
                >
                  <p className="text-2xl mb-1">🙏</p>
                  <p className="font-bold text-white">Thanks for rating!</p>
                  <p className="text-[#7171A0] text-sm mt-1">Your feedback helps others</p>
                </motion.div>
              ) : (
                <>
                  <p className="text-[11px] text-violet-400 font-semibold uppercase tracking-wider mb-1">Quick question</p>
                  <h3 className="font-bold text-white text-lg mb-1">How's {venue.name}?</h3>
                  <p className="text-[#7171A0] text-sm mb-5">Rate your experience at this venue</p>
                  <div className="flex justify-center gap-3 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoverStar(star)}
                        onMouseLeave={() => setHoverStar(0)}
                        onClick={() => handleRatingSubmit(star)}
                        className="transition-transform active:scale-90"
                      >
                        <Star
                          className={`w-9 h-9 transition-colors duration-150 ${star <= (hoverStar || selectedStar)
                              ? "fill-amber-400 text-amber-400"
                              : "text-white/20"
                            }`}
                          strokeWidth={1.5}
                        />
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowRating(false)}
                    className="text-[#4A4A6A] text-xs hover:text-[#7171A0] transition-colors"
                  >
                    Skip for now
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}