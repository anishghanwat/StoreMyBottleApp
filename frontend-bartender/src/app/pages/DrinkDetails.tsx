import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, Wine, Droplet, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

export default function DrinkDetails() {
  const location = useLocation();
  const navigate = useNavigate();

  const data = location.state;
  if (!data) { navigate("/scan"); return null; }

  const pct = (data.remainingMl / data.totalMl) * 100;
  const isLow = pct < 20;
  const isEmpty = data.remainingMl === 0;
  const servingsLeft = Math.floor(data.remainingMl / data.pegSize);

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
        <h1 className="font-black text-base">Redemption Details</h1>
      </div>

      <div className="flex-1 px-5 pb-10 space-y-4">

        {/* Served confirmation banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bar-card p-4 border border-emerald-500/30 bg-emerald-500/5 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Droplet className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-400">Drink served</p>
            <p className="text-xs text-emerald-400/60">{data.pegSize}ml poured successfully</p>
          </div>
        </motion.div>

        {/* Customer card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bar-card p-5"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center text-xl font-black flex-shrink-0">
              {data.customer?.charAt(0) || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#6B6B9A] uppercase tracking-wider mb-0.5">Customer</p>
              <p className="font-black text-lg truncate">{data.customer}</p>
              {data.qrId && (
                <p className="text-xs text-[#4A4A6A] font-mono mt-0.5">QR: {data.qrId?.slice(0, 12)}…</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Bottle card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bar-card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Wine className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold text-[#6B6B9A] uppercase tracking-wider">Bottle</span>
          </div>
          <h2 className="text-xl font-black mb-1">{data.bottle}</h2>

          {/* Peg poured */}
          <div className="flex items-center justify-between mb-5 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <span className="text-sm text-[#B0B0D0]">Poured</span>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black">{data.pegSize}</span>
              <span className="text-sm text-[#6B6B9A]">ml</span>
              <span className="text-xl ml-1">🥃</span>
            </div>
          </div>

          {/* Volume progress */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-[#6B6B9A]">Remaining after pour</span>
              <span className={`font-bold ${isLow ? "text-amber-400" : "text-white"}`}>
                {data.remainingMl}ml / {data.totalMl}ml
              </span>
            </div>
            <div className="bar-progress h-2.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, pct)}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`bar-progress-fill h-full ${isLow ? "bar-progress-fill-amber" : ""}`}
              />
            </div>
            {!isEmpty && (
              <div className="flex items-center gap-1.5 mt-2.5">
                <Droplet className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs text-[#6B6B9A]">
                  ~{servingsLeft} {servingsLeft === 1 ? "serving" : "servings"} remaining
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Low / empty warning */}
        {(isLow || isEmpty) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`bar-card p-4 flex items-center gap-3 ${isEmpty ? "border border-violet-500/30 bg-violet-500/5" : "border border-amber-500/30 bg-amber-500/5"}`}
          >
            <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${isEmpty ? "text-violet-400" : "text-amber-400"}`} />
            <p className={`text-sm ${isEmpty ? "text-violet-300" : "text-amber-300"}`}>
              {isEmpty ? "Bottle is now empty — please inform the customer." : "Low bottle level — please inform the customer."}
            </p>
          </motion.div>
        )}
      </div>

      {/* Back to scan */}
      <div className="px-5 pb-8 pt-3">
        <button
          onClick={() => navigate("/scan")}
          className="w-full py-4 rounded-2xl font-bold text-sm bg-white/[0.04] border border-white/[0.06] text-[#6B6B9A] hover:text-white transition-colors"
        >
          Back to Scanner
        </button>
      </div>
    </div>
  );
}
