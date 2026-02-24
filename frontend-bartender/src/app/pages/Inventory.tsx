import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Package, Search, Filter, Wine, DollarSign, CheckCircle, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { venueService } from "../../services/api";

interface Bottle {
    id: string;
    brand: string;
    name: string;
    price: number;
    volume_ml: number;
    image_url: string | null;
    is_available: boolean;
}

export default function Inventory() {
    const navigate = useNavigate();
    const [bartender, setBartender] = useState<any>(null);
    const [bottles, setBottles] = useState<Bottle[]>([]);
    const [filteredBottles, setFilteredBottles] = useState<Bottle[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterAvailable, setFilterAvailable] = useState<"all" | "available" | "unavailable">("all");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("bartender");
        if (!stored) {
            navigate("/");
            return;
        }
        const user = JSON.parse(stored);
        setBartender(user);

        if (user.venue_id) {
            fetchBottles(user.venue_id);
        }
    }, [navigate]);

    useEffect(() => {
        filterBottles();
    }, [searchQuery, filterAvailable, bottles]);

    const fetchBottles = async (venueId: string) => {
        try {
            setIsLoading(true);
            const data = await venueService.getBottles(venueId);
            setBottles(data.bottles || []);
        } catch (error) {
            console.error("Failed to fetch bottles", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterBottles = () => {
        let filtered = bottles;

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(
                (bottle) =>
                    bottle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    bottle.brand.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by availability
        if (filterAvailable === "available") {
            filtered = filtered.filter((bottle) => bottle.is_available);
        } else if (filterAvailable === "unavailable") {
            filtered = filtered.filter((bottle) => !bottle.is_available);
        }

        setFilteredBottles(filtered);
    };

    const handleBack = () => {
        navigate("/home");
    };

    if (!bartender) return null;

    const availableCount = bottles.filter((b) => b.is_available).length;
    const unavailableCount = bottles.filter((b) => !b.is_available).length;

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f]">
            {/* Header */}
            <div className="sticky top-0 z-10 backdrop-blur-xl bg-[rgba(10,10,15,0.8)] border-b border-purple-500/20">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleBack}
                                className="p-2 rounded-full hover:bg-purple-500/10 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-400" />
                            </button>
                            <div>
                                <h1 className="font-semibold text-white">Inventory</h1>
                                <p className="text-sm text-gray-400">{bartender.venueName || bartender.venue_name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-right">
                                <p className="text-xs text-gray-400">Total</p>
                                <p className="text-sm font-semibold text-white">{bottles.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search bottles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[rgba(17,17,27,0.7)] border border-purple-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                        />
                    </div>

                    {/* Filter Chips */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterAvailable("all")}
                            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${filterAvailable === "all"
                                    ? "bg-purple-500 text-white"
                                    : "bg-[rgba(17,17,27,0.7)] border border-purple-500/20 text-gray-400"
                                }`}
                        >
                            All ({bottles.length})
                        </button>
                        <button
                            onClick={() => setFilterAvailable("available")}
                            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${filterAvailable === "available"
                                    ? "bg-green-500 text-white"
                                    : "bg-[rgba(17,17,27,0.7)] border border-green-500/20 text-gray-400"
                                }`}
                        >
                            Available ({availableCount})
                        </button>
                        <button
                            onClick={() => setFilterAvailable("unavailable")}
                            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${filterAvailable === "unavailable"
                                    ? "bg-red-500 text-white"
                                    : "bg-[rgba(17,17,27,0.7)] border border-red-500/20 text-gray-400"
                                }`}
                        >
                            Unavailable ({unavailableCount})
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottle List */}
            <div className="flex-1 p-6">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="glass-card p-4 rounded-2xl border border-purple-500/20 bg-[rgba(17,17,27,0.5)] animate-pulse"
                            >
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-purple-500/20"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-purple-500/20 rounded w-3/4"></div>
                                        <div className="h-3 bg-purple-500/10 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredBottles.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500">No bottles found</p>
                        <p className="text-xs text-gray-600 mt-2">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredBottles.map((bottle, index) => (
                            <motion.div
                                key={bottle.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="glass-card p-4 rounded-2xl border border-purple-500/20 bg-[rgba(17,17,27,0.5)] hover:bg-[rgba(17,17,27,0.7)] transition-all"
                            >
                                <div className="flex gap-4">
                                    {/* Bottle Image */}
                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center overflow-hidden">
                                        {bottle.image_url ? (
                                            <img
                                                src={bottle.image_url}
                                                alt={bottle.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Wine className="w-8 h-8 text-purple-400" />
                                        )}
                                    </div>

                                    {/* Bottle Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-1">
                                            <div>
                                                <h3 className="text-white font-semibold text-sm">{bottle.name}</h3>
                                                <p className="text-gray-400 text-xs">{bottle.brand}</p>
                                            </div>
                                            {bottle.is_available ? (
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-400" />
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="w-3 h-3 text-gray-400" />
                                                <span className="text-sm text-white font-medium">₹{bottle.price.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Wine className="w-3 h-3 text-gray-400" />
                                                <span className="text-sm text-gray-400">{bottle.volume_ml}ml</span>
                                            </div>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs ${bottle.is_available
                                                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                                                    }`}
                                            >
                                                {bottle.is_available ? "Available" : "Unavailable"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
