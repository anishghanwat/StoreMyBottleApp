import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Loader2, CreditCard, Smartphone, Banknote, ArrowLeft } from "lucide-react";
import { purchaseService } from "../../services/purchase.service";
import { authService } from "../../services/auth.service";
import { Bottle, Venue, Purchase } from "../../types/api.types";
import { motion } from "motion/react";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { icon: Smartphone, label: "UPI / QR Code", hint: "Google Pay, PhonePe, Paytm" },
  { icon: CreditCard, label: "Credit / Debit Card", hint: "Visa, Mastercard, Rupay" },
  { icon: Banknote, label: "Cash", hint: "Pay at counter" },
];

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bottle, venue } = (location.state || {}) as { bottle?: Bottle; venue?: Venue };
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [isCreatingPurchase, setIsCreatingPurchase] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate("/login"); return; }
    if (!bottle || !venue) { navigate("/"); return; }
    createPurchase();
  }, []);

  const createPurchase = async () => {
    try {
      setIsCreatingPurchase(true);
      const newPurchase = await purchaseService.createPurchase(bottle!.id, venue!.id);
      setPurchase(newPurchase);
      setIsCreatingPurchase(false);
      toast.success("Purchase initiated successfully!");
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Failed to initiate purchase. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
      setIsCreatingPurchase(false);
    }
  };

  useEffect(() => {
    if (!purchase || isConfirmed || error) return;
    const iv = window.setInterval(async () => {
      try {
        const updated = await purchaseService.getPurchase(purchase.id);
        if (updated.payment_status === "confirmed") {
          setIsConfirmed(true);
          clearInterval(iv);
          toast.success("Payment confirmed! 🎉");
          setTimeout(() => navigate("/payment-success", { state: { purchase: updated, bottle, venue } }), 500);
        } else if (updated.payment_status === "failed") {
          const errorMsg = "Payment was declined.";
          setError(errorMsg);
          toast.error(errorMsg);
          clearInterval(iv);
        }
      } catch { }
    }, 3000);
    return () => clearInterval(iv);
  }, [purchase, isConfirmed, error, navigate, bottle, venue]);

  if (isCreatingPurchase || !bottle || !venue) return (
    <div className="min-h-screen bg-[#09090F] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 border-[3px] border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#7171A0] text-sm animate-pulse">Setting up your purchase...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#09090F] text-white flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-red-400 mb-4 text-sm">{error}</p>
        <button onClick={() => navigate(-1)} className="btn-primary px-6 py-3 rounded-2xl font-bold text-sm text-white">Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090F] text-white flex flex-col pb-8">
      {/* Ambient */}
      <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-amber-900/10 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#7171A0]" />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Pay at Counter</h1>
          <p className="text-[#7171A0] text-xs">Waiting for confirmation from bar</p>
        </div>
      </div>

      {/* Status pill */}
      <div className="relative z-10 px-5 mb-6">
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-semibold ${isConfirmed
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          : "bg-amber-500/10 border-amber-500/30 text-amber-400"
          }`}>
          {!isConfirmed && <Loader2 className="w-4 h-4 animate-spin" />}
          {isConfirmed ? "✅ Payment Confirmed!" : "⏳ Waiting for payment confirmation..."}
        </div>
      </div>

      {/* Order summary card */}
      <div className="relative z-10 px-5 mb-5">
        <div className="card-surface p-5 space-y-4">
          <div>
            <p className="text-[11px] text-violet-400 font-semibold uppercase tracking-wider mb-0.5">{bottle.brand}</p>
            <h2 className="font-bold text-xl">{bottle.name}</h2>
          </div>

          <div className="space-y-3 border-t border-white/[0.07] pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-[#7171A0]">Venue</span>
              <span className="font-medium">{venue.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#7171A0]">Volume</span>
              <span className="font-medium">{purchase?.total_ml || bottle.volume_ml} ml</span>
            </div>
          </div>

          <div className="border-t border-white/[0.07] pt-4 flex justify-between items-center">
            <span className="text-[#7171A0] font-medium">Total</span>
            <span className="text-2xl font-black text-gold">₹{bottle.price.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment methods */}
      <div className="relative z-10 px-5 mb-5">
        <p className="text-xs text-[#7171A0] uppercase tracking-wider font-medium mb-3">Accepted Payment Methods</p>
        <div className="space-y-2">
          {PAYMENT_METHODS.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-[#111118] border border-white/[0.07]"
            >
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <m.icon className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">{m.label}</p>
                <p className="text-xs text-[#4A4A6A]">{m.hint}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Info box */}
      <div className="relative z-10 px-5 mb-8">
        <div className="bg-violet-500/8 border border-violet-500/20 rounded-2xl p-4">
          <p className="text-xs text-violet-300/80 text-center leading-relaxed">
            💡 After the bartender confirms payment, your bottle will appear in <strong>My Bottles</strong> ready to redeem
          </p>
        </div>
      </div>

      {/* Cancel */}
      <div className="relative z-10 px-5 mt-auto">
        <button
          onClick={() => navigate(-1)}
          className="w-full py-3.5 rounded-2xl border border-white/[0.07] text-[#7171A0] text-sm font-semibold hover:bg-white/5 transition-colors"
        >
          Cancel Purchase
        </button>
      </div>
    </div>
  );
}