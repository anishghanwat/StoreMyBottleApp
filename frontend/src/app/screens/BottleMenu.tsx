import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, Home, Wine as BottleIcon, User, Search, SlidersHorizontal, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { venueService } from "../../services/venue.service";
import { Venue, Bottle } from "../../types/api.types";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

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

        {/* Search Bar */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search bottles or brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-12 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Category Chips */}
        <div className="px-6 pb-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === category.id
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                  : "bg-zinc-900/50 text-gray-400 hover:bg-zinc-800 border border-zinc-800"
                  }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Button & Active Filters */}
        <div className="px-6 pb-4 flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${showFilters || activeFilterCount > 0
              ? "bg-purple-600 text-white"
              : "bg-zinc-900/50 text-gray-400 hover:bg-zinc-800 border border-zinc-800"
              }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-white text-purple-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Clear all
            </button>
          )}

          <div className="flex-1 text-right text-sm text-gray-400">
            {filteredBottles.length} {filteredBottles.length === 1 ? "bottle" : "bottles"}
          </div>
        </div>

        {/* Expandable Filters Panel */}
        {showFilters && (
          <div className="px-6 pb-4 space-y-4 border-t border-zinc-800/50 pt-4">
            {/* Price Range Filter */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Price Range</label>
              <div className="grid grid-cols-2 gap-2">
                {PRICE_RANGES.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setSelectedPriceRange(range.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedPriceRange === range.id
                      ? "bg-purple-600 text-white"
                      : "bg-zinc-900/50 text-gray-400 hover:bg-zinc-800 border border-zinc-800"
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
      <div className="px-6 py-6">
        {filteredBottles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BottleIcon className="w-16 h-16 text-gray-600 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {bottles.length === 0 ? "No Bottles Available" : "No Matching Bottles"}
            </h3>
            <p className="text-gray-500 max-w-xs mb-6">
              {bottles.length === 0
                ? "It seems this venue hasn't stocked up yet. Try checking another venue!"
                : "Try adjusting your filters or search to find what you're looking for."
              }
            </p>
            {bottles.length === 0 ? (
              <Link to="/" className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors">
                Explore Venues
              </Link>
            ) : (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredBottles.map((bottle) => (
              <div
                key={bottle.id}
                className="bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300"
              >
                {/* Bottle Image */}
                <Link to={`/venue/${venueId}/bottle/${bottle.id}`} state={{ bottle, venue }}>
                  <div className="relative h-48 bg-zinc-900/50 flex items-center justify-center p-4">
                    <ImageWithFallback
                      src={bottle.image_url || "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"}
                      alt={bottle.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </Link>

                {/* Bottle Info */}
                <div className="p-4 space-y-3">
                  <Link to={`/venue/${venueId}/bottle/${bottle.id}`} state={{ bottle, venue }}>
                    <div>
                      <p className="text-xs text-purple-400 font-medium mb-1">{bottle.brand}</p>
                      <h3 className="text-base font-semibold leading-tight">{bottle.name}</h3>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-400 mt-2">
                      <span>{bottle.volume_ml}ml</span>
                      <span className="text-xl font-bold text-white">₹{bottle.price.toLocaleString()}</span>
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
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-2.5 rounded-lg font-medium text-sm text-center transition-all duration-300 active:scale-95"
                    >
                      Buy
                    </button>
                    <Link
                      to={`/venue/${venueId}/bottle/${bottle.id}`}
                      state={{ bottle, venue }}
                      className="px-4 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-lg font-medium text-sm transition-all duration-300 active:scale-95 flex items-center justify-center"
                    >
                      Info
                    </Link>
                  </div>
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