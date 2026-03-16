import { Link } from "react-router";
import { Search, MapPin, X, Flame, Clock, RefreshCw, User } from "lucide-react";
import { useState, useEffect } from "react";
import { venueService } from "../../services/venue.service";
import { Venue } from "../../types/api.types";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useLocationAndGreeting } from "../../utils/useLocationAndGreeting";
import { BottomNav } from "../components/ui/BottomNav";
import { motion } from "motion/react";


export default function VenueSelection() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState<"all" | "open" | "recent" | "nearby">("all");

  // Use location and greeting hook
  const { greeting, location, locationDetails, loading: locationLoading, refresh: refreshLocation } = useLocationAndGreeting();

  useEffect(() => { loadVenues(); }, []);

  useEffect(() => { applyFilters(); }, [searchTerm, filterOpen, venues, locationDetails]);

  const loadVenues = async () => {
    try {
      setLoading(true);
      // Load all venues initially
      const data = await venueService.getVenues();
      setVenues(data);
    } catch (err) {
      setError("Failed to load venues. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...venues];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Open filter
    if (filterOpen === "open") {
      filtered = filtered.filter(v => v.is_open);
    }

    // Recent filter
    if (filterOpen === "recent") {
      filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    // Nearby filter (city-based)
    if (filterOpen === "nearby" && locationDetails) {
      const userCity = locationDetails.city.toLowerCase();
      filtered = filtered.filter(v =>
        v.location.toLowerCase().includes(userCity)
      );
    }

    setFilteredVenues(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090F] text-white flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 border-[3px] border-violet-600 border-t-transparent rounded-full animate-spin shadow-lg shadow-violet-500/20" />
        <p className="text-[#7171A0] text-sm font-medium animate-pulse">Finding the scene...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090F] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-400 mb-4 text-sm">{error}</p>
          <button onClick={loadVenues} className="btn-primary px-6 py-3 rounded-2xl text-white text-sm font-bold">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#09090F] text-white">
      {/* Top ambient header */}
      <div className="relative px-5 pt-12 pb-5">
        {/* Ambient glow behind header */}
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-violet-900/20 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-violet-400" />
              {locationLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-[#7171A0] font-medium">Locating...</span>
                </div>
              ) : (
                <>
                  <span className="text-xs text-[#7171A0] font-medium">{location}</span>
                  <button
                    onClick={refreshLocation}
                    className="p-1 hover:bg-white/5 rounded-full transition-colors"
                    title="Refresh location"
                  >
                    <RefreshCw className="w-3 h-3 text-[#4A4A6A] hover:text-violet-400 transition-colors" />
                  </button>
                </>
              )}
            </div>
            <Link to="/profile" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <User className="w-4 h-4 text-[#7171A0]" />
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-3">
            {greeting.greeting} {greeting.emoji}
          </h1>
          <p className="text-[#7171A0] text-sm mt-0.5">
            {greeting.timeOfDay === 'morning' && 'Start your day with something special'}
            {greeting.timeOfDay === 'afternoon' && 'Perfect time for a refreshing drink'}
            {greeting.timeOfDay === 'evening' && 'Where are you heading tonight?'}
            {greeting.timeOfDay === 'night' && 'The night is still young!'}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-5 mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A4A6A] w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search venues..."
            className="input-nightlife w-full py-3.5 pl-11 pr-4 text-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-[#4A4A6A]" />
            </button>
          )}
        </div>
      </div>


      {/* Filter Pills */}
      <div className="px-5 mb-5">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { key: "all", label: "All Venues", icon: null },
            { key: "nearby", label: locationDetails ? `Near Me (${locationDetails.city})` : "Near Me", icon: MapPin, disabled: !locationDetails },
            { key: "open", label: "Open Now", icon: null },
            { key: "recent", label: "New", icon: Flame },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => !f.disabled && setFilterOpen(f.key as any)}
              disabled={f.disabled}
              className={`chip whitespace-nowrap ${filterOpen === f.key ? "chip-active" : "chip-inactive"} ${f.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {f.key === "open" && <span className="open-dot" />}
              {f.key === "recent" && <Flame className="w-3 h-3" />}
              {f.key === "nearby" && <MapPin className="w-3 h-3" />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section Title */}
      <div className="px-5 mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#7171A0]">
          {filteredVenues.length} {filteredVenues.length === 1 ? "venue" : "venues"}
          {filterOpen === "nearby" && locationDetails ? ` in ${locationDetails.city}` : " found"}
        </h2>
      </div>

      {/* Venue List */}
      <div className="px-4 space-y-3 pb-24">
        {filteredVenues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[#111118] border border-white/[0.07] flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-[#4A4A6A]" />
            </div>
            <h3 className="text-base font-semibold mb-1">No venues found</h3>
            <p className="text-[#7171A0] text-xs">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredVenues.map((venue) => (
            <motion.div
              key={venue.id}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.1 }}
            >
              <Link to={`/venue/${venue.id}`} className="block group">
                <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] hover:border-violet-500/25 transition-all duration-300">
                  {/* Full image */}
                  <div className="relative h-44 overflow-hidden">
                    <ImageWithFallback
                      src={venue.image_url || "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600"}
                      alt={venue.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Gradient overlay — bottom heavy */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Top-right: star rating badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-xl text-xs font-bold border border-white/10">
                      <span className="text-amber-400">★</span>
                      <span className="text-white">{venue.is_open ? "4.8" : "—"}</span>
                    </div>

                    {/* Bottom overlay: name + location left, tags right */}
                    <div className="absolute bottom-0 inset-x-0 px-4 pb-3 pt-6 flex items-end justify-between">
                      {/* Left: name + location */}
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg text-white leading-tight truncate">{venue.name}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-white/60 flex-shrink-0" />
                          <span className="text-sm text-white/70 truncate">{venue.location}</span>
                        </div>
                      </div>

                      {/* Right: tags */}
                      <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                        {venue.is_open ? (
                          <span className="bg-black/50 backdrop-blur-sm border border-white/15 text-white/80 text-[11px] font-medium px-2.5 py-1 rounded-full">
                            Open
                          </span>
                        ) : (
                          <span className="bg-black/50 backdrop-blur-sm border border-white/15 text-white/50 text-[11px] font-medium px-2.5 py-1 rounded-full">
                            Closed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>


      {/* Bottom Navigation */}
      <BottomNav active="home" />

      {/* Responsible drinking footer */}
      <p className="text-center text-[#4A4A6A] text-xs pb-20 pt-2 px-4">
        🍷 Drink responsibly · For adults 25+ only · Don't drink and drive
      </p>
    </div>
  );
}
