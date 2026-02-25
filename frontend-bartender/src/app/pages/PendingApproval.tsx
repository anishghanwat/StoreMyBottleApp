import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Clock } from "lucide-react";
import { motion } from "motion/react";

export default function PendingApproval() {
  const navigate = useNavigate();
  const [bartenderInfo, setBartenderInfo] = useState<any>(null);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const pending = localStorage.getItem("bartender_pending");
    if (pending) setBartenderInfo(JSON.parse(pending));

    const dotsInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? "." : prev + "."));
    }, 500);

    // Demo: auto-approve after 3 s
    const approvalTimeout = setTimeout(() => {
      localStorage.removeItem("bartender_pending");
      localStorage.setItem("bartender", JSON.stringify({
        email: bartenderInfo?.email,
        venueName: bartenderInfo?.venueName,
        name: "Bartender",
        approved: true,
      }));
      navigate("/home");
    }, 3000);

    return () => { clearInterval(dotsInterval); clearTimeout(approvalTimeout); };
  }, [navigate, bartenderInfo?.email, bartenderInfo?.venueName]);

  return (
    <div className="min-h-screen bg-[#06060D] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Amber ambient */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-80 h-80 rounded-full bg-amber-500/8 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-sm text-center relative"
      >
        {/* Pulsing clock icon */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="absolute w-28 h-28 rounded-full bg-amber-500/10 animate-ping" style={{ animationDuration: "2s" }} />
          <div className="w-24 h-24 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Clock className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        <h1 className="text-2xl font-black tracking-tight mb-2">
          Waiting for Approval{dots}
        </h1>
        <p className="text-[#6B6B9A] text-sm mb-8">
          Your request has been sent to the manager.
          <br />You'll be redirected once approved.
        </p>

        {/* Info card */}
        <div className="bar-card p-5 text-left space-y-4 mb-8">
          <div>
            <p className="text-[10px] text-[#4A4A6A] uppercase tracking-wider font-semibold mb-1">Venue</p>
            <p className="text-sm font-semibold">{bartenderInfo?.venueName || "—"}</p>
          </div>
          <div className="border-t border-white/[0.06]" />
          <div>
            <p className="text-[10px] text-[#4A4A6A] uppercase tracking-wider font-semibold mb-1">Email</p>
            <p className="text-sm font-semibold">{bartenderInfo?.email || "—"}</p>
          </div>
        </div>

        {/* Animated approval */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5 }}
          className="chip-confirmed inline-flex items-center gap-2 text-sm px-4 py-2"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Approved — redirecting…
        </motion.div>

        <button
          onClick={() => { localStorage.removeItem("bartender_pending"); navigate("/"); }}
          className="block w-full mt-6 text-[#4A4A6A] text-xs hover:text-white transition-colors"
        >
          Back to Login
        </button>
      </motion.div>
    </div>
  );
}
