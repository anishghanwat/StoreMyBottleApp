import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Search, Wine, Package, CheckCircle, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { venueService } from "../../services/api";

interface Bottle {
    id: string; brand: string; name: string;
    price: number; volume_ml: number;
    image_url: string | null; is_available: boolean;
}

export default function Inventory() {
    const navigate = useNavigate();
    const [bartender, setBartender] = useState<any>(null);
    const [bottles, setBottles] = useState<Bottle[]>([]);
    const [filtered, setFiltered] = useState<Bottle[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [avFilter, setAvFilter] = useState<"all" | "available" | "unavailable">("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("bartender");
        if (!stored) { navigate("/"); return; }
        const user = JSON.parse(stored);
        setBartender(user);
        if (user.venue_id) fetchBottles(user.venue_id);
    }, [navigate]);

    useEffect(() => {
        let f = bottles;
        if (searchQuery) f = f.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.brand.toLowerCase().includes(searchQuery.toLowerCase()));
        if (avFilter === "available") f = f.filter(b => b.is_available);
        else if (avFilter === "unavailable") f = f.filter(b => !b.is_available);
        setFiltered(f);
    }, [searchQuery, avFilter, bottles]);

    const fetchBottles = async (venueId: string) => {
        try { setLoading(true); const data = await venueService.getBottles(venueId); setBottles(data.bottles || []); }
        catch { } finally { setLoading(false); }
    };

    if (!bartender) return null;
    const availCount = bottles.filter(b => b.is_available).length;
    const unavailCount = bottles.filter(b => !b.is_available).length;

    const filters: { label: string; val: typeof avFilter; color: string }[] = [
        { label: `All (${bottles.length})`, val: "all", color: "bg-violet-600 text-white" },
        { label: `Available (${availCount})`, val: "available", color: "bg-emerald-600 text-white" },
        { label: `Unavailable (${unavailCount})`, val: "unavailable", color: "bg-red-600 text-white" },
    ];

    return (
        <div className="min-h-screen bg-[#06060D] text-white flex flex-col">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-[#06060D]/95 backdrop-blur-xl border-b border-white/[0.05] px-5 pt-12 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate("/home")} className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[#6B6B9A]">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <h1 className="font-black text-base">Inventory</h1>
                            <p className="text-xs text-[#6B6B9A]">{bartender.venueName || bartender.venue_name}</p>
                        </div>
                    </div>
                    <span className="chip-cyan">{bottles.length} bottles</span>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A6A]" />
                    <input
                        type="text"
                        placeholder="Search bottles or brands…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="input-bar w-full pl-10 pr-4 py-3 text-sm"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-0.5">
                    {filters.map(f => (
                        <button
                            key={f.val}
                            onClick={() => setAvFilter(f.val)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${avFilter === f.val ? f.color : "bg-white/[0.04] text-[#6B6B9A] border border-white/[0.06]"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-5 py-4">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => <div key={i} className="bar-skeleton h-20 rounded-2xl" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                            <Package className="w-6 h-6 text-[#4A4A6A]" />
                        </div>
                        <p className="text-[#6B6B9A] text-sm">No bottles found</p>
                        <p className="text-[#4A4A6A] text-xs mt-1">Adjust search or filters</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((bottle, i) => (
                            <motion.div
                                key={bottle.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="bar-card p-4 flex gap-4"
                            >
                                {/* Image / icon */}
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600/20 to-violet-900/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {bottle.image_url ? (
                                        <img src={bottle.image_url} alt={bottle.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Wine className="w-6 h-6 text-violet-400" />
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="min-w-0">
                                            <p className="font-black text-sm truncate">{bottle.name}</p>
                                            <p className="text-xs text-[#6B6B9A] truncate">{bottle.brand}</p>
                                        </div>
                                        {bottle.is_available
                                            ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 ml-2" />
                                            : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 ml-2" />
                                        }
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-sm font-black text-[#F5C518]">₹{bottle.price.toLocaleString()}</span>
                                        <span className="text-xs text-[#6B6B9A]">{bottle.volume_ml}ml</span>
                                        <span className={bottle.is_available ? "chip-confirmed" : "chip-rejected"}>
                                            {bottle.is_available ? "Available" : "Unavailable"}
                                        </span>
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
