import { Link } from "react-router";
import { Search, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { venueService } from "../../services/venue.service";
import { Venue } from "../../types/api.types";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export default function VenueSelection() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      loadVenues(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadVenues = async (search?: string) => {
    try {
      setLoading(true);
      const data = await venueService.getVenues(search);
      setVenues(data);
    } catch (err) {
      setError("Failed to load venues. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !searchTerm) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-lg shadow-purple-500/20"></div>
          <p className="text-gray-400 font-medium animate-pulse">Finding best places...</p>
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
            onClick={() => loadVenues(searchTerm)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          StoreMyBottle
        </h1>
        <p className="text-gray-400 text-sm">Choose Your Venue</p>
      </div>

      {/* Search Bar */}
      <div className="px-6 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search venues..."
            className="w-full bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
        </div>
      </div>

      {/* Venue List */}
      <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {venues.map((venue) => (
          <Link
            key={venue.id}
            to={`/venue/${venue.id}`}
            className="block group"
          >
            <div className="h-full relative bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-zinc-800/50 rounded-3xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 active:scale-[0.98] hover:shadow-xl hover:shadow-purple-500/10">
              {/* Venue Image */}
              <div className="relative h-48 overflow-hidden">
                <ImageWithFallback
                  src={venue.image_url || "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800"}
                  alt={venue.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <div
                    className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-xl ${venue.is_open
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                  >
                    {venue.is_open ? "Open" : "Closed"}
                  </div>
                </div>
              </div>

              {/* Venue Info */}
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition-colors">{venue.name}</h3>
                <div className="flex items-center text-gray-400 text-sm">
                  <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
                  <span className="truncate">{venue.location}</span>
                </div>
              </div>

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
