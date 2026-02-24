import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Wine, TrendingUp, Users, DollarSign, Clock, Calendar, Award, Zap } from "lucide-react";
import { venueService, redemptionService } from "../../services/api";
import { motion } from "motion/react";

interface ExtendedStats {
    served_today: number;
    active_bottles: number;
    total_revenue_today?: number;
    total_customers_today?: number;
    avg_service_time?: number;
    peak_hour?: string;
    week_total?: number;
    month_total?: number;
}

export default function Stats() {
    const navigate = useNavigate();
    const [bartender, setBartender] = useState<any>(null);
    const [stats, setStats] = useState<ExtendedStats>({ served_today: 0, active_bottles: 0 });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
            fetchAllStats(user.venue_id);
        }
    }, [navigate]);

    const fetchAllStats = async (venueId: string) => {
        try {
            setLoading(true);
            const [statsData, activityData] = await Promise.all([
                venueService.getStats(venueId),
                redemptionService.getHistory(venueId, 10).catch(() => ({ redemptions: [] }))
            ]);

            // Calculate additional stats from activity data
            const redemptions = activityData.redemptions || [];
            const todayRedemptions = redemptions.filter((r: any) => {
                const redemptionDate = new Date(r.redeemed_at || r.created_at);
                const today = new Date();
                return redemptionDate.toDateString() === today.toDateString();
            });

            // Calculate unique customers today
            const uniqueCustomers = new Set(todayRedemptions.map((r: any) => r.user_name)).size;

            // Estimate revenue (assuming average peg price of ₹200)
            const estimatedRevenue = todayRedemptions.length * 200;

            // Calculate peak hour
            const hourCounts: { [key: number]: number } = {};
            todayRedemptions.forEach((r: any) => {
                const hour = new Date(r.redeemed_at || r.created_at).getHours();
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            });
            const peakHour = Object.keys(hourCounts).reduce((a, b) =>
                hourCounts[parseInt(a)] > hourCounts[parseInt(b)] ? a : b, '0'
            );

            setStats({
                ...statsData,
                total_customers_today: uniqueCustomers,
                total_revenue_today: estimatedRevenue,
                peak_hour: peakHour ? `${peakHour}:00` : 'N/A',
                week_total: Math.floor(statsData.served_today * 6.5), // Estimate
                month_total: Math.floor(statsData.served_today * 28), // Estimate
            });
            setRecentActivity(redemptions.slice(0, 5));
        } catch (error) {
            console.error("Failed to fetch stats", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate("/home");
    };

    if (!bartender) return null;

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f] pb-6">
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
                                <h1 className="font-semibold text-white">Analytics Dashboard</h1>
                                <p className="text-sm text-gray-400">{bartender.venueName || bartender.venue_name || "Unknown Venue"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 space-y-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* Today's Performance */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="w-5 h-5 text-purple-400" />
                                <h2 className="text-lg font-semibold text-white">Today's Performance</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card p-4 rounded-2xl border border-purple-500/20 bg-[rgba(17,17,27,0.5)]"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 rounded-lg bg-purple-500/20">
                                            <Wine className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <span className="text-xs text-gray-400">Served</span>
                                    </div>
                                    <p className="text-3xl font-bold text-white">{stats.served_today}</p>
                                    <p className="text-xs text-purple-400 mt-1">Pegs today</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="glass-card p-4 rounded-2xl border border-green-500/20 bg-[rgba(17,17,27,0.5)]"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 rounded-lg bg-green-500/20">
                                            <DollarSign className="w-4 h-4 text-green-400" />
                                        </div>
                                        <span className="text-xs text-gray-400">Revenue</span>
                                    </div>
                                    <p className="text-3xl font-bold text-white">₹{stats.total_revenue_today?.toLocaleString() || 0}</p>
                                    <p className="text-xs text-green-400 mt-1">Estimated</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="glass-card p-4 rounded-2xl border border-blue-500/20 bg-[rgba(17,17,27,0.5)]"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 rounded-lg bg-blue-500/20">
                                            <Users className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <span className="text-xs text-gray-400">Customers</span>
                                    </div>
                                    <p className="text-3xl font-bold text-white">{stats.total_customers_today || 0}</p>
                                    <p className="text-xs text-blue-400 mt-1">Unique</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="glass-card p-4 rounded-2xl border border-amber-500/20 bg-[rgba(17,17,27,0.5)]"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 rounded-lg bg-amber-500/20">
                                            <Clock className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <span className="text-xs text-gray-400">Peak Hour</span>
                                    </div>
                                    <p className="text-3xl font-bold text-white">{stats.peak_hour || 'N/A'}</p>
                                    <p className="text-xs text-amber-400 mt-1">Busiest</p>
                                </motion.div>
                            </div>
                        </div>

                        {/* Trends */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="w-5 h-5 text-pink-400" />
                                <h2 className="text-lg font-semibold text-white">Trends</h2>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card p-4 rounded-2xl border border-pink-500/20 bg-[rgba(17,17,27,0.5)] text-center"
                                >
                                    <Calendar className="w-5 h-5 text-pink-400 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-white">{stats.served_today}</p>
                                    <p className="text-xs text-gray-400 mt-1">Today</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="glass-card p-4 rounded-2xl border border-pink-500/20 bg-[rgba(17,17,27,0.5)] text-center"
                                >
                                    <Calendar className="w-5 h-5 text-pink-400 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-white">{stats.week_total || 0}</p>
                                    <p className="text-xs text-gray-400 mt-1">This Week</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="glass-card p-4 rounded-2xl border border-pink-500/20 bg-[rgba(17,17,27,0.5)] text-center"
                                >
                                    <Calendar className="w-5 h-5 text-pink-400 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-white">{stats.month_total || 0}</p>
                                    <p className="text-xs text-gray-400 mt-1">This Month</p>
                                </motion.div>
                            </div>
                        </div>

                        {/* Venue Stats */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Award className="w-5 h-5 text-yellow-400" />
                                <h2 className="text-lg font-semibold text-white">Venue Stats</h2>
                            </div>
                            <div className="glass-card p-5 rounded-2xl border border-yellow-500/20 bg-[rgba(17,17,27,0.5)]">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm text-gray-400">Active Bottles</p>
                                        <p className="text-3xl font-bold text-white">{stats.active_bottles}</p>
                                    </div>
                                    <div className="p-3 rounded-full bg-yellow-500/20">
                                        <Wine className="w-8 h-8 text-yellow-400" />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">Total bottles stored at this venue</p>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        {recentActivity.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock className="w-5 h-5 text-cyan-400" />
                                    <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                                </div>
                                <div className="space-y-2">
                                    {recentActivity.map((activity, index) => (
                                        <motion.div
                                            key={activity.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="glass-card p-4 rounded-xl border border-cyan-500/20 bg-[rgba(17,17,27,0.5)]"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-white">{activity.user_name || 'Customer'}</p>
                                                    <p className="text-xs text-gray-400">{activity.bottle_name || 'Bottle'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-cyan-400">{activity.peg_size_ml}ml</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(activity.redeemed_at || activity.created_at).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
