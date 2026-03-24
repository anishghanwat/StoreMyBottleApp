import { Link, useNavigate } from "react-router";
import { Wine, Clock, Sparkles, AlertCircle, QrCode } from "lucide-react";
import { useState, useEffect } from "react";
import type { Key } from "react";
import { purchaseService } from "../../services/purchase.service";
import { redemptionService } from "../../services/redemption.service";
import { authService } from "../../services/auth.service";
import { UserBottle, Purchase, Redemption } from "../../types/api.types";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { motion } from "motion/react";
import { toast } from "sonner";
import { BottomNav } from "../components/ui/BottomNav";

const ACTIVE_REDEMPTION_KEY = "activeRedemptionId";
const ACTIVE_BOTTLE_KEY = "activeRedemptionBottleId";

// ── Bottle card ──────────────────────────────────────────────────────────────
function BottleCard({ bottle, index, activeTab }: {
  key?: Key;
  bottle: UserBottle;
  index: number;
  activeTab: 'current' | 'history';
}) {
  const pct = (bottle.remainingMl / bottle.totalMl) * 100;
  const isEmpty = bottle.remainingMl === 0;
  const expiresAt = new Date(bottle.expiresAt);
  const isExpired = Date.now() > expiresAt.getTime();
  const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`card-surface overflow-hidden ${(isEmpty || isExpired) ? "opacity-60" : ""}`}
    >
      <div className="p-4">
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
          {isExpired ? (
            <span className="chip chip-inactive text-[10px] h-fit">Expired</span>
          ) : isEmpty ? (
            <span className="text-[10px] bg-white/10 text-[#7171A0] px-2 py-0.5 rounded-full font-semibold h-fit border border-white/10">Empty</span>
          ) : daysLeft <= 3 && activeTab === 'current' ? (
            <span className="text-[10px] bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full font-semibold h-fit border border-orange-500/20 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
            </span>
          ) : (
            <span className="chip chip-green text-[10px] h-fit">Active</span>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-[#7171A0]">Remaining</span>
            <span className="font-bold">
              <span className={pct > 30 ? "text-white" : "text-amber-400"}>{bottle.remainingMl} ml</span>
              <span className="text-[#4A4A6A] font-normal"> / {bottle.totalMl} ml</span>
            </span>
          </div>
          <div className="progress-bar">
            <div className={`progress-fill ${isEmpty || isExpired ? "opacity-30" : ""}`} style={{ width: `${pct}%` }} />
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

        {!isEmpty && !isExpired && activeTab === 'current' && (
          <Link to={`/redeem/${bottle.id}`} className="btn-primary block w-full py-3.5 rounded-xl font-bold text-sm text-white text-center">
            Redeem a Peg →
          </Link>
        )}
        {activeTab === 'history' && bottle.purchasedAt && (
          <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.05]">
            <span className="text-[#4A4A6A]">
              Purchased {new Date(bottle.purchasedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {bottle.purchasePrice != null && (
              <span className="font-semibold text-violet-400">₹{Math.round(bottle.purchasePrice).toLocaleString("en-IN")}</span>
            )}
          </div>
        )}
        {isExpired && activeTab === 'current' && (
          <div className="flex items-center justify-center gap-2 text-red-400/70 text-xs py-2">
            <Clock className="w-3.5 h-3.5" />
            Expired on {expiresAt.toLocaleDateString()} · Cannot be redeemed
          </div>
        )}
        {isEmpty && !isExpired && (
          <div className="flex items-center justify-center gap-2 text-[#7171A0] font-medium text-xs py-2 bg-white/[0.03] rounded-xl mt-2 border border-white/[0.05]">
            <Sparkles className="w-3.5 h-3.5 text-violet-400/50" />
            Bottle finished
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function MyBottles() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [bottles, setBottles] = useState<UserBottle[]>([]);
  const [history, setHistory] = useState<UserBottle[]>([]);
  const [pendingPurchases, setPendingPurchases] = useState<Purchase[]>([]);
  const [activeRedemption, setActiveRedemption] = useState<{ redemption: Redemption; bottle: UserBottle } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [expiryDismissed, setExpiryDismissed] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate("/login", { replace: true }); return; }
    loadData();
  }, [navigate]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (!interval) {
        interval = setInterval(() => setCurrentTime(Date.now()), 1000);
      }
    };
    const stop = () => {
      if (interval) { clearInterval(interval); interval = null; }
    };

    start();
    const onVisibility = () => document.hidden ? stop() : start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    if (pendingPurchases.length === 0) return;
    const allExpired = pendingPurchases.every(p => {
      const expiresAt = new Date(p.created_at).getTime() + 15 * 60 * 1000;
      return currentTime >= expiresAt;
    });
    if (allExpired) loadData();
  }, [currentTime, pendingPurchases]);

  useEffect(() => {
    if (!activeRedemption) return;
    const expiresAt = new Date(activeRedemption.redemption.qr_expires_at).getTime();
    if (currentTime >= expiresAt) {
      localStorage.removeItem(ACTIVE_REDEMPTION_KEY);
      localStorage.removeItem(ACTIVE_BOTTLE_KEY);
      loadData();
    }
  }, [currentTime, activeRedemption]);

  const loadData = async () => {
    try {
      setLoading(true);
      setExpiryDismissed(false);
      const [cur, hist, pending] = await Promise.all([
        purchaseService.getUserBottles(),
        purchaseService.getPurchaseHistory(),
        purchaseService.getPendingPurchases()
      ]);
      setBottles(cur);
      setHistory(hist);
      setPendingPurchases(pending);

      // Mark returning user so BottleDetails hides "How it works"
      if (cur.length > 0 && !localStorage.getItem('smb_purchased')) {
        localStorage.setItem('smb_purchased', '1');
      }

      const savedRedemptionId = localStorage.getItem(ACTIVE_REDEMPTION_KEY);
      const savedBottleId = localStorage.getItem(ACTIVE_BOTTLE_KEY);
      if (savedRedemptionId && savedBottleId) {
        try {
          const redemption = await redemptionService.getRedemptionStatus(savedRedemptionId);
          const matchedBottle = cur.find(b => b.id === savedBottleId);
          if (redemption && matchedBottle && redemption.status === 'pending') {
            setActiveRedemption({ redemption, bottle: matchedBottle });
          } else {
            localStorage.removeItem(ACTIVE_REDEMPTION_KEY);
            localStorage.removeItem(ACTIVE_BOTTLE_KEY);
          }
        } catch {
          localStorage.removeItem(ACTIVE_REDEMPTION_KEY);
          localStorage.removeItem(ACTIVE_BOTTLE_KEY);
        }
      }
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
    <div className="min-h-screen bg-[#09090F] text-white">
      <div className="px-5 pt-12 pb-5">
        <div className="h-3 w-24 bg-white/5 rounded-full animate-pulse mb-2" />
        <div className="h-7 w-40 bg-white/5 rounded-full animate-pulse" />
      </div>
      <div className="px-5 mb-5">
        <div className="h-12 bg-white/5 rounded-2xl animate-pulse" />
      </div>
      <div className="px-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[#0E0E18] border border-white/[0.06] rounded-2xl p-4 animate-pulse">
            <div className="flex gap-3 mb-4">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-2.5 w-16 bg-white/5 rounded-full" />
                <div className="h-4 w-32 bg-white/5 rounded-full" />
                <div className="h-2.5 w-24 bg-white/5 rounded-full" />
              </div>
            </div>
            <div className="h-2 bg-white/5 rounded-full mb-3" />
            <div className="h-11 bg-white/5 rounded-xl" />
          </div>
        ))}
      </div>
      <BottomNav active="bottles" />
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
  const activeBottles = bottles.filter(b => !b.expiresAt || Date.now() <= new Date(b.expiresAt).getTime());
  const expiredBottles = bottles.filter(b => b.expiresAt && Date.now() > new Date(b.expiresAt).getTime());

  // Bottles expiring in ≤3 days that are still active
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  const expiringSoon = activeBottles.filter(b =>
    b.expiresAt && new Date(b.expiresAt).getTime() - Date.now() <= THREE_DAYS
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#09090F] text-white">
      {/* Header */}
      <div className="relative px-5 pt-12 pb-5">
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-violet-900/15 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <p className="text-xs text-[#7171A0] font-medium uppercase tracking-wider mb-1">My Collection</p>
          <h1 className="text-2xl font-bold tracking-tight">Stored Bottles</h1>
          {activeBottles.length > 0 && (
            <p className="text-[#7171A0] text-sm mt-1">{activeBottles.length} active · redeem anytime</p>
          )}
        </div>
      </div>

      {/* Active QR Code Alert */}
      {activeRedemption && (
        <div className="px-5 mb-5">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-violet-500/10 border border-violet-500/30 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <QrCode className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-violet-400 mb-1">Active QR Code</h3>
                <p className="text-xs text-violet-300/80 mb-3">You have an active QR code ready to scan</p>
                <button
                  onClick={() => navigate(`/redeem-qr/${activeRedemption.bottle.id}`)}
                  className="w-full bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 rounded-xl p-3 text-left transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{activeRedemption.bottle.bottleBrand} {activeRedemption.bottle.bottleName}</p>
                      <p className="text-xs text-violet-300/70">{activeRedemption.redemption.peg_size_ml} ml · {activeRedemption.bottle.venueName}</p>
                    </div>
                    <span className="text-xs text-violet-400 font-semibold">View QR →</span>
                  </div>
                  {(() => {
                    const exp = new Date(activeRedemption.redemption.qr_expires_at).getTime();
                    const timeLeft = Math.max(0, Math.floor((exp - currentTime) / 1000));
                    const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
                    return (
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${timeLeft < 300 ? 'text-red-400' : 'text-violet-400'}`}>
                        <Clock className="w-3 h-3" />
                        {timeLeft > 0 ? <span>Expires in {m}:{s.toString().padStart(2, '0')}</span> : <span>Expired</span>}
                      </div>
                    );
                  })()}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Pending Payments Alert */}
      {pendingPurchases.length > 0 && (
        <div className="px-5 mb-5">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-400 mb-1">
                  {pendingPurchases.length} Pending Payment{pendingPurchases.length > 1 ? 's' : ''}
                </h3>
                <p className="text-xs text-amber-300/80 mb-3">Complete payment within 15 minutes or it will expire</p>
                <div className="space-y-2">
                  {pendingPurchases.map((purchase) => {
                    const exp = new Date(purchase.created_at).getTime() + 15 * 60 * 1000;
                    const timeLeft = Math.max(0, Math.floor((exp - currentTime) / 1000));
                    const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
                    const isExpiringSoon = timeLeft < 300;
                    const isExpired = timeLeft === 0;
                    return (
                      <button
                        key={purchase.id}
                        onClick={() => { if (!isExpired) navigate('/payment', { state: { purchaseId: purchase.id, resuming: true } }); }}
                        disabled={isExpired}
                        className={`w-full hover:bg-amber-500/30 border rounded-xl p-3 text-left transition-colors ${isExpired ? 'bg-red-500/10 border-red-500/30 opacity-60 cursor-not-allowed' : isExpiringSoon ? 'bg-red-500/20 border-red-500/40' : 'bg-amber-500/20 border-amber-500/40'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">₹{Math.round(purchase.purchase_price).toLocaleString('en-IN')}</p>
                            <p className="text-xs text-amber-300/70">{new Date(purchase.created_at).toLocaleString()}</p>
                          </div>
                          {!isExpired && <span className="text-xs text-amber-400 font-semibold">Resume →</span>}
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${isExpired ? 'text-red-400/70' : isExpiringSoon ? 'text-red-400' : 'text-amber-400'}`}>
                          <Clock className="w-3 h-3" />
                          {isExpired ? <span>Expired</span> : <span>Expires in {m}:{s.toString().padStart(2, '0')}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Expiry Warning Banner */}
      {!expiryDismissed && expiringSoon.length > 0 && (
        <div className="px-5 mb-4">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-orange-400">
                {expiringSoon.length === 1
                  ? `⚠️ "${expiringSoon[0].bottleName}" expires soon — redeem it!`
                  : `⚠️ ${expiringSoon.length} bottles expiring soon — redeem them!`}
              </p>
              <p className="text-xs text-orange-300/70 mt-0.5">
                {expiringSoon.map(b => {
                  const daysLeft = Math.ceil((new Date(b.expiresAt).getTime() - Date.now()) / 86400000);
                  return `${b.bottleName}: ${daysLeft}d left`;
                }).join(' · ')}
              </p>
            </div>
            <button onClick={() => setExpiryDismissed(true)} className="text-orange-400/60 hover:text-orange-400 text-lg leading-none flex-shrink-0 mt-0.5">×</button>
          </motion.div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="px-5 mb-5">
        <div className="flex bg-[#111118] border border-white/[0.07] rounded-2xl p-1">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === 'current' ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25" : "text-[#7171A0] hover:text-white"}`}
          >
            Active {activeBottles.length > 0 && <span className="ml-1 text-xs opacity-70">({activeBottles.length})</span>}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === 'history' ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25" : "text-[#7171A0] hover:text-white"}`}
          >
            History
          </button>
        </div>
      </div>

      {/* Bottle Cards */}
      {displayed.length > 0 ? (
        <div className="px-4 space-y-4 pb-24">
          {activeTab === 'current' ? (
            <>
              {/* All expired — show prominent empty state */}
              {activeBottles.length === 0 && expiredBottles.length > 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-red-400/60" />
                  </div>
                  <h3 className="text-base font-bold mb-1">All bottles expired</h3>
                  <p className="text-[#7171A0] text-sm mb-6 max-w-xs">These bottles can no longer be redeemed. Buy a new one to start fresh.</p>
                  <Link to="/" className="btn-primary px-8 py-3.5 rounded-2xl font-bold text-sm text-white">Browse Venues</Link>
                </div>
              )}

              {/* Active bottles */}
              {activeBottles.map((bottle, i) => (
                <BottleCard key={bottle.id} bottle={bottle} index={i} activeTab={activeTab} />
              ))}

              {/* Expired section divider + cards */}
              {expiredBottles.length > 0 && (
                <>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-[11px] text-red-400/60 font-semibold uppercase tracking-widest">Expired ({expiredBottles.length})</span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>
                  <p className="text-xs text-[#4A4A6A] text-center -mt-2">These bottles can no longer be redeemed</p>
                  {expiredBottles.map((bottle, i) => (
                    <BottleCard key={bottle.id} bottle={bottle} index={i} activeTab={activeTab} />
                  ))}
                </>
              )}
            </>
          ) : (
            displayed.map((bottle, i) => (
              <BottleCard key={bottle.id} bottle={bottle} index={i} activeTab={activeTab} />
            ))
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1A1A26] to-[#0E0E18] border border-white/[0.08] shadow-xl flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 rounded-full bg-violet-500/10 blur-xl"></div>
            <Wine className="w-10 h-10 text-violet-400 relative z-10" strokeWidth={1.5} />
            <Sparkles className="w-5 h-5 text-fuchsia-400 absolute top-4 right-4 z-10" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-white">
            {activeTab === 'current' ? "Your collection is empty" : "No purchase history"}
          </h3>
          <p className="text-[#7171A0] text-sm mb-8 max-w-[260px] leading-relaxed">
            {activeTab === 'current'
              ? "Buy your first bottle at any of our partner venues and store it securely here."
              : "Your past purchases and finished bottles will appear here."}
          </p>
          {activeTab === 'current' && (
            <Link to="/" className="btn-primary w-full max-w-[200px] py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2">
              Explore Venues
            </Link>
          )}
        </div>
      )}

      <BottomNav active="bottles" />
    </div>
  );
}
