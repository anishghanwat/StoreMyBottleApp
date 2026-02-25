import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, MapPin, Clock, Star, TrendingUp, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { venueService } from "../../services/venue.service";
import { Venue, Bottle } from "../../types/api.types";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { motion } from "motion/react";
import { BottomNav } from "../components/ui/BottomNav";

export default function VenueDetails() {
    const { venueId } = useParams();
    const navigate = useNavigate();
    const [venue, setVenue] = useState<Venue | null>(null);
    const [popularBottles, setPopularBottles] = useState<Bottle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { if (venueId) loadVenueDetails(); }, [venueId]);

    const loadVenueDetails = async () => {
        try {
            setLoading(true);
            const [venueData, bottlesData] = await Promise.all([
                venueService.getVenueById(venueId!),
                venueService.getBottlesByVenue(venueId!),
            ]);
            setVenue(venueData);
            setPopularBottles(bottlesData.slice(0, 6));
        } catch {
            setError("Failed to load venue details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#09090F] flex items-center justify-center">
            <div className="w-12 h-12 border-[3px] border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error || !venue) return (
        <div className="min-h-screen bg-[#09090F] text-white flex items-center justify-center px-6">
            <div className="text-center">
                <p className="text-red-400 mb-4 text-sm">{error || "Venue not found"}</p>
                <Link to="/" className="btn-primary px-6 py-3 rounded-2xl text-sm font-bold text-white inline-block">Back</Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#09090F] text-white pb-24">
            {/* Hero Image */}
            <div className="relative h-64">
                <ImageWithFallback
                    src={venue.image_url || "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800"}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090F] via-[#09090F]/60 to-transparent" />

                {/* Back button on hero */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-12 left-4 p-2.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10"
                >
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>

                {/* Open badge */}
                <div className="absolute top-12 right-4">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border ${venue.is_open
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                        : "bg-black/40 border-white/10 text-[#7171A0]"
                        }`}>
                        {venue.is_open && <span className="open-dot" />}
                        {venue.is_open ? "Open Now" : "Closed"}
                    </div>
                </div>

                {/* Venue name overlay */}
                <div className="absolute bottom-0 inset-x-0 px-5 pb-5">
                    <h1 className="text-3xl font-black tracking-tight mb-1">{venue.name}</h1>
                    <div className="flex items-center gap-1.5 text-[#7171A0]">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-sm">{venue.location}</span>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="px-5 py-5 border-b border-white/[0.06]">
                <Link
                    to={`/venue/${venueId}/bottles`}
                    className="btn-primary flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-base text-white"
                >
                    View Full Bottle Menu
                    <ChevronRight className="w-5 h-5" />
                </Link>
            </div>

            {/* Info row */}
            <div className="px-5 py-5 grid grid-cols-2 gap-3 border-b border-white/[0.06]">
                <div className="card-surface p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                        <p className="text-[10px] text-[#4A4A6A]">Hours</p>
                        <p className="text-xs font-semibold">6 PM – 2 AM</p>
                    </div>
                </div>
                <div className="card-surface p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </div>
                    <div>
                        <p className="text-[10px] text-[#4A4A6A]">Rating</p>
                        <p className="text-xs font-semibold">4.8 · 120 reviews</p>
                    </div>
                </div>
            </div>

            {/* Popular Bottles */}
            {popularBottles.length > 0 && (
                <div className="px-5 py-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-violet-400" />
                            <h2 className="font-bold text-base">Popular Bottles</h2>
                        </div>
                        <Link to={`/venue/${venueId}/bottles`} className="text-xs text-violet-400 font-semibold">
                            View All →
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {popularBottles.map((bottle, i) => (
                            <motion.div
                                key={bottle.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="card-surface overflow-hidden hover:border-violet-500/30 transition-all duration-300 group"
                            >
                                <div className="h-28 bg-[#1A1A26] flex items-center justify-center p-3 relative overflow-hidden">
                                    <ImageWithFallback
                                        src={bottle.image_url || "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"}
                                        alt={bottle.name}
                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <div className="p-3 space-y-1">
                                    <p className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider">{bottle.brand}</p>
                                    <h4 className="text-sm font-bold leading-tight line-clamp-1">{bottle.name}</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-[#7171A0]">{bottle.volume_ml} ml</span>
                                        <span className="font-black text-base text-gold">₹{bottle.price.toLocaleString()}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bottom Nav */}
            <BottomNav active="home" />
        </div>
    );
}
