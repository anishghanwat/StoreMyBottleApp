import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Bottle, Venue, Purchase } from "../../types/api.types";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bottle, venue, purchase } = (location.state || {}) as {
    bottle?: Bottle;
    venue?: Venue;
    purchase?: Purchase;
  };
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!bottle || !venue) {
      setIsRedirecting(true);
      const timer = setTimeout(() => navigate("/"), 100);
      return () => clearTimeout(timer);
    }
  }, [bottle, venue, navigate]);

  // Show loading while redirecting
  if (isRedirecting || !bottle || !venue) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.6, bounce: 0.5 }}
        className="mb-8"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-2xl opacity-40 animate-pulse" />
          <CheckCircle2 className="relative w-24 h-24 text-green-400" strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl font-bold mb-3">Payment Successful!</h1>
        <p className="text-gray-400">Bottle added to your account</p>
      </motion.div>

      {/* Bottle Info */}
      {bottle && venue && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 mb-8 space-y-4"
        >
          <div>
            <p className="text-xs text-purple-400 font-medium mb-1">{bottle.brand}</p>
            <h3 className="text-xl font-semibold">{bottle.name}</h3>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-zinc-800">
            <span className="text-gray-400">Venue</span>
            <span className="font-medium">{venue.name}</span>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-zinc-800">
            <span className="text-gray-400">Available</span>
            <span className="font-medium text-green-400">{bottle.volume_ml} ml</span>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-zinc-800">
            <span className="text-gray-400">Amount Paid</span>
            <span className="font-medium text-white">₹{bottle.price.toLocaleString()}</span>
          </div>
        </motion.div>
      )}

      {/* CTA Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={() => navigate("/my-bottles")}
        className="w-full max-w-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-5 rounded-2xl font-medium text-base transition-all duration-300 active:scale-95 shadow-lg shadow-purple-500/25"
      >
        View My Bottles
      </motion.button>
    </div>
  );
}