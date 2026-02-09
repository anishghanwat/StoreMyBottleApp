import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ScanLine, LogOut, Wine, Check, X, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { purchaseService } from "../../services/api";

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

export default function BartenderHome() {
  const navigate = useNavigate();
  const bartender = JSON.parse(localStorage.getItem("bartender") || "{}");
  const [requests, setRequests] = useState<BottleRequest[]>([]);

  useEffect(() => {
    if (bartender.venue_id) {
      fetchRequests();
      // Poll every 30 seconds
      const interval = setInterval(fetchRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [bartender.venue_id]);

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
        {/* Scan QR Button */}
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/scan")}
            className="py-6 rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 text-white flex flex-col items-center justify-center gap-2 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all"
          >
            <ScanLine className="w-8 h-8" />
            <span className="text-sm font-semibold">Scan QR</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/stats")}
            className="py-6 rounded-3xl bg-[rgba(17,17,27,0.7)] border border-purple-500/30 text-white flex flex-col items-center justify-center gap-2 hover:bg-[rgba(17,17,27,0.9)] transition-all"
          >
            <Wine className="w-8 h-8 text-purple-400" />
            <span className="text-sm font-semibold">Dashboard Stats</span>
          </motion.button>
        </div>

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
                transition={{ duration: 0.3 }}
                className={`glass-card p-5 rounded-3xl border backdrop-blur-xl ${request.status === "pending"
                  ? "border-purple-500/30 bg-[rgba(17,17,27,0.7)]"
                  : request.status === "confirmed"
                    ? "border-green-500/30 bg-[rgba(0,50,0,0.3)]"
                    : "border-red-500/30 bg-[rgba(50,0,0,0.3)]"
                  }`}
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-3">
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
                <div className="mb-3">
                  <p className="text-white font-semibold">{request.customerName}</p>
                  <p className="text-gray-400 text-sm">{request.bottleName}</p>
                  <p className="text-gray-500 text-xs">{request.bottleType}</p>
                </div>

                {/* Payment Info */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-purple-500/10">
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
                  <div className="flex gap-3">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
