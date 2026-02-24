import { useParams, Link, useNavigate, useLocation } from "react-router";
import { ArrowLeft, Home, Wine as BottleIcon, User, ShoppingCart, Info, Droplet } from "lucide-react";
import { useState, useEffect } from "react";
import { venueService } from "../../services/venue.service";
import { Bottle, Venue } from "../../types/api.types";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

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

            // Load venue if not provided
            if (!venue && venueId) {
                const venueData = await venueService.getVenueById(venueId);
                setVenue(venueData);
            }

            // Load all bottles to find the specific one and similar ones
            if (venueId) {
                const bottlesData = await venueService.getBottlesByVenue(venueId);

                // Find the specific bottle
                if (!bottle && bottleId) {
                    const foundBottle = bottlesData.find(b => b.id === bottleId);
                    if (foundBottle) {
                        setBottle(foundBottle);

                        // Find similar bottles (same brand or similar price range)
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
                    // Find similar bottles
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
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-lg shadow-purple-500/20"></div>
                    <p className="text-gray-400 font-medium animate-pulse">Loading bottle...</p>
                </div>
            </div>
        );
    }

    if (error || !bottle || !venue) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error || "Bottle not found"}</p>
                    <Link to={`/venue/${venueId}`} className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors inline-block">
                        Back to Menu
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
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-zinc-800/50 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-semibold">Bottle Details</h1>
                </div>
            </div>

            {/* Bottle Image */}
            <div className="relative h-80 bg-gradient-to-br from-purple-900/20 to-pink-900/20 flex items-center justify-center p-8">
                <ImageWithFallback
                    src={bottle.image_url || "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=600"}
                    alt={bottle.name}
                    className="w-full h-full object-contain drop-shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
            </div>

            {/* Bottle Info */}
            <div className="px-6 py-6 space-y-6">
                {/* Brand & Name */}
                <div>
                    <p className="text-sm text-purple-400 font-medium mb-1">{bottle.brand}</p>
                    <h2 className="text-3xl font-bold mb-2">{bottle.name}</h2>
                    <div className="flex items-center gap-4">
                        <span className="text-4xl font-bold text-white">₹{bottle.price.toLocaleString()}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bottle.is_available
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}>
                            {bottle.is_available ? "In Stock" : "Out of Stock"}
                        </span>
                    </div>
                </div>

                {/* Venue Info */}
                <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                    <p className="text-sm text-gray-400 mb-1">Available at</p>
                    <Link to={`/venue/${venue.id}/details`} className="text-lg font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                        {venue.name}
                    </Link>
                    <p className="text-sm text-gray-400 mt-1">{venue.location}</p>
                </div>

                {/* Specifications */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Info className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-semibold">Specifications</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                            <div className="flex items-center gap-2 mb-1">
                                <Droplet className="w-4 h-4 text-purple-400" />
                                <p className="text-sm text-gray-400">Volume</p>
                            </div>
                            <p className="text-xl font-bold">{bottle.volume_ml}ml</p>
                        </div>

                        <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                            <p className="text-sm text-gray-400 mb-1">Type</p>
                            <p className="text-xl font-bold">Premium</p>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <h3 className="text-lg font-semibold mb-3">About this bottle</h3>
                    <p className="text-gray-400 leading-relaxed">
                        {bottle.brand} {bottle.name} is a premium spirit offering exceptional quality and taste.
                        Perfect for those who appreciate fine beverages. Store your bottle with us and enjoy
                        it peg by peg at your convenience.
                    </p>
                </div>

                {/* How it Works */}
                <div className="p-4 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-500/30">
                    <h3 className="text-lg font-semibold mb-3">How it works</h3>
                    <ol className="space-y-2 text-sm text-gray-300">
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                            <span>Purchase the bottle and we'll store it safely for you</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                            <span>Visit the venue anytime and order a peg</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                            <span>Show your QR code to redeem your drink</span>
                        </li>
                    </ol>
                </div>

                {/* Buy Button */}
                <button
                    onClick={handleBuyBottle}
                    disabled={!bottle.is_available}
                    className={`w-full py-4 rounded-xl font-semibold text-center transition-all duration-300 flex items-center justify-center gap-2 ${bottle.is_available
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white active:scale-95 shadow-lg shadow-purple-500/25"
                            : "bg-zinc-800 text-gray-500 cursor-not-allowed"
                        }`}
                >
                    <ShoppingCart className="w-5 h-5" />
                    {bottle.is_available ? "Buy This Bottle" : "Out of Stock"}
                </button>
            </div>

            {/* Similar Bottles */}
            {similarBottles.length > 0 && (
                <div className="px-6 py-6 border-t border-zinc-800/50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Similar Bottles</h3>
                        <Link to={`/venue/${venueId}`} className="text-sm text-purple-400 hover:text-purple-300 font-medium">
                            View All
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {similarBottles.map((similarBottle) => (
                            <Link
                                key={similarBottle.id}
                                to={`/venue/${venueId}/bottle/${similarBottle.id}`}
                                state={{ bottle: similarBottle, venue }}
                                className="bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300"
                            >
                                {/* Bottle Image */}
                                <div className="relative h-32 bg-zinc-900/50 flex items-center justify-center p-3">
                                    <ImageWithFallback
                                        src={similarBottle.image_url || "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"}
                                        alt={similarBottle.name}
                                        className="w-full h-full object-contain"
                                    />
                                </div>

                                {/* Bottle Info */}
                                <div className="p-3 space-y-2">
                                    <div>
                                        <p className="text-xs text-purple-400 font-medium mb-0.5">{similarBottle.brand}</p>
                                        <h4 className="text-sm font-semibold leading-tight line-clamp-2">{similarBottle.name}</h4>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-400">{similarBottle.volume_ml}ml</span>
                                        <span className="text-lg font-bold text-white">₹{similarBottle.price.toLocaleString()}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/50 px-6 py-4">
                <div className="flex items-center justify-around max-w-md mx-auto">
                    <Link to="/" className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
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
