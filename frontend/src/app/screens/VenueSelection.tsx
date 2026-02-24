import { Link } from "react-router";
import { Search, MapPin, X, SlidersHorizontal, Home, Wine, User } from "lucide-react";
import { useState, useEffect } from "react";
import { venueService } from "../../services/venue.service";
import { Venue } from "../../types/api.types";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export default function VenueSelection() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filterOpen, setFilterOpen] = useState<"all" | "open" | "closed">("all");
  const [sortBy, setSortBy] = useState<"name" | "popular" | "recent">("name");

  useEffect(() => {
    loadVenues();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterOpen, sortBy, venues]);

  const loadVenues = async () => {
    try {
      setLoading(true);
      const data = await venueService.getVenues();
      setVenues(data);
    } catch (err) {
      setError("Failed to load venues. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...venues];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(venue =>
        venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Open/Closed filter
    if (filterOpen === "open") {
      filtered = filtered.filter(venue => venue.is_open);
    } else if (filterOpen === "closed") {
      filtered = filtered.filter(venue => !venue.is_open);
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "popular") {
        // For now, just reverse order (would use actual popularity data)
        return 0;
      } else if (sortBy === "recent") {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      return 0;
    });

    setFilteredVenues(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterOpen("all");
    setSortBy("name");
  };

  const activeFiltersCount =
    (filterOpen !== "all" ? 1 : 0) +
    (sortBy !== "name" ? 1 : 0);

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
            onClick={loadVenues}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">{/* Added pb-24 for bottom nav */}
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          StoreMyBottle
        </h1>
        <p className="text-gray-400 text-sm">Choose Your Venue</p>
      </div>

      {/* Search Bar */}
      <div className="px-6 mb-4">
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

      {/* Filter Bar */}
      <div className="px-6 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${showFilters || activeFiltersCount > 0
              ? "bg-purple-500 text-white"
              : "bg-zinc-900/50 border border-zinc-800 text-gray-400"
              }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Quick Filters */}
          <button
            onClick={() => setFilterOpen(filterOpen === "open" ? "all" : "open")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterOpen === "open"
              ? "bg-green-500 text-white"
              : "bg-zinc-900/50 border border-zinc-800 text-gray-400"
              }`}
          >
            Open Now
          </button>

          <button
            onClick={() => setSortBy(sortBy === "popular" ? "name" : "popular")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${sortBy === "popular"
              ? "bg-purple-500 text-white"
              : "bg-zinc-900/50 border border-zinc-800 text-gray-400"
              }`}
          >
            Popular
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-red-500/20 border border-red-500/30 text-red-400"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Status</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterOpen("all")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${filterOpen === "all"
                    ? "bg-purple-500 text-white"
                    : "bg-zinc-800 text-gray-400"
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterOpen("open")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${filterOpen === "open"
                    ? "bg-green-500 text-white"
                    : "bg-zinc-800 text-gray-400"
                    }`}
                >
                  Open
                </button>
                <button
                  onClick={() => setFilterOpen("closed")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${filterOpen === "closed"
                    ? "bg-red-500 text-white"
                    : "bg-zinc-800 text-gray-400"
                    }`}
                >
                  Closed
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Sort By</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy("name")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${sortBy === "name"
                    ? "bg-purple-500 text-white"
                    : "bg-zinc-800 text-gray-400"
                    }`}
                >
                  Name
                </button>
                <button
                  onClick={() => setSortBy("popular")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${sortBy === "popular"
                    ? "bg-purple-500 text-white"
                    : "bg-zinc-800 text-gray-400"
                    }`}
                >
                  Popular
                </button>
                <button
                  onClick={() => setSortBy("recent")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${sortBy === "recent"
                    ? "bg-purple-500 text-white"
                    : "bg-zinc-800 text-gray-400"
                    }`}
                >
                  Recent
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="px-6 mb-4">
        <p className="text-sm text-gray-400">
          {filteredVenues.length} {filteredVenues.length === 1 ? "venue" : "venues"} found
        </p>
      </div>

      {/* Venue List */}
      <div className="px-4 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredVenues.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="w-16 h-16 text-gray-600 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No venues found</h3>
            <p className="text-gray-500 max-w-xs mb-6">
              {searchTerm || activeFiltersCount > 0
                ? "Try adjusting your search or filters"
                : "No venues available at the moment"}
            </p>
            {(searchTerm || activeFiltersCount > 0) && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredVenues.map((venue) => (
            <div
              key={venue.id}
              className="block group"
            >
              <div className="h-full relative bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
                {/* Venue Image */}
                <Link to={`/venue/${venue.id}`} className="block">
                  <div className="relative h-48 overflow-hidden">
                    <ImageWithFallback
                      src={venue.image_url || "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800"}
                      alt={venue.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
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
                </Link>

                {/* Venue Info */}
                <div className="p-4">
                  <Link to={`/venue/${venue.id}`}>
                    <h3 className="text-lg font-semibold mb-1.5 group-hover:text-purple-400 transition-colors">{venue.name}</h3>
                    <div className="flex items-center text-gray-400 text-sm mb-3">
                      <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
                      <span className="truncate">{venue.location}</span>
                    </div>
                  </Link>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      to={`/venue/${venue.id}`}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-2.5 rounded-lg font-medium text-sm text-center transition-all duration-300 active:scale-95"
                    >
                      View Menu
                    </Link>
                    <Link
                      to={`/venue/${venue.id}/details`}
                      className="px-4 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-lg font-medium text-sm transition-all duration-300 active:scale-95 flex items-center justify-center"
                    >
                      Info
                    </Link>
                  </div>
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5" />
                </div>
              </div>
            </div>
          ))
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
            <Wine className="w-6 h-6" />
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
