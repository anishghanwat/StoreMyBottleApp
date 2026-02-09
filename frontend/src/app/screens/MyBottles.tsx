import { Link, useNavigate } from "react-router";
import { Home, Wine as BottleIcon, User, Wine, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { purchaseService } from "../../services/purchase.service";
import { authService } from "../../services/auth.service";
import { UserBottle } from "../../types/api.types";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export default function MyBottles() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [bottles, setBottles] = useState<UserBottle[]>([]);
  const [history, setHistory] = useState<UserBottle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/login");
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [currentData, historyData] = await Promise.all([
        purchaseService.getUserBottles(),
        purchaseService.getPurchaseHistory()
      ]);
      setBottles(currentData);
      setHistory(historyData);
    } catch (err) {
      setError("Failed to load your bottles. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-lg shadow-purple-500/20"></div>
          <p className="text-gray-400 font-medium animate-pulse">Loading your collection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const displayedBottles = activeTab === 'current' ? bottles : history;

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-3xl font-bold mb-2">My Bottles</h1>
        <p className="text-gray-400 text-sm mb-6">Redeem your drinks anytime</p>

        {/* Tabs */}
        <div className="flex bg-zinc-900/50 rounded-xl p-1 mb-2">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'current'
              ? 'bg-zinc-800 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            Active Bottles
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'history'
              ? 'bg-zinc-800 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Bottles List */}
      {displayedBottles.length > 0 ? (
        <div className="px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedBottles.map((bottle) => {
            const percentageRemaining = (bottle.remainingMl / bottle.totalMl) * 100;
            const isFullyRedeemed = bottle.remainingMl === 0;
            const expiresAt = new Date(bottle.expiresAt);
            const isExpired = Date.now() > expiresAt.getTime();

            return (
              <div
                key={bottle.id}
                className={`bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-zinc-800/50 rounded-3xl overflow-hidden ${isFullyRedeemed || isExpired ? 'opacity-75 grayscale-[0.5]' : ''}`}
              >
                <div className="p-5 space-y-4">
                  {/* Bottle Info Header */}
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-zinc-900/50 rounded-2xl flex items-center justify-center p-2 flex-shrink-0">
                      <ImageWithFallback
                        src={bottle.image || "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"}
                        alt={bottle.bottleName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-purple-400 font-medium mb-1">{bottle.bottleBrand}</p>
                      <h3 className="text-lg font-semibold mb-1 truncate">{bottle.bottleName}</h3>
                      <p className="text-sm text-gray-400 flex items-center gap-1.5">
                        <Wine className="w-4 h-4" />
                        {bottle.venueName}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Remaining</span>
                      <span className="font-semibold">
                        {bottle.remainingMl} ml <span className="text-gray-500">/ {bottle.totalMl} ml</span>
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-800/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isFullyRedeemed || isExpired ? 'bg-gray-600' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
                        style={{ width: `${percentageRemaining}%` }}
                      />
                    </div>
                    {/* Expiry Date Info */}
                    {!isFullyRedeemed && !isExpired && (
                      <p className="text-xs text-gray-500 text-right mt-1">
                        Expires: {expiresAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Redeem Button (Only for Active) */}
                  {!isFullyRedeemed && !isExpired && activeTab === 'current' && (
                    <Link
                      to={`/redeem/${bottle.id}`}
                      className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-4 rounded-xl font-medium text-base text-center transition-all duration-300 active:scale-95 shadow-lg shadow-purple-500/25"
                    >
                      Redeem Drink
                    </Link>
                  )}

                  {isFullyRedeemed && (
                    <div className="w-full bg-zinc-800/50 text-gray-400 py-3 rounded-xl font-medium text-sm text-center flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      Fully Redeemed
                    </div>
                  )}
                  {isExpired && !isFullyRedeemed && (
                    <div className="w-full bg-red-900/20 border border-red-900/50 text-red-400 py-3 rounded-xl font-medium text-sm text-center flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      Expired on {expiresAt.toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-24 h-24 bg-zinc-900/50 rounded-full flex items-center justify-center mb-6">
            <BottleIcon className="w-12 h-12 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No {activeTab === 'current' ? 'active bottles' : 'history'}</h3>
          <p className="text-gray-400 text-sm mb-8">
            {activeTab === 'current'
              ? 'Buy your first bottle at a venue'
              : 'Your purchase history will appear here'}
          </p>
          {activeTab === 'current' && (
            <Link
              to="/"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all duration-300 active:scale-95 shadow-lg shadow-purple-500/25"
            >
              Browse Venues
            </Link>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/50 px-6 py-4">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Link to="/" className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </Link>
          <div className="flex flex-col items-center gap-1 text-purple-400">
            <BottleIcon className="w-6 h-6" />
            <span className="text-xs font-medium">My Bottles</span>
          </div>
          <Link to="/profile" className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}