import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, Wine, Droplets } from "lucide-react";
import { purchaseService } from "../../services/purchase.service";
import { redemptionService } from "../../services/redemption.service";
import { UserBottle } from "../../types/api.types";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { motion } from "motion/react";
import { toast } from "sonner";

const PEG_SIZES = [
  { ml: 30, label: "Small", subtitle: "Classic peg", emoji: "🥃" },
  { ml: 45, label: "Regular", subtitle: "Standard pour", emoji: "🥃" },
  { ml: 60, label: "Large", subtitle: "Double shot", emoji: "🥃" },
];

export default function RedeemPeg() {
  const { bottleId } = useParams();
  const navigate = useNavigate();
  const [bottle, setBottle] = useState<UserBottle | null>(null);
  const [selectedPeg, setSelectedPeg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadBottle(); }, [bottleId]);

  const loadBottle = async () => {
    try {
      setLoading(true);
      const bottles = await purchaseService.getUserBottles();
      const found = bottles.find(b => b.id === bottleId);
      if (found) {
        setBottle(found);
      } else {
        const errorMsg = "Bottle not found";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Failed to load bottle";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedPeg || !bottleId) return;
    try {
      setCreating(true);
      const redemption = await redemptionService.createRedemption(bottleId, selectedPeg);
      toast.success("QR code generated! Show it to the bartender 🎉");
      navigate(`/redeem-qr/${bottleId}`, { state: { redemption, bottle } });
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Failed to create redemption. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#09090F] flex items-center justify-center">
      <div className="w-12 h-12 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!bottle || error) return (
    <div className="min-h-screen bg-[#09090F] text-white flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-red-400 mb-4 text-sm">{error || "Bottle not found"}</p>
        <Link to="/my-bottles" className="btn-primary px-6 py-3 rounded-2xl text-sm font-bold text-white inline-block">
          Back to My Bottles
        </Link>
      </div>
    </div>
  );

  if (bottle.remainingMl === 0) return (
    <div className="min-h-screen bg-[#09090F] text-white flex items-center justify-center px-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-[#111118] border border-white/[0.07] flex items-center justify-center mx-auto mb-5">
          <Wine className="w-10 h-10 text-[#2A2A3A]" />
        </div>
        <h2 className="text-xl font-bold mb-2">Bottle Complete!</h2>
        <p className="text-[#7171A0] text-sm mb-8">You've fully redeemed this bottle. 🎉</p>
        <Link to="/my-bottles" className="btn-primary px-8 py-3.5 rounded-2xl font-bold text-sm text-white inline-block">
          Back to My Bottles
        </Link>
      </div>
    </div>
  );

  const pct = (bottle.remainingMl / bottle.totalMl) * 100;
  const afterRedeem = selectedPeg ? bottle.remainingMl - selectedPeg : null;

  return (
    <div className="min-h-screen bg-[#09090F] text-white flex flex-col">
      {/* Ambient */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-violet-900/15 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 px-5 pt-12 pb-4 flex items-center gap-3">
        <Link to="/my-bottles" className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#7171A0]" />
        </Link>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Choose Peg Size</h1>
          <p className="text-[#7171A0] text-xs">Select how much you'd like to pour</p>
        </div>
      </div>

      {/* Bottle Card */}
      <div className="relative z-10 px-5 mb-6">
        <div className="card-surface p-4">
          <div className="flex gap-3 mb-4">
            <div className="w-14 h-14 bg-[#1A1A26] rounded-2xl flex items-center justify-center p-2 flex-shrink-0 border border-white/[0.06]">
              <ImageWithFallback
                src={bottle.image || "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"}
                alt={bottle.bottleName}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-violet-400 font-semibold uppercase tracking-wider mb-0.5">{bottle.bottleBrand}</p>
              <h3 className="font-bold text-base leading-tight truncate">{bottle.bottleName}</h3>
              <p className="text-xs text-[#7171A0] mt-0.5">{bottle.venueName}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#7171A0] flex items-center gap-1">
                <Droplets className="w-3 h-3" /> Available
              </span>
              <span className="font-bold">
                {afterRedeem !== null ? (
                  <>
                    <span className="text-[#7171A0] line-through mr-1">{bottle.remainingMl} ml</span>
                    <span className="text-violet-400">{afterRedeem} ml left</span>
                  </>
                ) : (
                  <span className="text-white">{bottle.remainingMl} ml</span>
                )}
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill transition-all duration-500" style={{ width: `${pct}%` }} />
              {afterRedeem !== null && (
                <div
                  className="h-full rounded-full bg-white/10 absolute top-0 left-0 transition-all duration-500"
                  style={{ width: `${(afterRedeem / bottle.totalMl) * 100}%` }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Peg Size Selection */}
      <div className="relative z-10 flex-1 px-5 space-y-3">
        <p className="text-xs text-[#7171A0] font-medium uppercase tracking-wider mb-1">Select Size</p>
        {PEG_SIZES.map((peg, i) => {
          const affordable = bottle.remainingMl >= peg.ml;
          const isSelected = selectedPeg === peg.ml;
          return (
            <motion.button
              key={peg.ml}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => affordable && setSelectedPeg(peg.ml)}
              disabled={!affordable}
              className={`w-full rounded-2xl border-2 p-4 text-left transition-all duration-250 ${isSelected
                ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/15"
                : affordable
                  ? "border-white/[0.07] bg-[#111118] hover:border-white/20 active:scale-98"
                  : "border-white/[0.04] bg-[#0D0D15] opacity-40 cursor-not-allowed"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Visual glass level */}
                  <div className="w-10 h-10 rounded-xl bg-[#1A1A26] flex items-center justify-center text-xl">
                    {peg.emoji}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-base">{peg.label}</span>
                      <span className="text-2xl font-black text-violet-400">{peg.ml}<span className="text-sm font-medium text-[#7171A0]"> ml</span></span>
                    </div>
                    <p className="text-xs text-[#7171A0]">{peg.subtitle}</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-violet-500 bg-violet-500" : "border-white/20"
                  }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 mt-3">
          <p className="text-red-400 text-xs text-center">{error}</p>
        </div>
      )}

      {/* Generate QR Button */}
      <div className="relative z-10 px-5 pb-10 pt-6">
        <button
          onClick={handleGenerate}
          disabled={!selectedPeg || creating}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 ${selectedPeg && !creating
            ? "btn-primary text-white"
            : "bg-[#1A1A26] text-[#4A4A6A] cursor-not-allowed"
            }`}
        >
          {creating
            ? "Generating QR..."
            : selectedPeg
              ? `Generate QR · ${selectedPeg} ml`
              : "Select a peg size"}
        </button>
      </div>
    </div>
  );
}
