import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Loader2, CreditCard, Smartphone, Banknote, ArrowLeft, Clock, ShoppingBag } from "lucide-react";
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
  const { bottle: stateBottle, venue: stateVenue, purchaseId, resuming } = (location.state || {}) as {
    bottle?: Bottle;
    venue?: Venue;
    purchaseId?: string;
    resuming?: boolean;
  };
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [bottle, setBottle] = useState<Bottle | undefined>(stateBottle);
  const [venue, setVenue] = useState<Venue | undefined>(stateVenue);
  const [isCreatingPurchase, setIsCreatingPurchase] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate("/login"); return; }
    if (resuming && purchaseId) {
      loadExistingPurchase();
    } else if (bottle && venue) {
      createPurchase();
    } else {
      navigate("/");
    }
  }, []);

  // Live countdown timer
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-redirect when purchase expires
  useEffect(() => {
    if (!purchase) return;
    const expiresAt = new Date(purchase.created_at).getTime() + 15 * 60 * 1000;
    if (currentTime >= expiresAt && !isConfirmed) {
      toast.error("Payment expired");
      navigate("/my-bottles");
    }
  }, [currentTime, purchase, isConfirmed, navigate]);

  const loadExistingPurchase = async () => {
    if (!purchaseId) { setError("No purchase ID provided"); setIsCreatingPurchase(false); return; }
    try {
      setIsCreatingPurchase(true);
      const existingPurchase = await purchaseService.getPurchase(purchaseId);
      const expiresAt = new Date(existingPurchase.created_at).getTime() + 15 * 60 * 1000;
      if (Date.now() >= expiresAt) {
        setError("This payment has expired. Please start a new purchase.");
        toast.error("Payment expired");
        return;
      }
      if (existingPurchase.payment_status === "confirmed") {
        toast.success("This purchase is already confirmed!");
        navigate("/my-bottles");
        return;
      }
      setPurchase(existingPurchase);
      if (!bottle) {
        setBottle({ id: existingPurchase.bottle_id, venue_id: existingPurchase.venue_id, brand: "", name: "Pending Purchase", price: existingPurchase.purchase_price, volume_ml: existingPurchase.total_ml, image_url: null, is_available: true });
      }
      if (!venue) {
        setVenue({ id: existingPurchase.venue_id, name: "Your Venue", location: "", is_open: true, image_url: null, created_at: "" });
      }
      toast.success("Resumed pending payment");
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Failed to load purchase. It may have expired.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsCreatingPurchase(false);
    }
  };

  const createPurchase = async () => {
    try {
      setIsCreatingPurchase(true);
      const newPurchase = await purchaseService.createPurchase(bottle!.id, venue!.id);
      setPurchase(newPurchase);
      toast.success("Purchase initiated successfully!");
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Failed to initiate purchase. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsCreatingPurchase(false);
    }
  };

  const handleCancelPurchase = async () => {
    if (!purchase) {
      navigate("/my-bottles");
      return;
    }

    if (window.confirm("Are you sure you want to cancel this purchase?")) {
      try {
        await purchaseService.cancelPurchase(purchase.id);
        toast.success("Purchase cancelled");
        navigate("/my-bottles");
      } catch (err: any) {
        toast.error("Failed to cancel purchase");
        // Still navigate away even if API fails
        navigate("/my-bottles");
      }
    }
  };

  // Poll for payment confirmation
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
          setError("Payment was declined.");
          toast.error("Payment was declined.");
          clearInterval(iv);
        }
      } catch { }
    }, 3000);
    return () => clearInterval(iv);
  }, [purchase, isConfirmed, error, navigate, bottle, venue]);

  // ── Loading state ──
  if (isCreatingPurchase) return (
    <div className="min-h-screen bg-[#09090F] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 border-[3px] border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#7171A0] text-sm animate-pulse">Setting up your purchase...</p>
      </div>
    </div>
  );

  if (!bottle || !venue) return null;

  // ── Error state ──
  if (error) return (
    <div className="min-h-screen bg-[#09090F] text-white flex items-center justify-center px-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-white font-bold text-lg mb-1">Purchase Error</p>
        <p className="text-red-400 mb-6 text-sm">{error}</p>
        <button onClick={() => navigate(-1)} className="bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-fuchsia-500/30">Go Back</button>
      </div>
    </div>
  );

  // ── Timer calculation ──
  const timeLeft = purchase
    ? Math.max(0, Math.floor((new Date(purchase.created_at).getTime() + 15 * 60 * 1000 - currentTime) / 1000))
    : 900;
  const minutesLeft = Math.floor(timeLeft / 60);
  const secondsLeft = timeLeft % 60;
  const isExpiringSoon = timeLeft < 300;

  return (
    <div className="flex flex-col h-screen bg-[#09090F] text-white overflow-hidden">

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* Hero header */}
        <div className="relative px-5 pt-12 pb-6">
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-amber-900/15 to-transparent pointer-events-none" />

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="relative z-10 w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center mb-5"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          {/* Title */}
          <div className="relative z-10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-400 mb-0.5">Payment</p>
            <h1 className="text-2xl font-extrabold leading-tight">{bottle.name || "Your Bottle"}</h1>
            {bottle.brand && <p className="text-sm text-white/50 mt-0.5">{bottle.brand}</p>}
          </div>
        </div>

        <div className="px-5 space-y-4 pb-6">

          {/* Status card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-4 ${isConfirmed
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-amber-500/10 border-amber-500/30"
              }`}
          >
            <div className="flex items-center gap-3">
              {!isConfirmed && <Loader2 className="w-5 h-5 text-amber-400 animate-spin flex-shrink-0" />}
              <div className="flex-1">
                <p className={`text-sm font-bold ${isConfirmed ? "text-emerald-400" : "text-amber-400"}`}>
                  {isConfirmed ? "✅ Payment Confirmed!" : "Waiting for payment confirmation"}
                </p>
                <p className={`text-xs mt-0.5 ${isConfirmed ? "text-emerald-400/70" : "text-amber-400/70"}`}>
                  {isConfirmed ? "Redirecting..." : "Show this to the bartender to pay"}
                </p>
              </div>
              {/* Countdown */}
              {purchase && !isConfirmed && (
                <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full border ${isExpiringSoon
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-white/5 border-white/10 text-[#7171A0]"
                  }`}>
                  <Clock className="w-3 h-3" />
                  {minutesLeft}:{secondsLeft.toString().padStart(2, "0")}
                </div>
              )}
            </div>
          </motion.div>

          {/* Order summary */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="card-surface p-4 space-y-3"
          >
            <p className="text-[11px] text-[#7171A0] font-semibold uppercase tracking-widest">Order Summary</p>
            <div className="space-y-2.5">
              {bottle.brand && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#7171A0]">Brand</span>
                  <span className="font-semibold text-violet-400">{bottle.brand}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#7171A0]">Venue</span>
                <span className="font-semibold">{venue.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7171A0]">Volume</span>
                <span className="font-semibold">{purchase?.total_ml || bottle.volume_ml} ml</span>
              </div>
            </div>
            <div className="border-t border-white/[0.07] pt-3 flex justify-between items-center">
              <span className="text-sm text-[#7171A0] font-medium">Total Amount</span>
              <span className="text-2xl font-black" style={{ color: "#F59E0B" }}>
                ₹{Math.round(bottle.price).toLocaleString("en-IN")}
              </span>
            </div>
          </motion.div>

          {/* Payment methods */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-2"
          >
            <p className="text-[11px] text-[#7171A0] font-semibold uppercase tracking-widest">Accepted Methods</p>
            {PAYMENT_METHODS.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 + i * 0.07 }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#111118] border border-white/[0.07]"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <m.icon className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{m.label}</p>
                  <p className="text-xs text-[#4A4A6A]">{m.hint}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Info box */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="p-4 bg-gradient-to-br from-violet-900/15 to-fuchsia-900/10 rounded-2xl border border-violet-500/20"
          >
            <p className="text-xs text-violet-300/80 text-center leading-relaxed">
              💡 After the bartender confirms payment, your bottle will appear in <strong>My Bottles</strong> ready to redeem
            </p>
          </motion.div>

        </div>
      </div>{/* end scroll */}

      {/* Pinned bottom — cancel */}
      <div className="px-5 pb-8 pt-3 bg-gradient-to-t from-[#09090F] via-[#09090F]/90 to-transparent flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleCancelPurchase}
          className="w-full py-4 rounded-2xl font-bold text-base bg-[#111118] border border-white/[0.08] text-[#7171A0] hover:border-white/20 transition-all duration-200"
        >
          Cancel Purchase
        </motion.button>
      </div>
    </div>
  );
}