import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ScanLine, LogOut, Wine, Check, X, Clock, TrendingUp, Users, Package, History, Tag, Sparkles, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { purchaseService, venueService, redemptionService, promotionService, authService } from "../../services/api";
import { useLocationAndGreeting } from "../../utils/useLocationAndGreeting";
import { toast } from "sonner";

interface BottleRequest {
  id: string;
  customerName: string;
  bottleName: string;
  bottleType: string;
  amount: number;
  paymentMethod: string;
  timestamp: string;
  status: "pending" | "confirmed" | "rejected";
}

interface Promotion {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  valid_until: string;
}

export default function BartenderHome() {
  const navigate = useNavigate();
  const bartender = JSON.parse(localStorage.getItem("bartender") || "{}");
  const [requests, setRequests] = useState<BottleRequest[]>([]);
  const [stats, setStats] = useState({ served_today: 0, active_bottles: 0 });
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  // Use location and greeting hook
  const { greeting } = useLocationAndGreeting();

  useEffect(() => {
    if (bartender.venue_id) {
      fetchAllData();
      const interval = setInterval(fetchAllData, 30000);
      return () => clearInterval(interval);
    }
  }, [bartender.venue_id]);

  const fetchAllData = async () => {
    await Promise.all([fetchRequests(), fetchStats(), fetchPromotions()]);
  };

  const fetchStats = async () => {
    try { const data = await venueService.getStats(bartender.venue_id); setStats(data); } catch { }
  };

  const fetchPromotions = async () => {
    try {
      const data = await promotionService.getActivePromotions(bartender.venue_id);
      setPromotions(data.promotions || []);
    } catch (e: any) { if (e.response?.status !== 403) console.error(e); setPromotions([]); }
  };

  const fetchRequests = async () => {
    try {
      const data = await purchaseService.getPending(bartender.venue_id);
      setRequests(data.map((item: any) => ({
        id: item.id,
        customerName: item.customer_name,
        bottleName: item.bottle_name,
        bottleType: `${item.volume_ml}ml`,
        amount: item.amount,
        paymentMethod: item.payment_method || "Pending",
        timestamp: new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: item.status,
      })));
    } catch { }
  };

  const handleConfirm = async (id: string) => {
    setRequests(c => c.map(r => r.id === id ? { ...r, status: "confirmed" } : r));
    if (navigator.vibrate) navigator.vibrate(50);
    try {
      await purchaseService.process(id, "confirm");
      setTimeout(fetchRequests, 2000);
    } catch { fetchRequests(); }
  };

  const handleReject = async (id: string) => {
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    try { await purchaseService.process(id, "reject"); fetchRequests(); } catch { fetchRequests(); }
  };

  const handleLogout = async () => {
    toast.success("Logged out successfully");
    await authService.logout();
    navigate("/");
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#06060D] text-white pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#06060D]/90 backdrop-blur-xl border-b border-white/[0.05] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6B6B9A]">{greeting.greeting} {greeting.emoji}</p>
            <h1 className="text-lg font-black tracking-tight">
              {bartender.venue_name || bartender.venueName || "The Neon Lounge"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="shift-badge-on">On Duty</div>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[#6B6B9A] hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Served Today", value: stats.served_today, icon: Wine, color: "violet", accent: "text-violet-400", extra: "↑ Active" },
            { label: "Active Bottles", value: stats.active_bottles, icon: Package, color: "amber", accent: "text-amber-400", extra: "In venue" },
            { label: "Pending", value: pendingCount, icon: Clock, color: "amber", accent: "text-amber-400", extra: "Requests", pulse: pendingCount > 0 },
            { label: "History", value: "View", icon: History, color: "emerald", accent: "text-emerald-400", extra: "All time", isAction: true },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => s.isAction && navigate("/history")}
              className={`stat-card p-4 ${s.color === "violet" ? "stat-card-violet" : s.color === "emerald" ? "stat-card-emerald" : "stat-card-amber"} ${s.pulse ? "pending-pulse" : ""} ${s.isAction ? "cursor-pointer hover:border-white/10" : ""}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg bg-white/[0.05]`}>
                  <s.icon className={`w-3.5 h-3.5 ${s.accent}`} />
                </div>
                <span className="text-[11px] text-[#6B6B9A]">{s.label}</span>
              </div>
              <p className="text-2xl font-black">{s.value}</p>
              <p className={`text-[11px] mt-1 ${s.accent}`}>{s.extra}</p>
            </motion.div>
          ))}
        </div>

        {/* Scan QR — primary CTA */}
        <motion.button
          whileTap={{ scale: 0.978 }}
          onClick={() => navigate("/scan")}
          className="btn-scan w-full py-6 flex items-center justify-center gap-3 text-base font-black"
        >
          <ScanLine className="w-6 h-6" />
          Scan Customer QR
        </motion.button>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Analytics", icon: TrendingUp, color: "text-violet-400", path: "/stats" },
            { label: "History", icon: History, color: "text-emerald-400", path: "/history" },
            { label: "Inventory", icon: Package, color: "text-amber-400", path: "/inventory" },
            { label: "Customers", icon: Users, color: "text-cyan-400", path: "/customers" },
          ].map(a => (
            <motion.button
              key={a.label}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(a.path)}
              className="bar-card py-5 flex flex-col items-center gap-2 hover:border-white/10 transition-all"
            >
              <a.icon className={`w-5 h-5 ${a.color}`} />
              <span className="text-xs font-bold text-[#B0B0D0]">{a.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Active Promotions */}
        {promotions.length > 0 && (
          <div>
            <p className="text-xs font-bold text-[#6B6B9A] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Active Promos
            </p>
            <div className="space-y-2">
              {promotions.map((promo, i) => (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bar-card p-4 border border-amber-500/15 bg-gradient-to-r from-amber-500/5 to-transparent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Tag className="w-3 h-3 text-amber-400" />
                        <span className="text-sm font-black text-amber-400 font-mono">{promo.code}</span>
                      </div>
                      <p className="text-sm text-white">{promo.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-[#6B6B9A]">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {promo.discount_type === "percentage" ? `${promo.discount_value}% off` : `₹${promo.discount_value} off`}
                        </span>
                        <span>Until {new Date(promo.valid_until).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Bottle Requests */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-[#6B6B9A] uppercase tracking-wider flex items-center gap-2">
              <Wine className="w-3.5 h-3.5 text-violet-400" /> Bottle Requests
            </p>
            {pendingCount > 0 && <span className="chip-pending">{pendingCount} pending</span>}
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {requests.map(request => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  drag="x"
                  dragConstraints={{ left: -110, right: 110 }}
                  dragElastic={0.18}
                  onDragEnd={(_, info) => {
                    if (request.status === "pending") {
                      if (info.offset.x > 100) handleConfirm(request.id);
                      else if (info.offset.x < -100) handleReject(request.id);
                    }
                  }}
                  className={`request-card p-5 cursor-grab active:cursor-grabbing relative overflow-hidden ${request.status === "pending" ? "request-card-pending" :
                    request.status === "confirmed" ? "request-card-confirmed" : "request-card-rejected"
                    }`}
                >
                  {/* Swipe ghost hints */}
                  {request.status === "pending" && (
                    <div className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none">
                      <div className="flex items-center gap-1.5 text-red-400 opacity-20">
                        <X className="w-4 h-4" /><span className="text-xs">Reject</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400 opacity-20">
                        <span className="text-xs">Confirm</span><Check className="w-4 h-4" />
                      </div>
                    </div>
                  )}

                  <div className="relative z-10">
                    {/* Top row: time + status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex items-center gap-1 text-[11px] text-[#6B6B9A]">
                        <Clock className="w-3 h-3" />{request.timestamp}
                      </span>
                      {request.status !== "pending" && (
                        <span className={request.status === "confirmed" ? "chip-confirmed" : "chip-rejected"}>
                          {request.status === "confirmed" ? "Confirmed ✓" : "Rejected"}
                        </span>
                      )}
                    </div>

                    {/* Customer + bottle */}
                    <p className="font-black text-base">{request.customerName}</p>
                    <p className="text-[#B0B0D0] text-sm">{request.bottleName}</p>
                    <p className="text-[#6B6B9A] text-xs mt-0.5">{request.bottleType}</p>

                    {/* Amount + payment */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
                      <div>
                        <p className="text-[10px] text-[#4A4A6A]">Amount</p>
                        <p className="font-black text-[#F5C518]">₹{request.amount.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[#4A4A6A]">Payment</p>
                        <p className="text-sm font-semibold">{request.paymentMethod}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {request.status === "pending" && (
                      <div className="flex gap-3 mt-4">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleReject(request.id)}
                          className="btn-reject flex-1 py-3.5 flex items-center justify-center gap-2 text-sm"
                        >
                          <X className="w-4 h-4" /> Reject
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleConfirm(request.id)}
                          className="btn-confirm flex-1 py-3.5 flex items-center justify-center gap-2 text-sm"
                        >
                          <Check className="w-4 h-4" /> Confirm
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {requests.length === 0 && (
              <div className="text-center py-14">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                  <Wine className="w-6 h-6 text-[#4A4A6A]" />
                </div>
                <p className="text-[#6B6B9A] text-sm">No requests yet</p>
                <p className="text-[#4A4A6A] text-xs mt-1">New orders will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
