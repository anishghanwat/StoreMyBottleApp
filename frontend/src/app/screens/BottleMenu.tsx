import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, Home, Wine as BottleIcon, User } from "lucide-react";
import { useState, useEffect } from "react";
import { venueService } from "../../services/venue.service";
import { Venue, Bottle } from "../../types/api.types";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export default function BottleMenu() {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (venueId) {
      loadVenueAndBottles();
    }
  }, [venueId]);

  const loadVenueAndBottles = async () => {
    try {
      setLoading(true);
      const [venueData, bottlesData] = await Promise.all([
        venueService.getVenueById(venueId!),
        venueService.getBottlesByVenue(venueId!),
      ]);
      setVenue(venueData);
      setBottles(bottlesData);
    } catch (err) {
      setError("Failed to load bottles. Please try again.");
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
          <p className="text-gray-400 font-medium animate-pulse">Fetching menu...</p>
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Venue not found"}</p>
          <Link to="/" className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors inline-block">
            Back to Venues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="px-6 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 -ml-2 hover:bg-zinc-800/50 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{venue.name}</h1>
            <p className="text-sm text-gray-400">{venue.location}</p>
          </div>
        </div>
      </div>

      {/* Bottle Grid */}
      <div className="px-6 py-6">
        {bottles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BottleIcon className="w-16 h-16 text-gray-600 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Bottles Available</h3>
            <p className="text-gray-500 max-w-xs">It seems this venue hasn't stocked up yet. Try checking another venue!</p>
            <Link to="/" className="mt-6 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors">
              Explore Venues
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {bottles.map((bottle) => (
              <div
                key={bottle.id}
                className="bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300"
              >
                {/* Bottle Image */}
                <div className="relative h-48 bg-zinc-900/50 flex items-center justify-center p-4">
                  <ImageWithFallback
                    src={bottle.image_url || "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"}
                    alt={bottle.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Bottle Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-purple-400 font-medium mb-1">{bottle.brand}</p>
                    <h3 className="text-sm font-semibold leading-tight">{bottle.name}</h3>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{bottle.volume_ml} ml</span>
                    <span className="text-lg font-bold text-white">₹{bottle.price.toLocaleString()}</span>
                  </div>

                  <button
                    onClick={() => {
                      const isAuthenticated = localStorage.getItem('access_token');
                      if (isAuthenticated) {
                        navigate('/payment', { state: { bottle, venue } });
                      } else {
                        navigate('/login', { state: { bottle, venue } });
                      }
                    }}
                    className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3 rounded-xl font-medium text-sm text-center transition-all duration-300 active:scale-95 shadow-lg shadow-purple-500/25"
                  >
                    Buy Bottle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/50 px-6 py-4">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Link to="/" className="flex flex-col items-center gap-1 text-purple-400">
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link to="/my-bottles" className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
            <BottleIcon className="w-6 h-6" />
            <span className="text-xs font-medium">My Bottles</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}