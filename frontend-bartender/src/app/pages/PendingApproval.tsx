import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Clock, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

export default function PendingApproval() {
  const navigate = useNavigate();
  const [bartenderInfo, setBartenderInfo] = useState<any>(null);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    // Get pending bartender info
    const pending = localStorage.getItem("bartender_pending");
    if (pending) {
      setBartenderInfo(JSON.parse(pending));
    }

    // Animate dots
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 500);

    // Simulate admin approval after 3 seconds (for demo purposes)
    const approvalTimeout = setTimeout(() => {
      localStorage.removeItem("bartender_pending");
      localStorage.setItem("bartender", JSON.stringify({
        email: bartenderInfo?.email,
        venueName: bartenderInfo?.venueName,
        name: "Alex Martinez",
        approved: true
      }));
      navigate("/home");
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(approvalTimeout);
    };
  }, [navigate, bartenderInfo?.email, bartenderInfo?.venueName]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm text-center"
      >
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 mb-6 border border-amber-500/30">
          <Clock className="w-12 h-12 text-amber-400 animate-pulse" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-3">
          Waiting for Approval{dots}
        </h1>

        {/* Info */}
        <div className="glass-card p-6 rounded-3xl border border-purple-500/20 bg-[rgba(17,17,27,0.7)] backdrop-blur-xl mb-6">
          <div className="space-y-3 text-left">
            <div>
              <p className="text-xs text-gray-400">Venue</p>
              <p className="text-white">{bartenderInfo?.venueName || "Loading..."}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-white">{bartenderInfo?.email || "Loading..."}</p>
            </div>
          </div>
        </div>

        {/* Message */}
        <p className="text-gray-400 text-sm">
          Your request has been sent to the admin.
          <br />
          You'll be notified once approved.
        </p>

        {/* Simulated approval animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 0.3 }}
          className="mt-8 flex items-center justify-center gap-2 text-green-400"
        >
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm">Approved! Redirecting...</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
