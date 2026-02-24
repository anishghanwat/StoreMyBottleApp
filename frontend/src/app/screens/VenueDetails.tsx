import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, MapPin, Clock, Mail, Star, TrendingUp, Home, Wine as BottleIcon, User } from "lucide-react";
import { useState, useEffect } from "react";
import { venueService } from "../../services/venue.service";
import { Venue, Bottle } from "../../types/api.types";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export default function VenueDetails() {
    const { venueId } = useParams();
    const navigate = useNavigate();
    const [venue, setVenue] = useState<Venue | null>(null);
    const [popularBottles, setPopularBottles] = useState<Bottle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (venueId) {
            loadVenueDetails();
        }
    }, [venueId]);

    const loadVenueDetails = async () => {
        try {
            setLoading(true);
            const [venueData, bottlesData] = await Promise.all([
                venueService.getVenueById(venueId!),
                venueService.getBottlesByVenue(venueId!),
            ]);
            setVenue(venueData);
            // Get top 6 bottles (simulating popular bottles)
            setPopularBottles(bottlesData.slice(0, 6));
        } catch (err) {
            setError("Failed to load venue details. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-lg shadow-purple-500/20"></div>
                    <p className="text-gray-400 font-medium animate-pulse">Loading venue...</p>
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

    const isOpen = venue.is_open;

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-zinc-800/50">
                <div className="px-6 py-4 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-zinc-800/50 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-semibold">Venue Details</h1>
                </div>
            </div>

            {/* Hero Image */}
            <div className="relative h-64 bg-gradient-to-br from-purple-900/20 to-pink-900/20">
                <ImageWithFallback
                    src={venue.image_url || "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800"}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

                {/* Venue Name Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold mb-2">{venue.name}</h2>
                            <div className="flex items-center gap-2 text-gray-300">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm">{venue.location}</span>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isOpen
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}>
                            {isOpen ? "Open Now" : "Closed"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="px-6 py-6 border-b border-zinc-800/50">
                <Link
                    to={`/venue/${venueId}`}
                    className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-4 rounded-xl font-semibold text-center transition-all duration-300 active:scale-95 shadow-lg shadow-purple-500/25"
                >
                    View Full Menu
                </Link>
            </div>

            {/* Venue Information */}
            <div className="px-6 py-6 space-y-6 border-b border-zinc-800/50">
                <h3 className="text-lg font-semibold">Information</h3>

                <div className="space-y-4">
                    {/* Operating Hours */}
                    <div className="flex items-start gap-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Clock className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-400 mb-1">Operating Hours</p>
                            <p className="text-white">Mon - Sun: 6:00 PM - 2:00 AM</p>
                        </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-start gap-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Star className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-400 mb-1">Rating</p>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <span className="text-white font-medium">4.8</span>
                                <span className="text-gray-400 text-sm">(120 reviews)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Popular Bottles */}
            {popularBottles.length > 0 && (
                <div className="px-6 py-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                            <h3 className="text-lg font-semibold">Popular Bottles</h3>
                        </div>
                        <Link to={`/venue/${venueId}`} className="text-sm text-purple-400 hover:text-purple-300 font-medium">
                            View All
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {popularBottles.map((bottle) => (
                            <div
                                key={bottle.id}
                                className="bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300"
                            >
                                {/* Bottle Image */}
                                <div className="relative h-32 bg-zinc-900/50 flex items-center justify-center p-3">
                                    <ImageWithFallback
                                        src={bottle.image_url || "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"}
                                        alt={bottle.name}
                                        className="w-full h-full object-contain"
                                    />
                                </div>

                                {/* Bottle Info */}
                                <div className="p-3 space-y-2">
                                    <div>
                                        <p className="text-xs text-purple-400 font-medium mb-0.5">{bottle.brand}</p>
                                        <h4 className="text-sm font-semibold leading-tight line-clamp-2">{bottle.name}</h4>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-400">{bottle.volume_ml}ml</span>
                                        <span className="text-lg font-bold text-white">₹{bottle.price.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
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
