import { Link } from "react-router";
import { Search, MapPin, X, Flame, Clock, RefreshCw, User } from "lucide-react";
import { useState, useEffect } from "react";
import { venueService } from "../../services/venue.service";
import { Venue } from "../../types/api.types";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useLocationAndGreeting } from "../../utils/useLocationAndGreeting";
import { BottomNav } from "../components/ui/BottomNav";
import { motion } from "motion/react";

const PROMO_BANNERS = [
  { label: "🎉 Happy Hours", sub: "50% off premium pegs till 9 PM", gradient: "from-violet-600/90 to-fuchsia-700/90" },
  { label: "🥃 New Arrivals", sub: "Single malt collection at Privé", gradient: "from-amber-600/90 to-orange-700/90" },
  { label: "🎶 Live Tonight", sub: "Open bar with DJ set at Aer", gradient: "from-cyan-600/90 to-blue-700/90" },
];

export default function VenueSelection() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState<"all" | "open" | "recent" | "nearby">("all");
  const [activeBanner, setActiveBanner] = useState(0);

  // Use location and greeting hook
  const { greeting, location, locationDetails, loading: locationLoading, refresh: refreshLocation } = useLocationAndGreeting();

  useEffect(() => { loadVenues(); }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveBanner(p => (p + 1) % PROMO_BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);

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
    <div className="min-h-screen bg-[#09090F] text-white pb-24">
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

      {/* Promo Banner Carousel */}
      {!searchTerm && (
        <div className="px-5 mb-5">
          <div className="relative rounded-2xl overflow-hidden h-20">
            {PROMO_BANNERS.map((b, i) => (
              <div
                key={i}
                className={`absolute inset-0 bg-gradient-to-r ${b.gradient} flex flex-col justify-center px-5 transition-opacity duration-700 ${i === activeBanner ? "opacity-100" : "opacity-0"}`}
              >
                <p className="text-white font-bold text-sm">{b.label}</p>
                <p className="text-white/70 text-xs mt-0.5">{b.sub}</p>
              </div>
            ))}
            {/* Dots */}
            <div className="absolute bottom-2 right-3 flex gap-1">
              {PROMO_BANNERS.map((_, i) => (
                <button key={i} onClick={() => setActiveBanner(i)}
                  className={`h-1.5 rounded-full transition-all ${i === activeBanner ? "w-4 bg-white" : "w-1.5 bg-white/40"}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* Venue Grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {filteredVenues.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-20 text-center">
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
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.1 }}
            >
              <Link to={`/venue/${venue.id}`} className="block group">
                <div className="card-surface overflow-hidden hover:border-violet-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10">
                  {/* Image */}
                  <div className="relative h-32 overflow-hidden">
                    <ImageWithFallback
                      src={venue.image_url || "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600"}
                      alt={venue.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    {/* Open badge */}
                    <div className="absolute top-2 right-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm ${venue.is_open
                        ? "bg-green-500/20 border border-green-500/30 text-green-400"
                        : "bg-black/50 border border-white/10 text-[#7171A0]"
                        }`}>
                        {venue.is_open && <span className="open-dot scale-75" />}
                        {venue.is_open ? "Open" : "Closed"}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm leading-tight mb-1 group-hover:text-violet-400 transition-colors truncate">{venue.name}</h3>
                    <div className="flex items-center gap-1 text-[#7171A0]">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="text-[11px] truncate">{venue.location}</span>
                    </div>
                  </div>

                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 pointer-events-none" />
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="home" />
    </div>
  );
}
