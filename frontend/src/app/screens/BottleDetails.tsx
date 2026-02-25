import { useParams, Link, useNavigate, useLocation } from "react-router";
import { ArrowLeft, ShoppingCart, Info, Droplet } from "lucide-react";
import { useState, useEffect } from "react";
import { venueService } from "../../services/venue.service";
import { Bottle, Venue } from "../../types/api.types";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { motion } from "motion/react";
import { BottomNav } from "../components/ui/BottomNav";

export default function BottleDetails() {
    const { venueId, bottleId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [bottle, setBottle] = useState<Bottle | null>(location.state?.bottle || null);
    const [venue, setVenue] = useState<Venue | null>(location.state?.venue || null);
    const [similarBottles, setSimilarBottles] = useState<Bottle[]>([]);
    const [loading, setLoading] = useState(!bottle || !venue);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (venueId && bottleId) {
            loadBottleDetails();
        }
    }, [venueId, bottleId]);

    const loadBottleDetails = async () => {
        try {
            setLoading(true);

            if (!venue && venueId) {
                const venueData = await venueService.getVenueById(venueId);
                setVenue(venueData);
            }

            if (venueId) {
                const bottlesData = await venueService.getBottlesByVenue(venueId);

                if (!bottle && bottleId) {
                    const foundBottle = bottlesData.find(b => b.id === bottleId);
                    if (foundBottle) {
                        setBottle(foundBottle);
                        const similar = bottlesData
                            .filter(b =>
                                b.id !== bottleId &&
                                (b.brand === foundBottle.brand ||
                                    Math.abs(b.price - foundBottle.price) < foundBottle.price * 0.3)
                            )
                            .slice(0, 4);
                        setSimilarBottles(similar);
                    } else {
                        setError("Bottle not found");
                    }
                } else if (bottle) {
                    const similar = bottlesData
                        .filter(b =>
                            b.id !== bottle.id &&
                            (b.brand === bottle.brand ||
                                Math.abs(b.price - bottle.price) < bottle.price * 0.3)
                        )
                        .slice(0, 4);
                    setSimilarBottles(similar);
                }
            }
        } catch (err) {
            setError("Failed to load bottle details. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleBuyBottle = () => {
        const isAuthenticated = localStorage.getItem('access_token');
        if (isAuthenticated) {
            navigate('/payment', { state: { bottle, venue } });
        } else {
            navigate('/login', { state: { bottle, venue } });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090F] text-white flex flex-col items-center justify-center gap-4">
                <div className="w-14 h-14 border-[3px] border-violet-600 border-t-transparent rounded-full animate-spin shadow-lg shadow-violet-500/20" />
                <p className="text-[#7171A0] text-sm font-medium animate-pulse">Loading bottle...</p>
            </div>
        );
    }

    if (error || !bottle || !venue) {
        return (
            <div className="min-h-screen bg-[#09090F] text-white flex items-center justify-center px-6">
                <div className="text-center">
                    <p className="text-red-400 mb-4 text-sm">{error || "Bottle not found"}</p>
                    <Link to={`/venue/${venueId}`} className="btn-primary px-6 py-3 rounded-2xl text-sm font-bold text-white inline-block">
                        Back to Menu
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090F] text-white pb-24 relative overflow-hidden">
            {/* Ambient orbs */}
            <div className="absolute top-[-60px] right-[-60px] w-48 h-48 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
            <div className="absolute top-[40%] left-[-80px] w-56 h-56 rounded-full bg-fuchsia-600/10 blur-3xl pointer-events-none" />

            {/* Sticky Header */}
            <div className="sticky top-0 z-10 glass-dark border-b border-white/[0.07]">
                <div className="px-5 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#7171A0]" />
                    </button>
                    <h1 className="text-base font-semibold tracking-tight">Bottle Details</h1>
                </div>
            </div>

            {/* Hero Image */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="relative h-72 bg-gradient-to-br from-violet-900/20 via-[#111118] to-fuchsia-900/15 flex items-center justify-center p-8"
            >
                <ImageWithFallback
                    src={bottle.image_url || "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=600"}
                    alt={bottle.name}
                    className="w-full h-full object-contain drop-shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090F] via-transparent to-transparent" />
            </motion.div>

            {/* Bottle Info */}
            <div className="px-5 py-5 space-y-5">
                {/* Brand & Name */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <p className="text-[11px] text-violet-400 font-semibold uppercase tracking-wider mb-1">{bottle.brand}</p>
                    <h2 className="text-3xl font-bold tracking-tight mb-3">{bottle.name}</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-4xl font-black text-gold">₹{bottle.price.toLocaleString()}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bottle.is_available
                            ? "bg-green-500/15 text-green-400 border border-green-500/30"
                            : "bg-red-500/15 text-red-400 border border-red-500/30"
                            }`}>
                            {bottle.is_available ? "In Stock" : "Out of Stock"}
                        </span>
                    </div>
                </motion.div>

                {/* Venue Info */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="card-surface p-4"
                >
                    <p className="text-xs text-[#7171A0] mb-1">Available at</p>
                    <Link to={`/venue/${venue.id}/details`} className="text-lg font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                        {venue.name}
                    </Link>
                    <p className="text-sm text-[#7171A0] mt-0.5">{venue.location}</p>
                </motion.div>

                {/* Specifications */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-violet-400" />
                        <h3 className="text-base font-semibold">Specifications</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="card-surface p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Droplet className="w-4 h-4 text-violet-400" />
                                <p className="text-xs text-[#7171A0]">Volume</p>
                            </div>
                            <p className="text-xl font-bold">{bottle.volume_ml}ml</p>
                        </div>
                        <div className="card-surface p-4">
                            <p className="text-xs text-[#7171A0] mb-1">Type</p>
                            <p className="text-xl font-bold">Premium</p>
                        </div>
                    </div>
                </motion.div>

                {/* Description */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <h3 className="text-base font-semibold mb-2">About this bottle</h3>
                    <p className="text-[#7171A0] text-sm leading-relaxed">
                        {bottle.brand} {bottle.name} is a premium spirit offering exceptional quality and taste.
                        Perfect for those who appreciate fine beverages. Store your bottle with us and enjoy
                        it peg by peg at your convenience.
                    </p>
                </motion.div>

                {/* How it Works */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-gradient-to-br from-violet-900/15 to-fuchsia-900/10 rounded-2xl border border-violet-500/20"
                >
                    <h3 className="text-base font-semibold mb-3">How it works</h3>
                    <ol className="space-y-3 text-sm">
                        {[
                            "Purchase the bottle and we'll store it safely for you",
                            "Visit the venue anytime and order a peg",
                            "Show your QR code to redeem your drink",
                        ].map((step, i) => (
                            <li key={i} className="flex gap-3 items-start">
                                <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center text-xs font-bold">
                                    {i + 1}
                                </span>
                                <span className="text-[#7171A0] leading-relaxed">{step}</span>
                            </li>
                        ))}
                    </ol>
                </motion.div>

                {/* Buy Button */}
                <motion.button
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBuyBottle}
                    disabled={!bottle.is_available}
                    className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 ${bottle.is_available
                        ? "btn-primary text-white"
                        : "bg-[#1A1A26] text-[#4A4A6A] cursor-not-allowed"
                        }`}
                >
                    <ShoppingCart className="w-5 h-5" />
                    {bottle.is_available ? "Buy This Bottle" : "Out of Stock"}
                </motion.button>
            </div>

            {/* Similar Bottles */}
            {similarBottles.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="px-5 py-5 border-t border-white/[0.06]"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold">Similar Bottles</h3>
                        <Link to={`/venue/${venueId}`} className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                            View All
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {similarBottles.map((similarBottle) => (
                            <Link
                                key={similarBottle.id}
                                to={`/venue/${venueId}/bottle/${similarBottle.id}`}
                                state={{ bottle: similarBottle, venue }}
                                className="card-surface overflow-hidden hover:border-violet-500/30 transition-all duration-300 active:scale-95"
                            >
                                {/* Bottle Image */}
                                <div className="relative h-28 bg-gradient-to-br from-violet-900/10 to-[#1A1A26] flex items-center justify-center p-3">
                                    <ImageWithFallback
                                        src={similarBottle.image_url || "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"}
                                        alt={similarBottle.name}
                                        className="w-full h-full object-contain"
                                    />
                                </div>

                                {/* Bottle Info */}
                                <div className="p-3 space-y-1">
                                    <p className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider">{similarBottle.brand}</p>
                                    <h4 className="text-sm font-semibold leading-tight line-clamp-2">{similarBottle.name}</h4>
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-[10px] text-[#7171A0]">{similarBottle.volume_ml}ml</span>
                                        <span className="text-base font-black text-white">₹{similarBottle.price.toLocaleString()}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Bottom Navigation */}
            <BottomNav active="home" />
        </div>
    );
}
