import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, Wine } from "lucide-react";
import { purchaseService } from "../../services/purchase.service";
import { redemptionService } from "../../services/redemption.service";
import { UserBottle } from "../../types/api.types";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const PEG_SIZES = [
  { ml: 30, label: "Small Peg" },
  { ml: 45, label: "Medium Peg" },
  { ml: 60, label: "Large Peg" },
];

export default function RedeemPeg() {
  const { bottleId } = useParams();
  const navigate = useNavigate();
  const [bottle, setBottle] = useState<UserBottle | null>(null);
  const [selectedPeg, setSelectedPeg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBottle();
  }, [bottleId]);

  const loadBottle = async () => {
    try {
      setLoading(true);
      const bottles = await purchaseService.getUserBottles();
      const foundBottle = bottles.find((b) => b.id === bottleId);
      if (foundBottle) {
        setBottle(foundBottle);
      } else {
        setError("Bottle not found");
      }
    } catch (err) {
      setError("Failed to load bottle");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!bottle || error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Bottle not found"}</p>
          <Link to="/my-bottles" className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors inline-block">
            Back to My Bottles
          </Link>
        </div>
      </div>
    );
  }

  if (bottle.remainingMl === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-zinc-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wine className="w-10 h-10 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Bottle Completed!</h2>
          <p className="text-gray-400 mb-8">You have fully redeemed this bottle.</p>
          <Link to="/my-bottles" className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors inline-block">
            Back to My Bottles
          </Link>
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!selectedPeg || !bottleId) return;

    try {
      setCreating(true);
      const redemption = await redemptionService.createRedemption(bottleId, selectedPeg);
      navigate(`/redeem-qr/${bottleId}`, {
        state: {
          redemption,
          bottle
        }
      });
    } catch (err) {
      setError("Failed to create redemption. Please try again.");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const canAfford = (pegSize: number) => bottle.remainingMl >= pegSize;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-4">
        <Link to="/my-bottles" className="p-2 -ml-2 hover:bg-zinc-800/50 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-semibold">Choose Peg Size</h1>
      </div>

      {/* Bottle Info */}
      <div className="px-6 py-6">
        <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 space-y-4">
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-zinc-900/50 rounded-2xl flex items-center justify-center p-2 flex-shrink-0">
              <ImageWithFallback
                src={bottle.image || "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"}
                alt={bottle.bottleName}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-purple-400 font-medium mb-1">{bottle.bottleBrand}</p>
              <h3 className="text-lg font-semibold mb-1">{bottle.bottleName}</h3>
              <p className="text-sm text-gray-400 flex items-center gap-1.5">
                <Wine className="w-4 h-4" />
                {bottle.venueName}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Available</span>
              <span className="font-semibold text-green-400">{bottle.remainingMl} ml</span>
            </div>
          </div>
        </div>
      </div>

      {/* Peg Size Selection */}
      <div className="flex-1 px-6 py-6 space-y-4">
        <p className="text-sm text-gray-400 mb-2">Select your drink size</p>
        {PEG_SIZES.map((peg) => {
          const affordable = canAfford(peg.ml);
          const isSelected = selectedPeg === peg.ml;

          return (
            <button
              key={peg.ml}
              onClick={() => affordable && setSelectedPeg(peg.ml)}
              disabled={!affordable}
              className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 ${isSelected
                ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500"
                : affordable
                  ? "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 active:scale-98"
                  : "bg-zinc-900/30 border-zinc-800/50 opacity-40 cursor-not-allowed"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-xl font-semibold mb-1">{peg.label}</h3>
                  <p className="text-2xl font-bold text-purple-400">{peg.ml} ml</p>
                </div>
                {!affordable && (
                  <span className="text-xs text-red-400 font-medium">Insufficient</span>
                )}
                {isSelected && (
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Generate QR Button */}
      <div className="px-6 pb-8">
        <button
          onClick={handleGenerate}
          disabled={!selectedPeg || creating}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-gray-500 text-white py-5 rounded-2xl font-medium text-base transition-all duration-300 active:scale-95 disabled:active:scale-100 shadow-lg shadow-purple-500/25 disabled:shadow-none"
        >
          {creating ? "Generating QR Code..." : selectedPeg ? `Generate QR for ${selectedPeg} ml` : "Select a peg size"}
        </button>
      </div>
    </div>
  );
}
