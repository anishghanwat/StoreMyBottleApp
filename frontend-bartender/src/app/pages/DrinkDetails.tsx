import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, Wine, Droplet, User, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "../utils/haptics";

export default function DrinkDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isServing, setIsServing] = useState(false);

  const data = location.state;

  if (!data) {
    navigate("/scan"); // Redirect if no data
    return null;
  }

  const percentageRemaining = (data.remainingMl / data.totalMl) * 100;

  const handleServeDrink = () => {
    haptics.medium();
    setIsServing(true);

    setTimeout(() => {
      setIsServing(false);
      setShowConfirmation(true);
      haptics.success();

      // Navigate back to home after success
      setTimeout(() => {
        navigate("/home");
      }, 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f]">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-[rgba(10,10,15,0.8)] border-b border-purple-500/20">
        <div className="px-6 py-4">
          <button
            onClick={() => navigate("/scan")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!showConfirmation ? (
          <motion.div
            key="details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 p-6 pt-8"
          >
            {/* Customer Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 rounded-3xl border border-purple-500/20 bg-[rgba(17,17,27,0.7)] backdrop-blur-xl mb-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Customer</p>
                  <h2 className="text-xl font-semibold text-white">{data.customer}</h2>
                </div>
              </div>
              <div className="text-xs text-gray-500 font-mono">
                QR: {data.qrId}
              </div>
            </motion.div>

            {/* Bottle Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-8 rounded-3xl border border-purple-500/20 bg-[rgba(17,17,27,0.7)] backdrop-blur-xl mb-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Wine className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Bottle Details</h3>
              </div>

              <div className="mb-8">
                <h4 className="text-2xl font-bold text-white mb-2">{data.bottle}</h4>
                <p className="text-gray-400">Premium Selection</p>
              </div>

              {/* Peg Size Selector */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-3">Pour Size (ml)</label>
                <div className="grid grid-cols-3 gap-3">
                  {[30, 45, 60].map((size) => (
                    <button
                      key={size}
                      className={`py-4 rounded-2xl border-2 transition-all ${size === data.pegSize
                          ? "border-purple-500 bg-purple-500/20 text-white"
                          : "border-purple-500/30 bg-[rgba(17,17,27,0.5)] text-gray-400 hover:border-purple-500/50"
                        }`}
                    >
                      <div className="text-2xl font-bold">{size}</div>
                      <div className="text-xs">ml</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Remaining ml */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-400">Remaining</span>
                  <span className="text-lg font-semibold text-white">
                    {data.remainingMl}ml / {data.totalMl}ml
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="relative h-3 rounded-full bg-[rgba(17,17,27,0.8)] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentageRemaining}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                  />
                </div>

                {/* Servings Left */}
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <Droplet className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-400">
                    ~{Math.floor(data.remainingMl / data.pegSize)} servings remaining
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Warning if low */}
            {percentageRemaining < 20 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 mb-6"
              >
                <p className="text-yellow-400 text-sm text-center">
                  ⚠️ Low bottle level - inform customer
                </p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6 shadow-2xl shadow-green-500/50"
            >
              <CheckCircle2 className="w-16 h-16 text-white" />
            </motion.div>

            <h2 className="text-2xl font-bold text-white mb-2">Drink Served!</h2>
            <p className="text-gray-400 mb-4">Transaction complete</p>

            <div className="glass-card p-6 rounded-2xl border border-green-500/20 bg-[rgba(17,17,27,0.5)]">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Served</p>
                <p className="text-3xl font-bold text-green-400">{data.pegSize}ml</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Button */}
      {!showConfirmation && (
        <div className="sticky bottom-0 p-6 bg-gradient-to-t from-[#0a0a0f] to-transparent">
          <button
            onClick={handleServeDrink}
            disabled={isServing}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center gap-3 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all disabled:opacity-50 active:scale-95"
          >
            {isServing ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Serving...
              </>
            ) : (
              <>
                <Droplet className="w-6 h-6" />
                Serve Drink
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}