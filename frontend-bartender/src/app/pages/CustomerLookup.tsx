import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Search, User, Wine, Package, Clock, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { profileService } from "../../services/api";

interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    total_bottles: number;
    total_spent: number;
    total_redemptions: number;
    created_at: string;
}

interface CustomerBottle {
    id: string;
    bottle_name: string;
    bottle_brand: string;
    venue_name: string;
    total_ml: number;
    remaining_ml: number;
    image_url: string | null;
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
        if (!stored) {
            navigate("/");
            return;
        }
        const user = JSON.parse(stored);
        setBartender(user);
    }, [navigate]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        try {
            // In a real app, you'd search for customers by name/phone/email
            // For now, we'll show a placeholder
            // const customer = await profileService.searchCustomer(searchQuery);
            // setSelectedCustomer(customer);

            // Placeholder data
            setSelectedCustomer({
                id: "1",
                name: searchQuery,
                email: "customer@example.com",
                phone: "+91 98765 43210",
                total_bottles: 3,
                total_spent: 15000,
                total_redemptions: 12,
                created_at: new Date().toISOString(),
            });
        } catch (error) {
            console.error("Failed to search customer", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        navigate("/home");
    };

    if (!bartender) return null;

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f]">
            {/* Header */}
            <div className="sticky top-0 z-10 backdrop-blur-xl bg-[rgba(10,10,15,0.8)] border-b border-purple-500/20">
                <div className="px-6 py-4">
                    <div className="flex items-center gap-3 mb-4">
                        <button
                            onClick={handleBack}
                            className="p-2 rounded-full hover:bg-purple-500/10 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </button>
                        <div>
                            <h1 className="font-semibold text-white">Customer Lookup</h1>
                            <p className="text-sm text-gray-400">Search by name, phone, or email</p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Enter customer name, phone, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[rgba(17,17,27,0.7)] border border-purple-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                        />
                        <button
                            onClick={handleSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium"
                        >
                            Search
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-gray-400">Searching...</p>
                    </div>
                ) : selectedCustomer ? (
                    <div className="space-y-4">
                        {/* Customer Profile Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-6 rounded-3xl border border-purple-500/20 bg-[rgba(17,17,27,0.5)]"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                    <User className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{selectedCustomer.name}</h2>
                                    <p className="text-sm text-gray-400">{selectedCustomer.email}</p>
                                    <p className="text-sm text-gray-400">{selectedCustomer.phone}</p>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                    <Package className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                                    <p className="text-lg font-bold text-white">{selectedCustomer.total_bottles}</p>
                                    <p className="text-xs text-gray-400">Bottles</p>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                                    <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
                                    <p className="text-lg font-bold text-white">₹{selectedCustomer.total_spent.toLocaleString()}</p>
                                    <p className="text-xs text-gray-400">Spent</p>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-pink-500/10 border border-pink-500/20">
                                    <Wine className="w-5 h-5 text-pink-400 mx-auto mb-1" />
                                    <p className="text-lg font-bold text-white">{selectedCustomer.total_redemptions}</p>
                                    <p className="text-xs text-gray-400">Redeemed</p>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-purple-500/10">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Member since</span>
                                    <span className="text-white">
                                        {new Date(selectedCustomer.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Active Bottles */}
                        <div>
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <Wine className="w-4 h-4 text-purple-400" />
                                Active Bottles
                            </h3>

                            {customerBottles.length === 0 ? (
                                <div className="glass-card p-6 rounded-2xl border border-purple-500/20 bg-[rgba(17,17,27,0.5)] text-center">
                                    <Package className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">No active bottles</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {customerBottles.map((bottle, index) => (
                                        <motion.div
                                            key={bottle.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="glass-card p-4 rounded-2xl border border-purple-500/20 bg-[rgba(17,17,27,0.5)]"
                                        >
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                                    {bottle.image_url ? (
                                                        <img
                                                            src={bottle.image_url}
                                                            alt={bottle.bottle_name}
                                                            className="w-full h-full object-cover rounded-xl"
                                                        />
                                                    ) : (
                                                        <Wine className="w-6 h-6 text-purple-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-white font-semibold text-sm">{bottle.bottle_name}</h4>
                                                    <p className="text-gray-400 text-xs">{bottle.bottle_brand}</p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <span className="text-xs text-gray-400">
                                                            {bottle.remaining_ml}ml / {bottle.total_ml}ml
                                                        </span>
                                                        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                                                style={{
                                                                    width: `${(bottle.remaining_ml / bottle.total_ml) * 100}%`,
                                                                }}
                                                            ></div>
                                                        </div>
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
                    <div className="text-center py-12">
                        <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500">Search for a customer</p>
                        <p className="text-xs text-gray-600 mt-2">Enter name, phone, or email to find customer details</p>
                    </div>
                )}
            </div>
        </div>
    );
}
