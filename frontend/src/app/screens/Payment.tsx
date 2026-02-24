import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { Loader2 } from "lucide-react";
import { purchaseService } from "../../services/purchase.service";
import { authService } from "../../services/auth.service";
import { Bottle, Venue, Purchase } from "../../types/api.types";

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bottle, venue } = (location.state || {}) as { bottle?: Bottle; venue?: Venue };
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [isCreatingPurchase, setIsCreatingPurchase] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      navigate("/login");
      return;
    }

    // Check if we have the required data
    if (!bottle || !venue) {
      navigate("/");
      return;
    }

    // Create purchase on mount
    createPurchase();
  }, []);

  const createPurchase = async () => {
    try {
      setIsCreatingPurchase(true);
      // Create purchase in backend
      const newPurchase = await purchaseService.createPurchase(bottle!.id, venue!.id);
      setPurchase(newPurchase);
      setIsCreatingPurchase(false);

      // Poll for status
      const intervalInfo = { id: 0 };
      const checkStatus = async () => {
        try {
          const updated = await purchaseService.getPurchase(newPurchase.id);
          if (updated.payment_status === 'confirmed') {
            setIsConfirmed(true);
            clearInterval(intervalInfo.id);
            // Navigate to success screen
            setTimeout(() => {
              navigate("/payment-success", {
                state: {
                  purchase: updated,
                  bottle,
                  venue
                }
              });
            }, 500);
          } else if (updated.payment_status === 'failed') {
            setError("Payment was rejected by the venue.");
            clearInterval(intervalInfo.id);
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      };

      // Check every 3 seconds
      intervalInfo.id = window.setInterval(checkStatus, 3000);

      // Cleanup on unmount (needs ref or useEffect cleanup, but this is a simplified approach)
      return () => clearInterval(intervalInfo.id);

    } catch (err) {
      setError("Failed to create purchase. Please try again.");
      setIsCreatingPurchase(false);
      console.error(err);
    }
  };

  // We need to manage the interval cleanup properly
  useEffect(() => {
    let intervalId: number;

    if (purchase && !isConfirmed && !error) {
      const checkStatus = async () => {
        try {
          const updated = await purchaseService.getPurchase(purchase.id);
          if (updated.payment_status === 'confirmed') {
            setIsConfirmed(true);
            clearInterval(intervalId);
            setTimeout(() => {
              navigate("/payment-success", {
                state: {
                  purchase: updated,
                  bottle,
                  venue
                }
              });
            }, 500);
          } else if (updated.payment_status === 'failed') {
            setError("Payment was rejected by the venue.");
            clearInterval(intervalId);
          }
        } catch (e) { console.error(e); }
      };
      intervalId = window.setInterval(checkStatus, 3000);
    }

    return () => clearInterval(intervalId);
  }, [purchase, isConfirmed, error, navigate, bottle, venue]);

  // Show loading while creating purchase
  if (isCreatingPurchase || !bottle || !venue) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-lg shadow-purple-500/20"></div>
          <p className="text-gray-400 font-medium animate-pulse">Creating your purchase...</p>
        </div>
      </div>
    );
  }

  // Show error if purchase creation failed
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      {/* Status Badge */}
      <div className="mb-8">
        <div className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full backdrop-blur-xl">
          {!isConfirmed && <Loader2 className="w-4 h-4 animate-spin" />}
          <span className="text-sm font-medium">
            {isConfirmed ? "Payment Confirmed!" : "Waiting for payment confirmation"}
          </span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-2 text-center">Pay at Counter</h1>
      <p className="text-gray-400 text-sm mb-8 text-center max-w-sm">
        Please proceed to the counter and complete your payment. The bartender will confirm your purchase.
      </p>

      {/* Payment Info Card */}
      <div className="w-full max-w-sm bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 space-y-4 mb-8">
        <div>
          <p className="text-xs text-purple-400 font-medium mb-1">{bottle.brand}</p>
          <h3 className="text-xl font-semibold">{bottle.name}</h3>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-zinc-800">
          <span className="text-gray-400">Venue</span>
          <span className="font-medium">{venue.name}</span>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-zinc-800">
          <span className="text-gray-400">Volume</span>
          <span className="font-medium">{purchase?.total_ml || bottle.volume_ml} ml</span>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-zinc-800">
          <span className="text-gray-400 text-lg">Total Amount</span>
          <span className="text-2xl font-bold text-white">₹{bottle.price.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="w-full max-w-sm space-y-4">
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4">
          <h3 className="text-sm font-semibold mb-3 text-purple-400">Payment Methods Accepted</h3>
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
              <span>UPI / QR Code Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
              <span>Credit / Debit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
              <span>Cash</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-4">
          <p className="text-xs text-blue-400 text-center">
            💡 After payment confirmation, your bottle will appear in "My Bottles" with a QR code for redemption
          </p>
        </div>
      </div>

      {/* Cancel Button */}
      <button
        onClick={() => navigate(-1)}
        className="mt-6 px-6 py-2 text-gray-400 hover:text-white transition-colors text-sm"
      >
        Cancel Purchase
      </button>
    </div>
  );
}