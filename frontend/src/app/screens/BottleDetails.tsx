import { useParams, Link, useNavigate, useLocation } from "react-router";
import { ArrowLeft, ShoppingCart, Info, Droplet, ChevronDown } from "lucide-react";
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
    const [showHowItWorks, setShowHowItWorks] = useState(() => !localStorage.getItem('smb_purchased'));

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
        <div className="flex flex-col h-screen bg-[#09090F] text-white overflow-hidden">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">

                {/* Hero — full bleed image with overlaid back button, brand, name & price */}
                <div className="relative h-[55vh] min-h-[320px] bg-black overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.45 }}
                        className="absolute inset-0 flex items-center justify-center p-8"
                    >
                        <ImageWithFallback
                            src={bottle.image_url || "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=600"}
                            alt={bottle.name}
                            className="w-full h-full object-contain drop-shadow-2xl"
                        />
                    </motion.div>

                    {/* Bottom gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090F] via-[#09090F]/20 to-transparent" />

                    {/* Back button — top left */}
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-5 left-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>

                    {/* Brand + Name + Price — bottom of image */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="absolute bottom-0 inset-x-0 px-5 pb-5 flex items-end justify-between"
                    >
                        <div className="min-w-0 flex-1 pr-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-400 mb-1">{bottle.brand}</p>
                            <h1 className="text-2xl font-extrabold leading-tight text-white">{bottle.name}</h1>
                        </div>
                        <div className="shrink-0 bg-[#1A1A2A]/90 border border-white/10 rounded-2xl px-4 py-2.5 text-right">
                            <span className="text-xl font-black text-white">₹{Math.round(bottle.price).toLocaleString('en-IN')}</span>
                        </div>
                    </motion.div>
                </div>

                {/* Tag pills */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex items-center gap-2 px-5 pt-4 pb-2 flex-wrap"
                >
                    {bottle.category && (
                        <span className="bg-[#1E1E2E] border border-white/10 text-white/80 text-xs font-medium px-3.5 py-1.5 rounded-full">
                            {bottle.category}
                        </span>
                    )}
                    {bottle.volume_ml && (
                        <span className="bg-[#1E1E2E] border border-white/10 text-white/80 text-xs font-medium px-3.5 py-1.5 rounded-full">
                            {bottle.volume_ml}ml
                        </span>
                    )}
                    <span className={`text-xs font-medium px-3.5 py-1.5 rounded-full border ${bottle.is_available
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                        {bottle.is_available ? "In Stock" : "Out of Stock"}
                    </span>
                </motion.div>

                {/* Description — always shown, fallback if backend doesn't provide one */}
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="px-5 pt-2 pb-4 text-sm text-[#8888AA] leading-relaxed"
                >
                    {bottle.description
                        || `${bottle.brand} ${bottle.name} is a premium spirit offering exceptional quality and taste. Store your bottle with us and enjoy it peg by peg at the venue.`}
                </motion.p>

                {/* Venue Info */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="mx-5 mb-4 card-surface p-4"
                >
                    <p className="text-xs text-[#7171A0] mb-1">Available at</p>
                    <Link to={`/venue/${venue.id}/details`} className="text-base font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                        {venue.name}
                    </Link>
                    <p className="text-sm text-[#7171A0] mt-0.5">{venue.location}</p>
                </motion.div>

                {/* Specifications */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="px-5 mb-4"
                >
                    <div className="grid grid-cols-2 gap-3">
                        <div className="card-surface p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Droplet className="w-4 h-4 text-violet-400" />
                                <p className="text-xs text-[#7171A0]">Volume</p>
                            </div>
                            <p className="text-xl font-bold">
                                {bottle.volume_ml ? `${bottle.volume_ml} ml` : 'N/A'}
                            </p>
                        </div>
                        <div className="card-surface p-4">
                            <p className="text-xs text-[#7171A0] mb-1">Type</p>
                            <p className="text-xl font-bold capitalize">{bottle.category || 'Premium'}</p>
                        </div>
                    </div>
                </motion.div>

                {/* How it works */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="mx-5 mb-5 rounded-2xl border border-violet-500/20 overflow-hidden"
                >
                    <button
                        onClick={() => setShowHowItWorks(v => !v)}
                        className="w-full flex items-center justify-between px-4 py-3.5 bg-gradient-to-br from-violet-900/15 to-fuchsia-900/10"
                    >
                        <span className="text-sm font-semibold">How it works</span>
                        <ChevronDown className={`w-4 h-4 text-violet-400 transition-transform duration-300 ${showHowItWorks ? 'rotate-180' : ''}`} />
                    </button>
                    {showHowItWorks && (
                        <div className="px-4 pb-4 pt-2 bg-gradient-to-br from-violet-900/10 to-fuchsia-900/5">
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
                        </div>
                    )}
                </motion.div>

                {/* Similar Bottles */}
                {similarBottles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
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
                                    <div className="relative h-40 bg-gradient-to-br from-violet-900/10 to-[#1A1A26] flex items-center justify-center p-3">
                                        <ImageWithFallback
                                            src={similarBottle.image_url || "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"}
                                            alt={similarBottle.name}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="p-3 space-y-1">
                                        <p className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider">{similarBottle.brand}</p>
                                        <h4 className="text-sm font-semibold leading-tight line-clamp-2">{similarBottle.name}</h4>
                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-[10px] text-[#7171A0]">{similarBottle.volume_ml ? `${similarBottle.volume_ml}ml` : ''}</span>
                                            <span className="text-base font-black text-white">₹{Math.round(similarBottle.price).toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}

            </div>{/* end scrollable */}

            {/* Purchase Button — pinned to bottom of flex column */}
            <div className="px-5 pb-6 pt-3 bg-gradient-to-t from-[#09090F] via-[#09090F]/95 to-transparent flex-shrink-0">
                <motion.button
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBuyBottle}
                    disabled={!bottle.is_available}
                    className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center transition-all duration-300 ${bottle.is_available
                        ? "bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-lg shadow-fuchsia-500/30"
                        : "bg-[#1A1A26] text-[#4A4A6A] cursor-not-allowed"
                        }`}
                >
                    {bottle.is_available ? "Purchase Bottle" : "Out of Stock"}
                </motion.button>
            </div>
        </div>
    );
}
