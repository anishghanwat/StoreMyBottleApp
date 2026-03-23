import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, Wine, Droplets } from "lucide-react";
import { purchaseService } from "../../services/purchase.service";
import { redemptionService } from "../../services/redemption.service";
import { UserBottle } from "../../types/api.types";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { motion } from "motion/react";
import { toast } from "sonner";
import { parseApiError } from "../../utils/parseApiError";

const PEG_SIZES = [
  { ml: 30, label: "Small", subtitle: "Classic peg" },
  { ml: 45, label: "Regular", subtitle: "Standard pour" },
  { ml: 60, label: "Large", subtitle: "Double shot" },
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
      const errorMsg = parseApiError(err, "Failed to load bottle");
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
      // Persist so we can recover if the user navigates away and comes back
      localStorage.setItem("activeRedemptionId", redemption.id);
      localStorage.setItem("activeRedemptionBottleId", bottleId);
      navigate(`/redeem-qr/${bottleId}`, { state: { redemption, bottle } });
    } catch (err: any) {
      const errorMsg = parseApiError(err, "Failed to create redemption. Please try again.");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col h-screen bg-[#09090F] text-white overflow-hidden">
      {/* Hero skeleton */}
      <div className="h-52 bg-white/[0.03] animate-pulse" />
      <div className="px-5 pt-4 space-y-3">
        <div className="h-4 w-20 bg-white/[0.06] rounded-full animate-pulse" />
        <div className="h-6 w-48 bg-white/[0.06] rounded-full animate-pulse" />
        <div className="h-3 w-32 bg-white/[0.04] rounded-full animate-pulse" />
      </div>
      {/* Progress card skeleton */}
      <div className="mx-5 mt-4 h-16 bg-[#0E0E18] border border-white/[0.06] rounded-2xl animate-pulse" />
      {/* Peg options skeleton */}
      <div className="px-5 mt-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-[#0E0E18] border border-white/[0.06] rounded-2xl animate-pulse" />
        ))}
      </div>
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
    <div className="flex flex-col h-screen bg-[#09090F] text-white overflow-hidden">

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* Hero image area with back button + bottle name overlaid */}
        <div className="relative h-52 bg-black overflow-hidden">
          {/* Bottle image */}
          <div className="absolute inset-0 flex items-center justify-center p-8 opacity-80">
            <ImageWithFallback
              src={bottle.image || "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"}
              alt={bottle.bottleName}
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090F] via-[#09090F]/30 to-transparent" />

          {/* Back button */}
          <Link
            to="/my-bottles"
            className="absolute top-5 left-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>

          {/* Brand + Name */}
          <div className="absolute bottom-0 inset-x-0 px-5 pb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-fuchsia-400 mb-0.5">{bottle.bottleBrand}</p>
            <h1 className="text-xl font-extrabold text-white leading-tight">{bottle.bottleName}</h1>
            <p className="text-xs text-white/50 mt-0.5">{bottle.venueName}</p>
          </div>
        </div>

        {/* Volume remaining card */}
        <div className="px-5 mt-4 mb-5">
          <div className="card-surface p-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#7171A0] flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5" /> Remaining
              </span>
              <span className="font-bold">
                {afterRedeem !== null ? (
                  <>
                    <span className="text-[#7171A0] line-through mr-1.5">{bottle.remainingMl} ml</span>
                    <span className="text-violet-400">
                      {afterRedeem} ml left ({Math.round((afterRedeem / bottle.totalMl) * 100)}%)
                    </span>
                  </>
                ) : (
                  <span className="text-white">{bottle.remainingMl} ml</span>
                )}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden relative">
              {/* Base: gradient when idle, white when a peg is selected (deducted portion shows as white) */}
              <div
                className={`h-full rounded-full transition-all duration-500 ${afterRedeem !== null ? "bg-white" : "bg-gradient-to-r from-violet-600 to-fuchsia-500"}`}
                style={{ width: `${pct}%` }}
              />
              {/* Gradient overlay = what remains after pour */}
              {afterRedeem !== null && (
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 absolute top-0 left-0 transition-all duration-500"
                  style={{ width: `${(afterRedeem / bottle.totalMl) * 100}%` }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Peg size selection */}
        <div className="px-5 space-y-3 pb-4">
          <p className="text-[11px] text-[#7171A0] font-semibold uppercase tracking-widest mb-2">Select Size</p>
          {PEG_SIZES.map((peg, i) => {
            const affordable = bottle.remainingMl >= peg.ml;
            const isSelected = selectedPeg === peg.ml;
            return (
              <motion.button
                key={peg.ml}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => affordable && setSelectedPeg(peg.ml)}
                disabled={!affordable}
                className={`w-full rounded-2xl border-2 p-4 text-left transition-all duration-200 ${isSelected
                  ? "border-fuchsia-500 bg-fuchsia-500/10 shadow-lg shadow-fuchsia-500/15"
                  : affordable
                    ? "border-white/[0.08] bg-[#111118] hover:border-white/20"
                    : "border-white/[0.04] bg-[#0D0D15] opacity-40 cursor-not-allowed"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSelected ? "bg-fuchsia-500/20" : "bg-[#1A1A26]"}`}>
                      <Wine className={`w-6 h-6 ${isSelected ? "text-fuchsia-400" : "text-violet-400"}`} />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-base text-white">{peg.label}</span>
                        <span className={`text-xl font-black ${isSelected ? "text-fuchsia-400" : "text-violet-400"}`}>
                          {peg.ml}<span className="text-sm font-medium text-[#7171A0]"> ml</span>
                        </span>
                      </div>
                      <p className="text-xs text-[#7171A0]">{peg.subtitle}</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-fuchsia-500 bg-fuchsia-500" : "border-white/20"
                    }`}>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {error && (
          <p className="px-5 text-red-400 text-xs text-center mt-2">{error}</p>
        )}
      </div>{/* end scroll */}

      {/* Generate QR — pinned to bottom */}
      <div className="px-5 pb-8 pt-3 bg-gradient-to-t from-[#09090F] via-[#09090F]/90 to-transparent flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleGenerate}
          disabled={!selectedPeg || creating}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 ${selectedPeg && !creating
            ? "bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-lg shadow-fuchsia-500/30"
            : "bg-[#1A1A26] text-[#4A4A6A] cursor-not-allowed"
            }`}
        >
          {creating
            ? "Generating QR..."
            : selectedPeg
              ? `Generate QR · ${selectedPeg} ml`
              : "Select a peg size"}
        </motion.button>
      </div>
    </div>
  );
}
