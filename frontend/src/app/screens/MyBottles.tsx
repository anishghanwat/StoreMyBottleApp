import { Link, useNavigate } from "react-router";
import { Wine, Clock, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { purchaseService } from "../../services/purchase.service";
import { authService } from "../../services/auth.service";
import { UserBottle } from "../../types/api.types";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { motion } from "motion/react";
import { toast } from "sonner";
import { BottomNav } from "../components/ui/BottomNav";

export default function MyBottles() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [bottles, setBottles] = useState<UserBottle[]>([]);
  const [history, setHistory] = useState<UserBottle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate("/login"); return; }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cur, hist] = await Promise.all([
        purchaseService.getUserBottles(),
        purchaseService.getPurchaseHistory()
      ]);
      setBottles(cur);
      setHistory(hist);
      setError(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Failed to load your bottles.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#09090F] flex flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 border-[3px] border-violet-600 border-t-transparent rounded-full animate-spin shadow-lg shadow-violet-500/20" />
      <p className="text-[#7171A0] text-sm animate-pulse">Loading your collection...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#09090F] text-white flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-red-400 mb-4 text-sm">{error}</p>
        <button onClick={loadData} className="btn-primary px-6 py-3 rounded-2xl text-sm font-bold text-white">Retry</button>
      </div>
    </div>
  );

  const displayed = activeTab === 'current' ? bottles : history;

  return (
    <div className="min-h-screen bg-[#09090F] text-white pb-24">
      {/* Header */}
      <div className="relative px-5 pt-12 pb-5">
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-violet-900/15 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <p className="text-xs text-[#7171A0] font-medium uppercase tracking-wider mb-1">My Collection</p>
          <h1 className="text-2xl font-bold tracking-tight">Stored Bottles</h1>
          {bottles.length > 0 && (
            <p className="text-[#7171A0] text-sm mt-1">
              {bottles.length} active · redeem anytime
            </p>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="px-5 mb-5">
        <div className="flex bg-[#111118] border border-white/[0.07] rounded-2xl p-1">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === 'current'
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
              : "text-[#7171A0] hover:text-white"
              }`}
          >
            Active {bottles.length > 0 && <span className="ml-1 text-xs opacity-70">({bottles.length})</span>}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === 'history'
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
              : "text-[#7171A0] hover:text-white"
              }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Bottle Cards */}
      {displayed.length > 0 ? (
        <div className="px-4 space-y-4">
          {displayed.map((bottle, i) => {
            const pct = (bottle.remainingMl / bottle.totalMl) * 100;
            const isEmpty = bottle.remainingMl === 0;
            const expiresAt = new Date(bottle.expiresAt);
            const isExpired = Date.now() > expiresAt.getTime();
            const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000));

            return (
              <motion.div
                key={bottle.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`card-surface overflow-hidden ${(isEmpty || isExpired) ? "opacity-60" : ""}`}
              >
                <div className="p-4">
                  {/* Top row */}
                  <div className="flex gap-3 mb-4">
                    <div className="w-16 h-16 bg-[#1A1A26] rounded-2xl flex items-center justify-center p-2 flex-shrink-0 border border-white/[0.06]">
                      <ImageWithFallback
                        src={bottle.image || "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"}
                        alt={bottle.bottleName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-violet-400 font-semibold uppercase tracking-wider mb-0.5">{bottle.bottleBrand}</p>
                      <h3 className="font-bold text-base leading-tight truncate mb-1">{bottle.bottleName}</h3>
                      <div className="flex items-center gap-1">
                        <Wine className="w-3 h-3 text-[#4A4A6A]" />
                        <span className="text-xs text-[#7171A0] truncate">{bottle.venueName}</span>
                      </div>
                    </div>
                    {/* Status badge */}
                    {isExpired ? (
                      <span className="chip chip-inactive text-[10px] h-fit">Expired</span>
                    ) : isEmpty ? (
                      <span className="chip chip-inactive text-[10px] h-fit">Empty</span>
                    ) : (
                      <span className="chip chip-green text-[10px] h-fit">Active</span>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#7171A0]">Remaining</span>
                      <span className="font-bold">
                        <span className={pct > 30 ? "text-white" : "text-amber-400"}>{bottle.remainingMl} ml</span>
                        <span className="text-[#4A4A6A] font-normal"> / {bottle.totalMl} ml</span>
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${isEmpty || isExpired ? "opacity-30" : ""}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {!isEmpty && !isExpired && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#4A4A6A]" />
                        <span className="text-[11px] text-[#7171A0]">
                          {daysLeft === 0 ? "Expires today!" : `Expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  {!isEmpty && !isExpired && activeTab === 'current' && (
                    <Link
                      to={`/redeem/${bottle.id}`}
                      className="btn-primary block w-full py-3.5 rounded-xl font-bold text-sm text-white text-center"
                    >
                      Redeem a Peg →
                    </Link>
                  )}
                  {isExpired && !isEmpty && (
                    <div className="flex items-center justify-center gap-2 text-red-400/70 text-xs py-2">
                      <Clock className="w-3.5 h-3.5" />
                      Expired on {expiresAt.toLocaleDateString()}
                    </div>
                  )}
                  {isEmpty && (
                    <div className="flex items-center justify-center gap-2 text-[#4A4A6A] text-xs py-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Fully redeemed
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-[#111118] border border-white/[0.07] flex items-center justify-center mb-5">
            <Wine className="w-10 h-10 text-[#2A2A3A]" />
          </div>
          <h3 className="text-lg font-bold mb-2">
            {activeTab === 'current' ? 'No active bottles' : 'No purchase history'}
          </h3>
          <p className="text-[#7171A0] text-sm mb-8 max-w-xs">
            {activeTab === 'current'
              ? 'Buy your first bottle at a venue and store it here'
              : 'Your purchase history will appear here'}
          </p>
          {activeTab === 'current' && (
            <Link to="/" className="btn-primary px-8 py-3.5 rounded-2xl font-bold text-sm text-white">
              Browse Venues
            </Link>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav active="bottles" />
    </div>
  );
}