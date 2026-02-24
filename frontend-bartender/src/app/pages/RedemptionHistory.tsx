import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Search, Filter, Download, Calendar, User, Wine, Clock, CheckCircle, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { redemptionService } from "../../services/api";

interface Redemption {
    id: string;
    user_name: string;
    bottle_name: string;
    bottle_brand: string;
    venue_name: string;
    peg_size_ml: number;
    status: string;
    redeemed_at: string | null;
    created_at: string;
}

export default function RedemptionHistory() {
    const navigate = useNavigate();
    const [bartender, setBartender] = useState<any>(null);
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [filteredRedemptions, setFilteredRedemptions] = useState<Redemption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "redeemed" | "pending" | "expired">("all");
    const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");

    useEffect(() => {
        const stored = localStorage.getItem("bartender");
        if (!stored) {
            navigate("/");
            return;
        }
        const user = JSON.parse(stored);
        setBartender(user);

        if (user.venue_id) {
            fetchRedemptions(user.venue_id);
        }
    }, [navigate]);

    useEffect(() => {
        filterRedemptions();
    }, [searchQuery, statusFilter, dateFilter, redemptions]);

    const fetchRedemptions = async (venueId: string) => {
        try {
            setIsLoading(true);
            // Fetch more redemptions for history (100 instead of 5)
            const data = await redemptionService.getHistory(venueId, 100);
            setRedemptions(data.redemptions || []);
        } catch (error) {
            console.error("Failed to fetch redemptions", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterRedemptions = () => {
        let filtered = redemptions;

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(
                (r) =>
                    r.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.bottle_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.bottle_brand.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter((r) => r.status === statusFilter);
        }

        // Filter by date
        if (dateFilter !== "all") {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

            filtered = filtered.filter((r) => {
                const date = new Date(r.redeemed_at || r.created_at);
                if (dateFilter === "today") return date >= today;
                if (dateFilter === "week") return date >= weekAgo;
                if (dateFilter === "month") return date >= monthAgo;
                return true;
            });
        }

        setFilteredRedemptions(filtered);
    };

    const handleExport = () => {
        // Create CSV content
        const headers = ["Date", "Time", "Customer", "Bottle", "Brand", "Peg Size (ml)", "Status"];
        const rows = filteredRedemptions.map((r) => {
            const date = new Date(r.redeemed_at || r.created_at);
            return [
                date.toLocaleDateString(),
                date.toLocaleTimeString(),
                r.user_name,
                r.bottle_name,
                r.bottle_brand,
                r.peg_size_ml,
                r.status,
            ];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        // Download CSV
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `redemptions-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleBack = () => {
        navigate("/home");
    };

    if (!bartender) return null;

    const stats = {
        total: filteredRedemptions.length,
        redeemed: filteredRedemptions.filter((r) => r.status === "redeemed").length,
        pending: filteredRedemptions.filter((r) => r.status === "pending").length,
        expired: filteredRedemptions.filter((r) => r.status === "expired").length,
    };

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
                                <h1 className="font-semibold text-white">Redemption History</h1>
                                <p className="text-sm text-gray-400">{bartender.venueName || bartender.venue_name}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleExport}
                            className="p-2 rounded-full bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
                        >
                            <Download className="w-5 h-5 text-purple-400" />
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        <div className="text-center p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                            <p className="text-lg font-bold text-white">{stats.total}</p>
                            <p className="text-xs text-gray-400">Total</p>
                        </div>
                        <div className="text-center p-2 rounded-xl bg-green-500/10 border border-green-500/20">
                            <p className="text-lg font-bold text-white">{stats.redeemed}</p>
                            <p className="text-xs text-gray-400">Redeemed</p>
                        </div>
                        <div className="text-center p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <p className="text-lg font-bold text-white">{stats.pending}</p>
                            <p className="text-xs text-gray-400">Pending</p>
                        </div>
                        <div className="text-center p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                            <p className="text-lg font-bold text-white">{stats.expired}</p>
                            <p className="text-xs text-gray-400">Expired</p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search customer, bottle, or brand..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[rgba(17,17,27,0.7)] border border-purple-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                        />
                    </div>

                    {/* Filter Chips */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {/* Status Filters */}
                        <button
                            onClick={() => setStatusFilter("all")}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${statusFilter === "all"
                                    ? "bg-purple-500 text-white"
                                    : "bg-[rgba(17,17,27,0.7)] border border-purple-500/20 text-gray-400"
                                }`}
                        >
                            All Status
                        </button>
                        <button
                            onClick={() => setStatusFilter("redeemed")}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${statusFilter === "redeemed"
                                    ? "bg-green-500 text-white"
                                    : "bg-[rgba(17,17,27,0.7)] border border-green-500/20 text-gray-400"
                                }`}
                        >
                            Redeemed
                        </button>
                        <button
                            onClick={() => setStatusFilter("pending")}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${statusFilter === "pending"
                                    ? "bg-amber-500 text-white"
                                    : "bg-[rgba(17,17,27,0.7)] border border-amber-500/20 text-gray-400"
                                }`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setStatusFilter("expired")}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${statusFilter === "expired"
                                    ? "bg-red-500 text-white"
                                    : "bg-[rgba(17,17,27,0.7)] border border-red-500/20 text-gray-400"
                                }`}
                        >
                            Expired
                        </button>

                        <div className="w-px h-6 bg-purple-500/20 mx-1"></div>

                        {/* Date Filters */}
                        <button
                            onClick={() => setDateFilter("all")}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${dateFilter === "all"
                                    ? "bg-purple-500 text-white"
                                    : "bg-[rgba(17,17,27,0.7)] border border-purple-500/20 text-gray-400"
                                }`}
                        >
                            All Time
                        </button>
                        <button
                            onClick={() => setDateFilter("today")}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${dateFilter === "today"
                                    ? "bg-purple-500 text-white"
                                    : "bg-[rgba(17,17,27,0.7)] border border-purple-500/20 text-gray-400"
                                }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setDateFilter("week")}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${dateFilter === "week"
                                    ? "bg-purple-500 text-white"
                                    : "bg-[rgba(17,17,27,0.7)] border border-purple-500/20 text-gray-400"
                                }`}
                        >
                            This Week
                        </button>
                        <button
                            onClick={() => setDateFilter("month")}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${dateFilter === "month"
                                    ? "bg-purple-500 text-white"
                                    : "bg-[rgba(17,17,27,0.7)] border border-purple-500/20 text-gray-400"
                                }`}
                        >
                            This Month
                        </button>
                    </div>
                </div>
            </div>

            {/* Redemption List */}
            <div className="flex-1 p-6">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="glass-card p-4 rounded-2xl border border-purple-500/20 bg-[rgba(17,17,27,0.5)] animate-pulse"
                            >
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/20"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-purple-500/20 rounded w-3/4"></div>
                                        <div className="h-3 bg-purple-500/10 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredRedemptions.length === 0 ? (
                    <div className="text-center py-12">
                        <Wine className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500">No redemptions found</p>
                        <p className="text-xs text-gray-600 mt-2">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredRedemptions.map((redemption, index) => {
                            const date = new Date(redemption.redeemed_at || redemption.created_at);
                            const isRedeemed = redemption.status === "redeemed";
                            const isPending = redemption.status === "pending";
                            const isExpired = redemption.status === "expired";

                            return (
                                <motion.div
                                    key={redemption.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`glass-card p-4 rounded-2xl border backdrop-blur-xl ${isRedeemed
                                            ? "border-green-500/20 bg-[rgba(0,50,0,0.1)]"
                                            : isPending
                                                ? "border-amber-500/20 bg-[rgba(50,50,0,0.1)]"
                                                : "border-red-500/20 bg-[rgba(50,0,0,0.1)]"
                                        }`}
                                >
                                    <div className="flex gap-4">
                                        {/* Icon */}
                                        <div
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${isRedeemed
                                                    ? "bg-green-500/20"
                                                    : isPending
                                                        ? "bg-amber-500/20"
                                                        : "bg-red-500/20"
                                                }`}
                                        >
                                            {isRedeemed ? (
                                                <CheckCircle className="w-6 h-6 text-green-400" />
                                            ) : isPending ? (
                                                <Clock className="w-6 h-6 text-amber-400" />
                                            ) : (
                                                <XCircle className="w-6 h-6 text-red-400" />
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-white font-semibold text-sm truncate">
                                                        {redemption.user_name}
                                                    </h3>
                                                    <p className="text-gray-400 text-xs truncate">
                                                        {redemption.bottle_brand} {redemption.bottle_name}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${isRedeemed
                                                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                                            : isPending
                                                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                                                        }`}
                                                >
                                                    {redemption.status}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Wine className="w-3 h-3" />
                                                    {redemption.peg_size_ml}ml
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {date.toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
