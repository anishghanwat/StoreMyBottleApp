import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, Wine as BottleIcon, Search, SlidersHorizontal, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { venueService } from "../../services/venue.service";
import { Venue, Bottle } from "../../types/api.types";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { motion } from "motion/react";
import { BottomNav } from "../components/ui/BottomNav";

// Bottle categories
const CATEGORIES = [
  { id: "all", label: "All", keywords: [] },
  { id: "whisky", label: "Whisky", keywords: ["whisky", "whiskey", "scotch", "bourbon"] },
  { id: "vodka", label: "Vodka", keywords: ["vodka"] },
  { id: "rum", label: "Rum", keywords: ["rum"] },
  { id: "gin", label: "Gin", keywords: ["gin"] },
  { id: "tequila", label: "Tequila", keywords: ["tequila", "mezcal"] },
  { id: "brandy", label: "Brandy", keywords: ["brandy", "cognac"] },
  { id: "wine", label: "Wine", keywords: ["wine", "champagne"] },
];

const PRICE_RANGES = [
  { id: "all", label: "All Prices", min: 0, max: Infinity },
  { id: "budget", label: "Under ₹2,000", min: 0, max: 2000 },
  { id: "mid", label: "₹2,000 - ₹5,000", min: 2000, max: 5000 },
  { id: "premium", label: "₹5,000 - ₹10,000", min: 5000, max: 10000 },
  { id: "luxury", label: "Above ₹10,000", min: 10000, max: Infinity },
];

export default function BottleMenu() {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

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

  // Filter and search logic
  const filteredBottles = useMemo(() => {
    return bottles.filter((bottle) => {
      // Search filter
      const matchesSearch = searchQuery === "" ||
        bottle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bottle.brand.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const category = CATEGORIES.find(c => c.id === selectedCategory);
      const matchesCategory = selectedCategory === "all" ||
        category?.keywords.some(keyword =>
          bottle.name.toLowerCase().includes(keyword) ||
          bottle.brand.toLowerCase().includes(keyword)
        );

      // Price filter
      const priceRange = PRICE_RANGES.find(p => p.id === selectedPriceRange);
      const matchesPrice = !priceRange ||
        (bottle.price >= priceRange.min && bottle.price < priceRange.max);

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [bottles, searchQuery, selectedCategory, selectedPriceRange]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (selectedPriceRange !== "all") count++;
    if (searchQuery) count++;
    return count;
  }, [selectedCategory, selectedPriceRange, searchQuery]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedPriceRange("all");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090F] text-white flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 border-[3px] border-violet-600 border-t-transparent rounded-full animate-spin shadow-lg shadow-violet-500/20" />
        <p className="text-[#7171A0] text-sm font-medium animate-pulse">Fetching menu...</p>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-[#09090F] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-400 mb-4 text-sm">{error || "Venue not found"}</p>
          <Link to="/" className="btn-primary px-6 py-3 rounded-2xl text-sm font-bold text-white inline-block">
            Back to Venues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090F] text-white pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 glass-dark border-b border-white/[0.07]">
        <div className="px-5 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#7171A0]" />
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-semibold tracking-tight">{venue.name}</h1>
            <p className="text-xs text-[#7171A0]">{venue.location}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-5 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A6A]" />
            <input
              type="text"
              placeholder="Search bottles or brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-nightlife w-full pl-11 pr-11 py-3.5 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-[#4A4A6A]" />
              </button>
            )}
          </div>
        </div>

        {/* Category Chips */}
        <div className="px-5 pb-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`chip whitespace-nowrap ${selectedCategory === category.id ? "chip-active" : "chip-inactive"}`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Button & Active Filters */}
        <div className="px-5 pb-4 flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${showFilters || activeFilterCount > 0
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
              : "bg-[#111118] text-[#7171A0] hover:text-white border border-white/[0.07]"
              }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-white text-violet-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              Clear all
            </button>
          )}

          <div className="flex-1 text-right text-xs text-[#7171A0]">
            {filteredBottles.length} {filteredBottles.length === 1 ? "bottle" : "bottles"}
          </div>
        </div>

        {/* Price Range Filter Panel */}
        {showFilters && (
          <div className="px-5 pb-4 space-y-4 border-t border-white/[0.07] pt-4">
            <div>
              <label className="text-xs font-semibold text-[#7171A0] mb-2 block uppercase tracking-wider">Price Range</label>
              <div className="grid grid-cols-2 gap-2">
                {PRICE_RANGES.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setSelectedPriceRange(range.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${selectedPriceRange === range.id
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                      : "bg-[#111118] text-[#7171A0] hover:text-white border border-white/[0.07]"
                      }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottle Grid */}
      <div className="px-5 py-5">
        {filteredBottles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[#111118] border border-white/[0.07] flex items-center justify-center mb-4">
              <BottleIcon className="w-8 h-8 text-[#2A2A3A]" />
            </div>
            <h3 className="text-base font-semibold mb-1">
              {bottles.length === 0 ? "No Bottles Available" : "No Matching Bottles"}
            </h3>
            <p className="text-[#7171A0] text-xs max-w-xs mb-6">
              {bottles.length === 0
                ? "This venue hasn't stocked up yet. Try another venue!"
                : "Try adjusting your filters or search."
              }
            </p>
            {bottles.length === 0 ? (
              <Link to="/" className="btn-primary px-6 py-3 rounded-2xl text-sm font-bold text-white inline-block">
                Explore Venues
              </Link>
            ) : (
              <button
                onClick={clearFilters}
                className="btn-primary px-6 py-3 rounded-2xl text-sm font-bold text-white"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredBottles.map((bottle, i) => (
              <motion.div
                key={bottle.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.98 }}
                className="card-surface overflow-hidden hover:border-violet-500/30 transition-all duration-300 group"
              >
                {/* Bottle Image */}
                <Link to={`/venue/${venueId}/bottle/${bottle.id}`} state={{ bottle, venue }}>
                  <div className="relative h-44 bg-gradient-to-br from-violet-900/10 to-[#1A1A26] flex items-center justify-center p-4">
                    <ImageWithFallback
                      src={bottle.image_url || "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"}
                      alt={bottle.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>

                {/* Bottle Info */}
                <div className="p-4 space-y-3">
                  <Link to={`/venue/${venueId}/bottle/${bottle.id}`} state={{ bottle, venue }}>
                    <div>
                      <p className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider mb-0.5">{bottle.brand}</p>
                      <h3 className="text-sm font-bold leading-tight">{bottle.name}</h3>
                    </div>

                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-[#7171A0] text-xs">{bottle.volume_ml}ml</span>
                      <span className="text-xl font-black text-gold">₹{bottle.price.toLocaleString()}</span>
                    </div>
                  </Link>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        const isAuthenticated = localStorage.getItem('access_token');
                        if (isAuthenticated) {
                          navigate('/payment', { state: { bottle, venue } });
                        } else {
                          navigate('/login', { state: { bottle, venue } });
                        }
                      }}
                      className="flex-1 btn-primary py-2.5 rounded-xl font-bold text-sm text-center text-white"
                    >
                      Buy
                    </button>
                    <Link
                      to={`/venue/${venueId}/bottle/${bottle.id}`}
                      state={{ bottle, venue }}
                      className="px-4 bg-[#1A1A26] hover:bg-[#222233] text-[#7171A0] hover:text-white py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center"
                    >
                      Info
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="home" />
    </div>
  );
}