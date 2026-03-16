import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, Wine as BottleIcon, Search, X, ShoppingCart } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
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

  // Scroll-collapse via direct DOM manipulation (no React re-renders = smooth)
  const collapsibleRef = useRef<HTMLDivElement>(null);
  const isCollapsed = useRef(false);

  useEffect(() => {
    const scrollEl = document.getElementById('root');
    if (!scrollEl) return;
    const onScroll = () => {
      const y = scrollEl.scrollTop;
      if (y > 70 && !isCollapsed.current) {
        isCollapsed.current = true;
        collapsibleRef.current?.classList.add('header-collapsed');
      } else if (y <= 30 && isCollapsed.current) {
        isCollapsed.current = false;
        collapsibleRef.current?.classList.remove('header-collapsed');
      }
    };
    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollEl.removeEventListener('scroll', onScroll);
  }, []);

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

      return matchesSearch && matchesCategory;
    });
  }, [bottles, searchQuery, selectedCategory]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (searchQuery) count++;
    return count;
  }, [selectedCategory, searchQuery]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
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
    <div className="flex flex-col min-h-screen bg-[#09090F] text-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 glass-dark border-b border-white/[0.07]">
        <div className="px-5 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#7171A0]" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold tracking-tight truncate">{venue.name}</h1>
            <p className="text-xs text-[#7171A0]">{venue.location}</p>
          </div>
          <span className="text-xs text-[#7171A0] shrink-0">
            {filteredBottles.length} {filteredBottles.length === 1 ? 'bottle' : 'bottles'}
          </span>
        </div>

        {/* Collapsible: Search + Categories */}
        <div
          ref={collapsibleRef}
          className="collapsible-header"
        >
          <div className="collapsible-header-inner">
            {/* Search Bar */}
            <div className="px-5 pb-3">
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
            <div className="px-5 pb-3 overflow-x-auto no-scrollbar">
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
          </div>
        </div>


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
          <div className="grid grid-cols-2 gap-3">
            {filteredBottles.map((bottle, i) => (
              <motion.div
                key={bottle.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/venue/${venueId}/bottle/${bottle.id}`}
                  state={{ bottle, venue }}
                  className="block bg-[#0E0E18] border border-white/[0.07] rounded-2xl overflow-hidden hover:border-violet-500/30 transition-all duration-200 active:scale-[0.98]"
                >
                  {/* Image */}
                  <div className="h-52 bg-gradient-to-b from-[#1A1A2E] to-[#0A0A14] flex items-center justify-center p-4">
                    <ImageWithFallback
                      src={bottle.image_url || "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"}
                      alt={bottle.name}
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  </div>

                  {/* Footer info */}
                  <div className="px-3 pt-2 pb-3">
                    <h3 className="text-sm font-bold text-white leading-tight line-clamp-1">{bottle.name}</h3>
                    <p className="text-[11px] text-[#5A5A7A] mt-0.5">
                      {bottle.brand}{bottle.volume_ml ? ` · ${bottle.volume_ml}ml` : ''}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-base font-black text-fuchsia-400">
                        ₹{Math.round(bottle.price).toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const isAuthenticated = localStorage.getItem('access_token');
                          if (isAuthenticated) {
                            navigate('/payment', { state: { bottle, venue } });
                          } else {
                            navigate('/login', { state: { bottle, venue } });
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-violet-600/80 hover:bg-violet-600 flex items-center justify-center transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>

            ))}
          </div>
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