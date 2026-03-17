import { Link, useNavigate } from "react-router";
import { Home, Wine, User, LogOut, Settings, Shield, HelpCircle, Edit2, X, Check, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { profileService } from "../../services/profile.service";
import { authService } from "../../services/auth.service";
import { Profile as UserProfile } from "../../types/api.types";
import { toast } from "sonner";
import { BottomNav } from "../components/ui/BottomNav";
import { parseApiError } from "../../utils/parseApiError";

export default function Profile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authService.isAuthenticated()) {
            navigate("/login", { replace: true });
            return;
        }
        loadProfile();
    }, [navigate]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await profileService.getProfile();
            setProfile(data);
            setEditName(data.user.name);
            setEditEmail(data.user.email || "");
        } catch (err: any) {
            const errorMsg = parseApiError(err, "Failed to load profile");
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            setSaving(true);
            const updatedUser = await profileService.updateProfile({ name: editName, email: editEmail });
            if (profile) setProfile({ ...profile, user: updatedUser });
            setIsEditing(false);
            toast.success("Profile updated successfully!");
        } catch (err: any) {
            toast.error(parseApiError(err, "Failed to update profile"));
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        toast.success("Logged out successfully");
        navigate("/login");
    };

    const getInitials = (name: string) =>
        name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    if (loading) return (
        <div className="min-h-screen bg-[#09090F] text-white flex items-center justify-center">
            <div className="text-center">
                <div className="w-14 h-14 border-[3px] border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[#7171A0] text-sm animate-pulse">Loading profile...</p>
            </div>
        </div>
    );

    if (error || !profile) return (
        <div className="min-h-screen bg-[#09090F] text-white flex items-center justify-center px-6">
            <div className="text-center">
                <p className="text-red-400 mb-4 text-sm">{error || "Failed to load profile"}</p>
                <button onClick={loadProfile} className="bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white px-6 py-3 rounded-2xl font-bold text-sm">Retry</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#09090F] text-white pb-24">

            {/* Header */}
            <div className="px-5 pt-12 pb-5">
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-violet-900/15 to-transparent pointer-events-none" />
                <p className="text-xs text-[#7171A0] font-medium uppercase tracking-wider mb-1 relative">My Account</p>
                <h1 className="text-2xl font-bold tracking-tight relative">Profile</h1>
            </div>

            <div className="px-5 space-y-4">

                {/* User Info Card */}
                <div className="card-surface p-5">
                    <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center text-xl font-black flex-shrink-0">
                            {getInitials(profile.user.name)}
                        </div>

                        <div className="flex-1 min-w-0">
                            {isEditing ? (
                                <div className="space-y-2.5">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full bg-[#1A1A26] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                                        placeholder="Your Name"
                                    />
                                    <input
                                        type="email"
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        className="w-full bg-[#1A1A26] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                                        placeholder="Email Address"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleUpdateProfile}
                                            disabled={saving}
                                            className="flex-1 bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white rounded-xl py-2 text-sm font-bold flex items-center justify-center gap-1"
                                        >
                                            {saving ? "Saving..." : <><Check className="w-3.5 h-3.5" /> Save</>}
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            disabled={saving}
                                            className="flex-1 bg-white/[0.06] text-[#7171A0] rounded-xl py-2 text-sm font-bold flex items-center justify-center gap-1"
                                        >
                                            <X className="w-3.5 h-3.5" /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-lg font-bold truncate">{profile.user.name}</h2>
                                        <p className="text-[#7171A0] text-sm truncate">{profile.user.email || profile.user.phone}</p>
                                        <p className="text-xs text-[#4A4A6A] mt-0.5">
                                            Member since {new Date(profile.user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-2 bg-white/[0.05] hover:bg-white/10 rounded-full text-[#7171A0] hover:text-white transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats strip */}
                    {!isEditing && (
                        <div className="grid grid-cols-3 gap-3 pt-4 mt-4 border-t border-white/[0.07]">
                            <div className="text-center">
                                <p className="text-xl font-black text-violet-400">{profile.total_bottles}</p>
                                <p className="text-[10px] text-[#7171A0] mt-0.5">Bottles</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-black text-fuchsia-400">₹{(profile.total_spent / 1000).toFixed(1)}k</p>
                                <p className="text-[10px] text-[#7171A0] mt-0.5">Spent</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-black text-emerald-400">{profile.total_redemptions}</p>
                                <p className="text-[10px] text-[#7171A0] mt-0.5">Redeemed</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats detail card */}
                <div className="card-surface p-4 space-y-1">
                    <p className="text-[11px] text-[#7171A0] font-semibold uppercase tracking-widest mb-3">Activity</p>
                    <div className="flex justify-between text-sm py-2 border-b border-white/[0.05]">
                        <span className="text-[#7171A0]">Avg. bottle price</span>
                        <span className="font-semibold">₹{Math.round(profile.total_spent / Math.max(profile.total_bottles, 1)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2">
                        <span className="text-[#7171A0]">Member since</span>
                        <span className="font-semibold">{new Date(profile.user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                    </div>
                </div>

                {/* Settings */}
                <div className="space-y-2">
                    <p className="text-[11px] text-[#7171A0] font-semibold uppercase tracking-widest">Settings</p>

                    {[
                        { icon: Settings, label: "Settings", color: "text-violet-400", bg: "bg-violet-500/10", to: "/settings" },
                        { icon: Shield, label: "Privacy & Security", color: "text-blue-400", bg: "bg-blue-500/10", to: "/privacy-security" },
                        { icon: HelpCircle, label: "Help & Support", color: "text-emerald-400", bg: "bg-emerald-500/10", to: "/help" },
                    ].map((item) => (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.to)}
                            className="w-full card-surface p-4 flex items-center gap-3 hover:border-white/10 transition-colors text-left"
                        >
                            <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                <item.icon className={`w-4 h-4 ${item.color}`} />
                            </div>
                            <span className="flex-1 font-medium text-sm">{item.label}</span>
                            <svg className="w-4 h-4 text-[#4A4A6A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ))}

                    <button
                        onClick={handleLogout}
                        className="w-full card-surface p-4 flex items-center gap-3 hover:border-red-500/20 transition-colors"
                    >
                        <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <LogOut className="w-4 h-4 text-red-400" />
                        </div>
                        <span className="flex-1 font-medium text-sm text-red-400 text-left">Logout</span>
                    </button>
                </div>

            </div>

            <BottomNav active="profile" />
        </div>
    );
}
