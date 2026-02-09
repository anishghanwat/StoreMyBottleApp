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

  // QR code data for bartender to scan
  const qrData = JSON.stringify({
    type: "payment",
    purchaseId: purchase?.id,
    venueId: venue.id,
    bottleId: bottle.id,
    amount: bottle.price,
    timestamp: Date.now(),
  });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      {/* Status Badge */}
      <div className="mb-8">
        <div className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full backdrop-blur-xl">
          {!isConfirmed && <Loader2 className="w-4 h-4 animate-spin" />}
          <span className="text-sm font-medium">
            {isConfirmed ? "Confirmed!" : "Waiting for confirmation"}
          </span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-2 text-center">Pay at Counter</h1>
      <p className="text-gray-400 text-sm mb-8 text-center">Show this QR to bartender</p>

      {/* QR Code */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-30 animate-pulse" />
        <div className="relative bg-white p-8 rounded-3xl shadow-2xl">
          <QRCodeSVG
            value={qrData}
            size={240}
            level="H"
            includeMargin={false}
          />
        </div>
      </div>

      {/* Payment Info */}
      <div className="w-full max-w-sm bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 space-y-4">
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
          <span className="font-medium">{bottle.volume_ml} ml</span>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-zinc-800">
          <span className="text-gray-400 text-lg">Total</span>
          <span className="text-2xl font-bold text-white">₹{bottle.price.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment Methods */}
      <p className="text-gray-500 text-xs mt-6 text-center">
        Pay via UPI, Cash, or Card at the counter
      </p>
    </div>
  );
}