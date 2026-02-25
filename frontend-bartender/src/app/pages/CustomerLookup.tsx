import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Search, Wine, Package, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

interface Customer {
    id: string; name: string; email: string | null; phone: string | null;
    total_bottles: number; total_spent: number; total_redemptions: number; created_at: string;
}

interface CustomerBottle {
    id: string; bottle_name: string; bottle_brand: string;
    venue_name: string; total_ml: number; remaining_ml: number; image_url: string | null;
}

export default function CustomerLookup() {
    const navigate = useNavigate();
    const [bartender, setBartender] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerBottles, setCustomerBottles] = useState<CustomerBottle[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("bartender");
        if (!stored) { navigate("/"); return; }
        setBartender(JSON.parse(stored));
    }, [navigate]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            toast.error("Please enter a search term");
            return;
        }
        setIsLoading(true);
        try {
            // Placeholder — real implementation would call profileService.searchCustomer
            setSelectedCustomer({
                id: "1", name: searchQuery,
                email: "customer@example.com", phone: "+91 98765 43210",
                total_bottles: 3, total_spent: 15000, total_redemptions: 12,
                created_at: new Date().toISOString(),
            });
            setCustomerBottles([]);
            toast.success("Customer found");
        } catch (err: any) {
            toast.error("Customer not found");
        }
        finally { setIsLoading(false); }
    };

    if (!bartender) return null;

    return (
        <div className="min-h-screen bg-[#06060D] text-white flex flex-col">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-[#06060D]/95 backdrop-blur-xl border-b border-white/[0.05] px-5 pt-12 pb-4 space-y-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate("/home")} className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[#6B6B9A]">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="font-black text-base">Customer Lookup</h1>
                        <p className="text-xs text-[#6B6B9A]">Search by name, phone, or email</p>
                    </div>
                </div>

                {/* Search with inline button */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A6A]" />
                    <input
                        type="text"
                        placeholder="Enter name, phone or email…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSearch()}
                        className="input-bar w-full pl-10 pr-24 py-3 text-sm"
                    />
                    <button
                        onClick={handleSearch}
                        className="absolute right-2 top-1/2 -translate-y-1/2 btn-bar-primary px-4 py-1.5 text-xs"
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-5 py-4">
                {isLoading ? (
                    <div className="text-center py-16">
                        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-[#6B6B9A] text-sm">Searching…</p>
                    </div>
                ) : selectedCustomer ? (
                    <div className="space-y-4">
                        {/* Customer profile card */}
                        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="bar-card p-5">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center text-2xl font-black flex-shrink-0">
                                    {selectedCustomer.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-lg truncate">{selectedCustomer.name}</p>
                                    {selectedCustomer.email && <p className="text-xs text-[#6B6B9A] truncate">{selectedCustomer.email}</p>}
                                    {selectedCustomer.phone && <p className="text-xs text-[#6B6B9A]">{selectedCustomer.phone}</p>}
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: "Bottles", value: selectedCustomer.total_bottles, icon: Package, color: "text-violet-400" },
                                    { label: "Spent", value: `₹${selectedCustomer.total_spent.toLocaleString()}`, icon: TrendingUp, color: "text-[#F5C518]" },
                                    { label: "Redeemed", value: selectedCustomer.total_redemptions, icon: Wine, color: "text-emerald-400" },
                                ].map(s => (
                                    <div key={s.label} className="bar-card p-3 text-center">
                                        <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
                                        <p className={`text-base font-black ${s.label === "Spent" ? "text-[#F5C518]" : ""}`}>{s.value}</p>
                                        <p className="text-[10px] text-[#6B6B9A]">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between text-xs">
                                <span className="text-[#6B6B9A]">Member since</span>
                                <span className="font-semibold">{new Date(selectedCustomer.created_at).toLocaleDateString()}</span>
                            </div>
                        </motion.div>

                        {/* Active bottles */}
                        <div>
                            <p className="text-xs font-bold text-[#6B6B9A] uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Wine className="w-3.5 h-3.5 text-violet-400" /> Active Bottles
                            </p>
                            {customerBottles.length === 0 ? (
                                <div className="bar-card p-8 text-center">
                                    <Package className="w-8 h-8 text-[#4A4A6A] mx-auto mb-3" />
                                    <p className="text-[#6B6B9A] text-sm">No active bottles found</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {customerBottles.map((b, i) => (
                                        <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bar-card p-4 flex gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                                                {b.image_url ? <img src={b.image_url} alt={b.bottle_name} className="w-full h-full object-cover rounded-xl" /> : <Wine className="w-5 h-5 text-violet-400" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-sm truncate">{b.bottle_name}</p>
                                                <p className="text-xs text-[#6B6B9A]">{b.bottle_brand}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs text-[#6B6B9A]">{b.remaining_ml}ml / {b.total_ml}ml</span>
                                                    <div className="flex-1 bar-progress h-1.5">
                                                        <div className="bar-progress-fill h-full" style={{ width: `${(b.remaining_ml / b.total_ml) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                            <Search className="w-7 h-7 text-[#4A4A6A]" />
                        </div>
                        <p className="text-[#6B6B9A] text-sm">Search for a customer</p>
                        <p className="text-[#4A4A6A] text-xs mt-1">Enter name, phone, or email above</p>
                    </div>
                )}
            </div>
        </div>
    );
}
