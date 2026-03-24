import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ScanLine, LogOut, Wine, Check, X, Clock,
  TrendingUp, Users, Package, History, Tag,
  Sparkles, DollarSign, ChevronRight, Tablet
} from "lucide-react";

const KIOSK_KEY = "bartender_kiosk_mode";
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

type Tab = "requests" | "more";

export default function BartenderHome() {
  const navigate = useNavigate();
  const bartender = JSON.parse(localStorage.getItem("bartender") || "{}");
  const [requests, setRequests] = useState<BottleRequest[]>([]);
  const [stats, setStats] = useState({ served_today: 0, active_bottles: 0 });
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("requests");

  const { greeting } = useLocationAndGreeting();
  const [kioskMode, setKioskMode] = useState(localStorage.getItem(KIOSK_KEY) === "true");

  const toggleKiosk = () => {
    const next = !kioskMode;
    setKioskMode(next);
    localStorage.setItem(KIOSK_KEY, String(next));
    if (next) navigate("/scan");
  };

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
    } catch (e: any) { if (e.response?.status !== 403) { /* ignore */ } setPromotions([]); }
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
    if (navigator.vibrate) navigator.vibrate(50);
    try {
      await purchaseService.process(id, "confirm");
      setRequests(c => c.map(r => r.id === id ? { ...r, status: "confirmed" } : r));
      setTimeout(fetchRequests, 2000);
    } catch {
      toast.error("Failed to confirm request");
      fetchRequests();
    }
  };

  const handleReject = async (id: string) => {
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    try {
      await purchaseService.process(id, "reject");
      setRequests(c => c.map(r => r.id === id ? { ...r, status: "rejected" } : r));
      setTimeout(fetchRequests, 1000);
    } catch {
      toast.error("Failed to reject request");
      fetchRequests();
    }
  };

  const handleLogout = async () => {
    toast.success("Logged out successfully");
    await authService.logout();
    navigate("/");
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  const QUICK_ACTIONS = [
    { label: "Analytics", icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", path: "/stats" },
    { label: "History", icon: History, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", path: "/history" },
    { label: "Inventory", icon: Package, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", path: "/inventory" },
    { label: "Customers", icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", path: "/customers" },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#06060D] text-white overflow-hidden">

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-5 pt-10 pb-3 border-b border-white/[0.05]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[#6B6B9A]">{greeting.greeting} {greeting.emoji}</p>
            <h1 className="text-lg font-black tracking-tight">
              {bartender.venue_name || bartender.venueName || "The Neon Lounge"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="shift-badge-on">On Duty</div>
            <button
              onClick={toggleKiosk}
              title="Kiosk mode — stays in scan screen"
              className={`p-2.5 rounded-xl border transition-colors ${kioskMode ? "bg-violet-500/20 border-violet-500/40 text-violet-400" : "bg-white/[0.04] border-white/[0.06] text-[#6B6B9A] hover:text-white"}`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[#6B6B9A] hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Scan QR — always visible ── */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3">
        <motion.button
          whileTap={{ scale: 0.978 }}
          onClick={() => navigate("/scan")}
          className="btn-scan w-full py-5 flex items-center justify-center gap-3 text-base font-black"
        >
          <ScanLine className="w-6 h-6" />
          Scan Customer QR
        </motion.button>
      </div>

      {/* ── Stats strip ── */}
      <div className="flex-shrink-0 px-5 pb-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Served Today", value: stats.served_today, accent: "text-violet-400" },
            { label: "Active Bottles", value: stats.active_bottles, accent: "text-amber-400" },
            { label: "Pending", value: pendingCount, accent: pendingCount > 0 ? "text-red-400" : "text-[#6B6B9A]", pulse: pendingCount > 0 },
          ].map((s) => (
            <div
              key={s.label}
              className={`bar-card p-3 text-center ${s.pulse ? "pending-pulse" : ""}`}
            >
              <p className={`text-xl font-black ${s.accent}`}>{s.value}</p>
              <p className="text-[10px] text-[#6B6B9A] mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex-shrink-0 px-5 pb-2">
        <div className="flex bg-white/[0.04] rounded-2xl p-1 border border-white/[0.05]">
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === "requests"
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
              : "text-[#6B6B9A]"
              }`}
          >
            <Wine className="w-3.5 h-3.5" />
            Requests
            {pendingCount > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === "requests" ? "bg-white/20" : "bg-red-500/20 text-red-400"}`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("more")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === "more"
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
              : "text-[#6B6B9A]"
              }`}
          >
            More
          </button>
        </div>
      </div>

      {/* ── Scrollable tab content ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <AnimatePresence mode="wait">

          {/* REQUESTS TAB */}
          {activeTab === "requests" && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
              className="space-y-3 pt-2"
            >
              {requests.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                    <Wine className="w-7 h-7 text-[#4A4A6A]" />
                  </div>
                  <p className="text-[#6B6B9A] text-sm font-medium">No bottle requests</p>
                  <p className="text-[#4A4A6A] text-xs mt-1">New orders will appear here</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {requests.map(request => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.93 }}
                      drag="x"
                      dragConstraints={{ left: -110, right: 110 }}
                      dragElastic={0.18}
                      onDragEnd={(_, info) => {
                        if (request.status === "pending") {
                          if (info.offset.x > 100) handleConfirm(request.id);
                          else if (info.offset.x < -100) handleReject(request.id);
                        }
                      }}
                      className={`request-card p-4 cursor-grab active:cursor-grabbing relative overflow-hidden ${request.status === "pending" ? "request-card-pending" :
                        request.status === "confirmed" ? "request-card-confirmed" : "request-card-rejected"
                        }`}
                    >
                      {/* Swipe hints */}
                      {request.status === "pending" && (
                        <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                          <div className="flex items-center gap-1 text-red-400 opacity-20">
                            <X className="w-4 h-4" /><span className="text-xs">Reject</span>
                          </div>
                          <div className="flex items-center gap-1 text-emerald-400 opacity-20">
                            <span className="text-xs">Confirm</span><Check className="w-4 h-4" />
                          </div>
                        </div>
                      )}

                      <div className="relative z-10">
                        {/* Top row */}
                        <div className="flex items-center justify-between mb-2">
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
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-black text-base leading-tight">{request.customerName}</p>
                            <p className="text-[#B0B0D0] text-sm">{request.bottleName}</p>
                            <p className="text-[#6B6B9A] text-xs mt-0.5">{request.bottleType}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-black text-lg text-[#F5C518]">₹{request.amount.toLocaleString()}</p>
                            <p className="text-xs text-[#6B6B9A]">{request.paymentMethod}</p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        {request.status === "pending" && (
                          <div className="flex gap-2 mt-3">
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleReject(request.id)}
                              className="btn-reject flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-bold"
                            >
                              <X className="w-4 h-4" /> Reject
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleConfirm(request.id)}
                              className="btn-confirm flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-bold"
                            >
                              <Check className="w-4 h-4" /> Confirm
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          )}

          {/* MORE TAB */}
          {activeTab === "more" && (
            <motion.div
              key="more"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18 }}
              className="pt-2 space-y-5"
            >
              {/* Quick actions */}
              <div>
                <p className="text-[11px] text-[#6B6B9A] font-bold uppercase tracking-wider mb-2">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((a, i) => (
                    <motion.button
                      key={a.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => navigate(a.path)}
                      className="bar-card p-4 flex items-center gap-3 hover:border-white/10 transition-all text-left"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${a.bg}`}>
                        <a.icon className={`w-4 h-4 ${a.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#B0B0D0]">{a.label}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#4A4A6A]" />
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Active Promotions */}
              {promotions.length > 0 && (
                <div>
                  <p className="text-[11px] text-[#6B6B9A] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Active Promos
                  </p>
                  <div className="space-y-2">
                    {promotions.map((promo, i) => (
                      <motion.div
                        key={promo.id}
                        initial={{ opacity: 0, x: -10 }}
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
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-[#6B6B9A]">
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

              {promotions.length === 0 && (
                <div className="text-center py-8 text-[#4A4A6A] text-xs">
                  <Sparkles className="w-5 h-5 mx-auto mb-2 text-[#2A2A3A]" />
                  No active promotions
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
