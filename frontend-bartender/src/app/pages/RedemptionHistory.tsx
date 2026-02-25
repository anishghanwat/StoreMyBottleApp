import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Search, Download, Calendar, Wine, Clock, CheckCircle, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { redemptionService } from "../../services/api";

interface Redemption {
    id: string; user_name: string; bottle_name: string; bottle_brand: string;
    venue_name: string; peg_size_ml: number; status: string;
    redeemed_at: string | null; created_at: string;
}

export default function RedemptionHistory() {
    const navigate = useNavigate();
    const [bartender, setBartender] = useState<any>(null);
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [filtered, setFiltered] = useState<Redemption[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "redeemed" | "pending" | "expired">("all");
    const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");

    useEffect(() => {
        const stored = localStorage.getItem("bartender");
        if (!stored) { navigate("/"); return; }
        const user = JSON.parse(stored);
        setBartender(user);
        if (user.venue_id) fetchRedemptions(user.venue_id);
    }, [navigate]);

    useEffect(() => {
        let f = redemptions;
        if (searchQuery) f = f.filter(r => r.user_name.toLowerCase().includes(searchQuery.toLowerCase()) || r.bottle_name.toLowerCase().includes(searchQuery.toLowerCase()) || r.bottle_brand.toLowerCase().includes(searchQuery.toLowerCase()));
        if (statusFilter !== "all") f = f.filter(r => r.status === statusFilter);
        if (dateFilter !== "all") {
            const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const cutoff = dateFilter === "today" ? today : dateFilter === "week" ? new Date(today.getTime() - 7 * 86400000) : new Date(today.getTime() - 30 * 86400000);
            f = f.filter(r => new Date(r.redeemed_at || r.created_at) >= cutoff);
        }
        setFiltered(f);
    }, [searchQuery, statusFilter, dateFilter, redemptions]);

    const fetchRedemptions = async (venueId: string) => {
        try { setLoading(true); const data = await redemptionService.getHistory(venueId, 100); setRedemptions(data.redemptions || []); }
        catch { } finally { setLoading(false); }
    };

    const handleExport = () => {
        const headers = ["Date", "Time", "Customer", "Bottle", "Brand", "Peg (ml)", "Status"];
        const rows = filtered.map(r => { const d = new Date(r.redeemed_at || r.created_at); return [d.toLocaleDateString(), d.toLocaleTimeString(), r.user_name, r.bottle_name, r.bottle_brand, r.peg_size_ml, r.status]; });
        const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(",")).join("\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        const a = Object.assign(document.createElement("a"), { href: url, download: `redemptions-${new Date().toISOString().split("T")[0]}.csv` });
        a.click(); URL.revokeObjectURL(url);
    };

    if (!bartender) return null;

    const summary = {
        total: filtered.length,
        redeemed: filtered.filter(r => r.status === "redeemed").length,
        pending: filtered.filter(r => r.status === "pending").length,
        expired: filtered.filter(r => r.status === "expired").length,
    };

    const statusFilters = [
        { val: "all" as const, label: "All" },
        { val: "redeemed" as const, label: "Redeemed" },
        { val: "pending" as const, label: "Pending" },
        { val: "expired" as const, label: "Expired" },
    ];
    const dateFilters = [
        { val: "all" as const, label: "All Time" },
        { val: "today" as const, label: "Today" },
        { val: "week" as const, label: "Week" },
        { val: "month" as const, label: "Month" },
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
                            <h1 className="font-black text-base">Redemption History</h1>
                            <p className="text-xs text-[#6B6B9A]">{bartender.venueName || bartender.venue_name}</p>
                        </div>
                    </div>
                    <button onClick={handleExport} className="p-2.5 rounded-xl bg-violet-600/20 border border-violet-500/25 text-violet-400">
                        <Download className="w-4 h-4" />
                    </button>
                </div>

                {/* Summary mini cards */}
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { label: "Total", val: summary.total, cls: "stat-card-violet" },
                        { label: "Done", val: summary.redeemed, cls: "stat-card-emerald" },
                        { label: "Pending", val: summary.pending, cls: "stat-card-amber" },
                        { label: "Expired", val: summary.expired, cls: "" },
                    ].map(s => (
                        <div key={s.label} className={`stat-card ${s.cls} p-2 text-center`}>
                            <p className="text-base font-black">{s.val}</p>
                            <p className="text-[10px] text-[#6B6B9A]">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A6A]" />
                    <input type="text" placeholder="Search customer, bottle…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-bar w-full pl-10 pr-4 py-3 text-sm" />
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-0.5">
                    {statusFilters.map(f => (
                        <button key={f.val} onClick={() => setStatusFilter(f.val)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${statusFilter === f.val ? "bg-violet-600 text-white" : "bg-white/[0.04] text-[#6B6B9A] border border-white/[0.06]"}`}>
                            {f.label}
                        </button>
                    ))}
                    <div className="w-px bg-white/[0.06] mx-1" />
                    {dateFilters.map(f => (
                        <button key={f.val} onClick={() => setDateFilter(f.val)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${dateFilter === f.val ? "bg-violet-600 text-white" : "bg-white/[0.04] text-[#6B6B9A] border border-white/[0.06]"}`}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 px-5 py-4">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => <div key={i} className="bar-skeleton h-20 rounded-2xl" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                            <Wine className="w-6 h-6 text-[#4A4A6A]" />
                        </div>
                        <p className="text-[#6B6B9A] text-sm">No redemptions found</p>
                        <p className="text-[#4A4A6A] text-xs mt-1">Try different filters</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((r, i) => {
                            const date = new Date(r.redeemed_at || r.created_at);
                            const isRedeemed = r.status === "redeemed";
                            const isPending = r.status === "pending";
                            return (
                                <motion.div
                                    key={r.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className={`bar-card p-4 flex gap-4 ${isRedeemed ? "border-l-2 border-l-emerald-500" : isPending ? "border-l-2 border-l-amber-500" : "border-l-2 border-l-red-500 opacity-70"}`}
                                >
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isRedeemed ? "bg-emerald-500/15" : isPending ? "bg-amber-500/15" : "bg-red-500/15"}`}>
                                        {isRedeemed ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : isPending ? <Clock className="w-5 h-5 text-amber-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                            <div className="min-w-0">
                                                <p className="font-black text-sm truncate">{r.user_name}</p>
                                                <p className="text-xs text-[#6B6B9A] truncate">{r.bottle_brand} {r.bottle_name}</p>
                                            </div>
                                            <span className={isRedeemed ? "chip-confirmed ml-2" : isPending ? "chip-pending ml-2" : "chip-rejected ml-2"}>
                                                {r.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-[#4A4A6A]">
                                            <span className="flex items-center gap-1"><Wine className="w-3 h-3" />{r.peg_size_ml}ml</span>
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{date.toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
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
