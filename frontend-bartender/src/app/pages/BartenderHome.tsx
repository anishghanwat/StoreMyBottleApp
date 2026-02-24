import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ScanLine, LogOut, Wine, Check, X, Clock, TrendingUp, Users, Package, DollarSign, Activity, History, Tag, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { purchaseService, venueService, redemptionService, promotionService } from "../../services/api";

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
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (bartender.venue_id) {
      fetchAllData();
      // Poll every 30 seconds
      const interval = setInterval(fetchAllData, 30000);
      return () => clearInterval(interval);
    }
  }, [bartender.venue_id]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchRequests(),
      fetchStats(),
      fetchRecentActivity(),
      fetchPromotions()
    ]);
  };

  const fetchStats = async () => {
    try {
      const data = await venueService.getStats(bartender.venue_id);
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const fetchPromotions = async () => {
    try {
      const data = await promotionService.getActivePromotions(bartender.venue_id);
      setPromotions(data.promotions || []);
    } catch (error: any) {
      // Silently fail if bartender doesn't have access to promotions (403)
      // This is expected as promotions are admin-only
      if (error.response?.status !== 403) {
        console.error("Failed to fetch promotions", error);
      }
      setPromotions([]);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const data = await redemptionService.getHistory(bartender.venue_id, 5);
      setRecentActivity(data.redemptions || []);
    } catch (error) {
      console.error("Failed to fetch recent activity", error);
    }
  };

  const fetchRequests = async () => {
    try {
      const data = await purchaseService.getPending(bartender.venue_id);
      const mapped = data.map((item: any) => ({
        id: item.id,
        customerName: item.customer_name,
        bottleName: item.bottle_name,
        bottleType: `${item.volume_ml}ml`, // or bottle_brand
        amount: item.amount,
        paymentMethod: item.payment_method || "Pending",
        timestamp: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: item.status
      }));
      setRequests(mapped);
    } catch (error) {
      console.error("Failed to fetch requests", error);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      // Optimistic update: Mark locally as confirmed
      setRequests(current => current.map(r =>
        r.id === id ? { ...r, status: "confirmed" } : r
      ));

      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      await purchaseService.process(id, "confirm");

      // Delay fetch to let user see the checkmark
      setTimeout(() => {
        fetchRequests();
      }, 2000);

    } catch (error) {
      console.error("Failed to confirm", error);
      alert("Failed to confirm request");
      fetchRequests(); // Revert on failure
    }
  };

  const handleReject = async (id: string) => {
    try {
      await purchaseService.process(id, "reject");
      fetchRequests();

      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
    } catch (error) {
      console.error("Failed to reject", error);
      alert("Failed to reject request");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("bartender");
    navigate("/");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f] pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-[#0a0a0f] to-transparent backdrop-blur-lg border-b border-purple-500/10">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {bartender.venue_name || bartender.venueName || "The Neon Lounge"}
            </h1>
            <p className="text-sm text-gray-400">{bartender.name || "Bartender"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-3 rounded-2xl bg-[rgba(17,17,27,0.5)] border border-purple-500/30 text-gray-300 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-6 mt-6 space-y-6">
        {/* Performance Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 rounded-2xl border border-purple-500/20 bg-[rgba(17,17,27,0.5)]"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Wine className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-xs text-gray-400">Served Today</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.served_today}</p>
            <p className="text-xs text-green-400 mt-1">↑ Active</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 rounded-2xl border border-pink-500/20 bg-[rgba(17,17,27,0.5)]"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-pink-500/20">
                <Package className="w-4 h-4 text-pink-400" />
              </div>
              <span className="text-xs text-gray-400">Active Bottles</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.active_bottles}</p>
            <p className="text-xs text-blue-400 mt-1">In venue</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-4 rounded-2xl border border-amber-500/20 bg-[rgba(17,17,27,0.5)]"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xs text-gray-400">Pending</span>
            </div>
            <p className="text-2xl font-bold text-white">{pendingCount}</p>
            <p className="text-xs text-amber-400 mt-1">Requests</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-4 rounded-2xl border border-green-500/20 bg-[rgba(17,17,27,0.5)]"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Activity className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs text-gray-400">Recent</span>
            </div>
            <p className="text-2xl font-bold text-white">{recentActivity.length}</p>
            <p className="text-xs text-green-400 mt-1">Last 5</p>
          </motion.div>
        </div>

        {/* Scan QR Button */}
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/scan")}
            className="col-span-2 py-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center gap-3 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all"
          >
            <ScanLine className="w-6 h-6" />
            <span className="text-base font-semibold">Scan QR Code</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/stats")}
            className="py-5 rounded-2xl bg-[rgba(17,17,27,0.7)] border border-purple-500/30 text-white flex flex-col items-center justify-center gap-2 hover:bg-[rgba(17,17,27,0.9)] transition-all"
          >
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-semibold">Analytics</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/history")}
            className="py-5 rounded-2xl bg-[rgba(17,17,27,0.7)] border border-purple-500/30 text-white flex flex-col items-center justify-center gap-2 hover:bg-[rgba(17,17,27,0.9)] transition-all"
          >
            <History className="w-5 h-5 text-green-400" />
            <span className="text-xs font-semibold">History</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/inventory")}
            className="py-5 rounded-2xl bg-[rgba(17,17,27,0.7)] border border-purple-500/30 text-white flex flex-col items-center justify-center gap-2 hover:bg-[rgba(17,17,27,0.9)] transition-all"
          >
            <Package className="w-5 h-5 text-pink-400" />
            <span className="text-xs font-semibold">Inventory</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/customers")}
            className="col-span-2 py-4 rounded-2xl bg-[rgba(17,17,27,0.7)] border border-purple-500/30 text-white flex items-center justify-center gap-2 hover:bg-[rgba(17,17,27,0.9)] transition-all"
          >
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold">Customer Lookup</span>
          </motion.button>
        </div>

        {/* Active Promotions */}
        {promotions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Active Promotions
              </h2>
              <span className="text-xs text-gray-400">{promotions.length} active</span>
            </div>
            <div className="space-y-2">
              {promotions.map((promo, index) => (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-4 rounded-xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 to-orange-500/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Tag className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-bold text-yellow-400 font-mono">{promo.code}</span>
                      </div>
                      <p className="text-sm text-white mb-2">{promo.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {promo.discount_type === 'percentage'
                            ? `${promo.discount_value}% off`
                            : `₹${promo.discount_value} off`
                          }
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Until {new Date(promo.valid_until).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                Recent Activity
              </h2>
              <button
                onClick={handleRefresh}
                className={`text-xs text-purple-400 hover:text-purple-300 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
              >
                ↻ Refresh
              </button>
            </div>
            <div className="space-y-2">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-3 rounded-xl border border-green-500/20 bg-[rgba(0,50,0,0.1)] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{activity.user_name}</p>
                      <p className="text-xs text-gray-400">{activity.bottle_name} • {activity.peg_size_ml}ml</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(activity.redeemed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Bottle Requests Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Wine className="w-5 h-5 text-purple-400" />
            Bottle Requests
          </h2>
          {pendingCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm">
              {pendingCount} pending
            </span>
          )}
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {requests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                drag="x"
                dragConstraints={{ left: -100, right: 100 }}
                dragElastic={0.2}
                onDragEnd={(e, info) => {
                  if (request.status === "pending") {
                    if (info.offset.x > 100) {
                      handleConfirm(request.id);
                    } else if (info.offset.x < -100) {
                      handleReject(request.id);
                    }
                  }
                }}
                transition={{ duration: 0.3 }}
                className={`glass-card p-5 rounded-3xl border backdrop-blur-xl cursor-grab active:cursor-grabbing ${request.status === "pending"
                  ? "border-purple-500/30 bg-[rgba(17,17,27,0.7)]"
                  : request.status === "confirmed"
                    ? "border-green-500/30 bg-[rgba(0,50,0,0.3)]"
                    : "border-red-500/30 bg-[rgba(50,0,0,0.3)]"
                  }`}
              >
                {/* Swipe Hint for Pending */}
                {request.status === "pending" && (
                  <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
                    <div className="flex items-center gap-2 text-red-400 opacity-30">
                      <X className="w-5 h-5" />
                      <span className="text-sm">Swipe left</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-400 opacity-30">
                      <span className="text-sm">Swipe right</span>
                      <Check className="w-5 h-5" />
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {request.timestamp}
                  </span>
                  {request.status !== "pending" && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${request.status === "confirmed"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                    >
                      {request.status === "confirmed" ? "Confirmed" : "Rejected"}
                    </span>
                  )}
                </div>

                {/* Customer Info */}
                <div className="mb-3 relative z-10">
                  <p className="text-white font-semibold">{request.customerName}</p>
                  <p className="text-gray-400 text-sm">{request.bottleName}</p>
                  <p className="text-gray-500 text-xs">{request.bottleType}</p>
                </div>

                {/* Payment Info */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-purple-500/10 relative z-10">
                  <div>
                    <p className="text-xs text-gray-400">Amount</p>
                    <p className="text-white font-semibold">₹{request.amount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Payment</p>
                    <p className="text-white">{request.paymentMethod}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                {request.status === "pending" && (
                  <div className="flex gap-3 relative z-10">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReject(request.id)}
                      className="flex-1 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleConfirm(request.id)}
                      className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      Confirm
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {requests.length === 0 && (
            <div className="text-center py-12">
              <Wine className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No bottle requests yet</p>
              <p className="text-xs text-gray-600 mt-2">Requests will appear here when customers make purchases</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
