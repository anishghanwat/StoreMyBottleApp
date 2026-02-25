import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, Wine, Droplet, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "../utils/haptics";
import { toast } from "sonner";

export default function DrinkDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isServing, setIsServing] = useState(false);

  const data = location.state;
  if (!data) { navigate("/scan"); return null; }

  const pct = (data.remainingMl / data.totalMl) * 100;
  const isLow = pct < 20;
  const servingsLeft = Math.floor(data.remainingMl / data.pegSize);

  const handleServe = () => {
    haptics.medium();
    setIsServing(true);
    setTimeout(() => {
      setIsServing(false);
      setShowConfirmation(true);
      haptics.success();
      toast.success("Drink served successfully! 🥂");
      setTimeout(() => navigate("/home"), 2200);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#06060D] text-white flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/scan")}
          className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.06] text-[#6B6B9A]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-black text-base">Drink Details</h1>
      </div>

      <div className="flex-1 px-5 pb-36 space-y-4">
        <AnimatePresence mode="wait">
          {!showConfirmation ? (
            <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-4">
              {/* Customer card */}
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bar-card p-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center text-xl font-black flex-shrink-0">
                    {data.customer?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[#6B6B9A] uppercase tracking-wider mb-0.5">Customer</p>
                    <p className="font-black text-lg truncate">{data.customer}</p>
                    <p className="text-xs text-[#4A4A6A] font-mono mt-0.5">QR: {data.qrId?.slice(0, 12)}…</p>
                  </div>
                </div>
              </motion.div>

              {/* Bottle card */}
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bar-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Wine className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-bold text-[#6B6B9A] uppercase tracking-wider">Bottle</span>
                </div>
                <h2 className="text-xl font-black mb-1">{data.bottle}</h2>
                <p className="text-sm text-[#6B6B9A] mb-5">Premium Selection</p>

                {/* Peg being served */}
                <div className="flex items-center justify-between mb-5 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <span className="text-sm text-[#B0B0D0]">Pour size</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black">{data.pegSize}</span>
                    <span className="text-sm text-[#6B6B9A]">ml</span>
                    <span className="text-xl ml-1">🥃</span>
                  </div>
                </div>

                {/* Volume progress */}
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#6B6B9A]">Remaining</span>
                    <span className="font-bold">{data.remainingMl}ml / {data.totalMl}ml</span>
                  </div>
                  <div className="bar-progress h-2.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className={`bar-progress-fill h-full ${isLow ? "bar-progress-fill-amber" : ""}`}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <Droplet className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-xs text-[#6B6B9A]">~{servingsLeft} {servingsLeft === 1 ? "serving" : "servings"} remaining</span>
                  </div>
                </div>
              </motion.div>

              {/* Low-level warning */}
              {isLow && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bar-card p-4 border border-amber-500/30 bg-amber-500/5 flex items-center gap-3"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-amber-300 text-sm">Low bottle level — please inform the customer.</p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* Success state */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              {/* Emerald ambient */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 14, stiffness: 200 }}
                className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/40 relative"
              >
                <CheckCircle2 className="w-14 h-14 text-white" />
              </motion.div>
              <h2 className="text-3xl font-black mb-1">Cheers! 🥂</h2>
              <p className="text-[#6B6B9A] text-sm mb-6">Drink served successfully</p>
              <div className="bar-card px-8 py-5 text-center border border-emerald-500/20">
                <p className="text-xs text-[#6B6B9A] mb-1">Served</p>
                <p className="text-4xl font-black text-emerald-400">{data.pegSize}<span className="text-lg ml-1">ml</span></p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky serve button */}
      {!showConfirmation && (
        <div className="fixed bottom-0 inset-x-0 px-5 pb-8 pt-4 bg-gradient-to-t from-[#06060D] to-transparent">
          <motion.button
            whileTap={{ scale: 0.975 }}
            onClick={handleServe}
            disabled={isServing}
            className="btn-confirm w-full py-5 flex items-center justify-center gap-3 text-base font-black disabled:opacity-50"
          >
            {isServing ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Serving…</>
            ) : (
              <><Droplet className="w-5 h-5" />Serve Drink · {data.pegSize}ml</>
            )}
          </motion.button>
          <button
            onClick={() => navigate("/scan")}
            className="w-full py-3 mt-2 text-sm text-[#4A4A6A] hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}