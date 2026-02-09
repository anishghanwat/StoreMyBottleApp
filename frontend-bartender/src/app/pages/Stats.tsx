import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Wine } from "lucide-react";
import { venueService } from "../../services/api";

export default function Stats() {
    const navigate = useNavigate();
    const [bartender, setBartender] = useState<any>(null);
    const [stats, setStats] = useState({ served_today: 0, active_bottles: 0 });

    useEffect(() => {
        const stored = localStorage.getItem("bartender");
        if (!stored) {
            navigate("/");
            return;
        }
        const user = JSON.parse(stored);
        setBartender(user);

        // Fetch stats
        if (user.venue_id) {
            venueService.getStats(user.venue_id).then(setStats).catch(console.error);
        }
    }, [navigate]);

    const handleBack = () => {
        navigate("/home");
    };

    if (!bartender) return null;

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f]">
            {/* Header */}
            <div className="sticky top-0 z-10 backdrop-blur-xl bg-[rgba(10,10,15,0.8)] border-b border-purple-500/20">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleBack}
                                className="p-2 rounded-full hover:bg-purple-500/10 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-400" />
                            </button>
                            <div>
                                <h1 className="font-semibold text-white">Dashboard Stats</h1>
                                <p className="text-sm text-gray-400">{bartender.venueName || bartender.venue_name || "Unknown Venue"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-12 max-w-xs mx-auto w-full">
                    <div className="glass-card p-4 rounded-2xl border border-purple-500/20 bg-[rgba(17,17,27,0.5)] flex flex-col items-center justify-center">
                        <p className="text-4xl font-bold text-purple-400 mb-2">{stats.served_today}</p>
                        <p className="text-sm text-gray-400">Served Today</p>
                    </div>
                    <div className="glass-card p-4 rounded-2xl border border-purple-500/20 bg-[rgba(17,17,27,0.5)] flex flex-col items-center justify-center">
                        <p className="text-4xl font-bold text-pink-400 mb-2">{stats.active_bottles}</p>
                        <p className="text-sm text-gray-400">Active Bottles</p>
                    </div>
                </div>

                <div className="text-center text-gray-500 max-w-sm">
                    <Wine className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Statistics update in real-time based on scanning activity.</p>
                </div>
            </div>
        </div>
    );
}
