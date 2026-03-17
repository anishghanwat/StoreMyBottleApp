import { ArrowLeft, Wine, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { redemptionService } from "../../services/redemption.service";
import { RedemptionHistoryItem } from "../../types/api.types";
import { parseApiError } from "../../utils/parseApiError";
import { toast } from "sonner";
import { motion } from "motion/react";

function StatusIcon({ status }: { status: RedemptionHistoryItem["status"] }) {
    if (status === "redeemed") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (status === "expired") return <XCircle className="w-4 h-4 text-red-400/60" />;
    return <Clock className="w-4 h-4 text-amber-400" />;
}

function StatusChip({ status }: { status: RedemptionHistoryItem["status"] }) {
    if (status === "redeemed") return <span className="chip chip-green text-[10px]">Redeemed</span>;
    if (status === "expired") return <span className="chip chip-inactive text-[10px]">Expired</span>;
    return <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-semibold">Pending</span>;
}

export default function RedemptionHistory() {
    const navigate = useNavigate();
    const [items, setItems] = useState<RedemptionHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        redemptionService.getRedemptionHistory()
            .then(setItems)
            .catch((err) => toast.error(parseApiError(err, "Failed to load redemption history")))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-[#09090F] text-white">
            {/* Header */}
            <div className="px-5 pt-12 pb-4 flex items-center sticky top-0 bg-[#09090F]/90 backdrop-blur-sm z-10">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-[#7171A0]" />
                </button>
                <h1 className="text-lg font-bold ml-2">Redemption History</h1>
            </div>

            <div className="px-5 pb-16">
                {loading ? (
                    <div className="space-y-3 mt-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 rounded-full bg-[#111118] border border-white/[0.07] flex items-center justify-center mb-5">
                            <Wine className="w-10 h-10 text-[#2A2A3A]" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">No redemptions yet</h3>
                        <p className="text-[#7171A0] text-sm max-w-xs">Your peg redemptions will appear here once you start redeeming.</p>
                    </div>
                ) : (
                    <div className="space-y-3 mt-2">
                        {items.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="card-surface p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="w-9 h-9 bg-[#1A1A26] rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <StatusIcon status={item.status} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] text-violet-400 font-semibold uppercase tracking-wider mb-0.5">{item.bottle_brand}</p>
                                            <p className="font-semibold text-sm truncate">{item.bottle_name}</p>
                                            <p className="text-xs text-[#7171A0] truncate">{item.venue_name}</p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-xs text-[#4A4A6A]">{item.peg_size_ml} ml</span>
                                                <span className="text-[#2A2A3A]">·</span>
                                                <span className="text-xs text-[#4A4A6A]">
                                                    {item.redeemed_at
                                                        ? new Date(item.redeemed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                                        : new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <StatusChip status={item.status} />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
