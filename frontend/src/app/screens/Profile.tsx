import { Link, useNavigate } from "react-router";
import { Home, Wine, User, LogOut, Settings, Shield, HelpCircle, Edit2, X, Check, Award, Trophy, Star, TrendingUp, Gift, Users, Share2, Zap, Target, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { profileService } from "../../services/profile.service";
import { authService } from "../../services/auth.service";
import { Profile as UserProfile } from "../../types/api.types";

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    earned: boolean;
    earnedAt?: string;
}

interface Achievement {
    id: string;
    title: string;
    description: string;
    progress: number;
    target: number;
    reward: string;
}

export default function Profile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'stats'>('overview');

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [saving, setSaving] = useState(false);

    // Mock data for rewards and badges (would come from API in production)
    const loyaltyPoints = 1250;
    const currentTier = "Gold";
    const nextTier = "Platinum";
    const pointsToNextTier = 750;

    const badges: Badge[] = [
        { id: '1', name: 'First Purchase', description: 'Made your first bottle purchase', icon: '🎉', earned: true, earnedAt: '2026-01-15' },
        { id: '2', name: 'Social Butterfly', description: 'Shared 5 bottles on social media', icon: '🦋', earned: true, earnedAt: '2026-02-01' },
        { id: '3', name: 'Connoisseur', description: 'Tried 10 different bottles', icon: '🍷', earned: true, earnedAt: '2026-02-10' },
        { id: '4', name: 'Night Owl', description: 'Redeemed after midnight 5 times', icon: '🦉', earned: false },
        { id: '5', name: 'Loyal Customer', description: 'Visited 3 different venues', icon: '⭐', earned: false },
        { id: '6', name: 'Big Spender', description: 'Spent over ₹10,000', icon: '💎', earned: false },
    ];

    const achievements: Achievement[] = [
        { id: '1', title: 'Bottle Collector', description: 'Purchase 20 bottles', progress: 12, target: 20, reward: '500 points' },
        { id: '2', title: 'Social Star', description: 'Refer 5 friends', progress: 2, target: 5, reward: '1000 points' },
        { id: '3', title: 'Venue Explorer', description: 'Visit 5 different venues', progress: 3, target: 5, reward: '300 points' },
    ];

    useEffect(() => {
        if (!authService.isAuthenticated()) {
            navigate("/login");
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
        } catch (err) {
            setError("Failed to load profile");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            setSaving(true);
            const updatedUser = await profileService.updateProfile({
                name: editName,
                email: editEmail
            });

            if (profile) {
                setProfile({
                    ...profile,
                    user: updatedUser
                });
            }
            setIsEditing(false);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate("/login");
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error || "Failed to load profile"}</p>
                    <button
                        onClick={loadProfile}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Header */}
            <div className="px-6 pt-8 pb-6">
                <h1 className="text-3xl font-bold mb-2">Profile</h1>
                <p className="text-gray-400 text-sm">Manage your account & rewards</p>
            </div>

            {/* User Info Card */}
            <div className="px-6 mb-6">
                <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 relative">
                            {getInitials(profile.user.name)}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs">
                                <Crown className="w-4 h-4 text-white" />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        placeholder="Your Name"
                                    />
                                    <input
                                        type="email"
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        placeholder="Email Address"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleUpdateProfile}
                                            disabled={saving}
                                            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-1"
                                        >
                                            {saving ? "Saving..." : <><Check className="w-4 h-4" /> Save</>}
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            disabled={saving}
                                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-1"
                                        >
                                            <X className="w-4 h-4" /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-semibold truncate">{profile.user.name}</h2>
                                        <p className="text-gray-400 text-sm truncate">{profile.user.email || profile.user.phone}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full border border-yellow-500/30">
                                                {currentTier}
                                            </span>
                                            <span className="text-gray-500 text-xs">{loyaltyPoints} points</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-full text-gray-400 hover:text-white transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Loyalty Progress */}
                    <div className="mb-4 p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-300">Progress to {nextTier}</span>
                            <span className="text-sm font-semibold text-yellow-400">{pointsToNextTier} points to go</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(loyaltyPoints / (loyaltyPoints + pointsToNextTier)) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Bottles</p>
                            <p className="text-2xl font-bold text-purple-400">{profile.total_bottles}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Spent</p>
                            <p className="text-2xl font-bold text-purple-400">₹{(profile.total_spent / 1000).toFixed(1)}k</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Redeemed</p>
                            <p className="text-2xl font-bold text-purple-400">{profile.total_redemptions}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 mb-6">
                <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('badges')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'badges'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Badges
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'stats'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Stats
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="px-6 space-y-6 mb-6">
                {activeTab === 'overview' && (
                    <>
                        {/* Quick Actions */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-400" />
                                Quick Actions
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-4 hover:border-purple-500/50 transition-all active:scale-95">
                                    <Share2 className="w-6 h-6 text-purple-400 mb-2" />
                                    <p className="text-sm font-semibold">Share & Earn</p>
                                    <p className="text-xs text-gray-400 mt-1">Get 200 points</p>
                                </button>
                                <button className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-4 hover:border-blue-500/50 transition-all active:scale-95">
                                    <Users className="w-6 h-6 text-blue-400 mb-2" />
                                    <p className="text-sm font-semibold">Refer Friend</p>
                                    <p className="text-xs text-gray-400 mt-1">Get 500 points</p>
                                </button>
                                <button className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-4 hover:border-green-500/50 transition-all active:scale-95">
                                    <Gift className="w-6 h-6 text-green-400 mb-2" />
                                    <p className="text-sm font-semibold">Promotions</p>
                                    <p className="text-xs text-gray-400 mt-1">View offers</p>
                                </button>
                                <button className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-2xl p-4 hover:border-orange-500/50 transition-all active:scale-95">
                                    <Trophy className="w-6 h-6 text-orange-400 mb-2" />
                                    <p className="text-sm font-semibold">Leaderboard</p>
                                    <p className="text-xs text-gray-400 mt-1">See ranking</p>
                                </button>
                            </div>
                        </div>

                        {/* Active Achievements */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Target className="w-5 h-5 text-green-400" />
                                Active Achievements
                            </h3>
                            <div className="space-y-3">
                                {achievements.map((achievement) => (
                                    <div key={achievement.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-sm">{achievement.title}</h4>
                                                <p className="text-xs text-gray-400 mt-0.5">{achievement.description}</p>
                                            </div>
                                            <span className="text-xs font-semibold text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
                                                {achievement.reward}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 bg-zinc-800 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-400 font-medium">
                                                {achievement.progress}/{achievement.target}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Settings</h3>
                            <div className="space-y-3">
                                <button className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors active:scale-98">
                                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                        <Settings className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <span className="flex-1 text-left font-medium text-sm">Settings</span>
                                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <button className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors active:scale-98">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <span className="flex-1 text-left font-medium text-sm">Privacy & Security</span>
                                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <button className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors active:scale-98">
                                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                                        <HelpCircle className="w-5 h-5 text-green-400" />
                                    </div>
                                    <span className="flex-1 text-left font-medium text-sm">Help & Support</span>
                                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex items-center gap-4 hover:border-red-800/50 transition-colors active:scale-98 group"
                                >
                                    <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                                        <LogOut className="w-5 h-5 text-red-400" />
                                    </div>
                                    <span className="flex-1 text-left font-medium text-sm text-red-400">Logout</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'badges' && (
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Award className="w-5 h-5 text-yellow-400" />
                            Your Badges ({badges.filter(b => b.earned).length}/{badges.length})
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            {badges.map((badge) => (
                                <div
                                    key={badge.id}
                                    className={`aspect-square rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all ${badge.earned
                                            ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30'
                                            : 'bg-zinc-900/50 border border-zinc-800/50 opacity-50'
                                        }`}
                                >
                                    <div className="text-3xl mb-2">{badge.icon}</div>
                                    <p className="text-xs font-semibold leading-tight">{badge.name}</p>
                                    {badge.earned && badge.earnedAt && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-gray-400 mt-4 text-center">
                            Keep exploring to unlock more badges!
                        </p>
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-purple-400" />
                                Your Statistics
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-4">
                                    <Wine className="w-6 h-6 text-purple-400 mb-2" />
                                    <p className="text-3xl font-bold">{profile.total_bottles}</p>
                                    <p className="text-sm text-gray-400">Total Bottles</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-4">
                                    <Star className="w-6 h-6 text-green-400 mb-2" />
                                    <p className="text-3xl font-bold">{profile.total_redemptions}</p>
                                    <p className="text-sm text-gray-400">Redemptions</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-4">
                                    <Trophy className="w-6 h-6 text-blue-400 mb-2" />
                                    <p className="text-3xl font-bold">₹{(profile.total_spent / 1000).toFixed(1)}k</p>
                                    <p className="text-sm text-gray-400">Total Spent</p>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-2xl p-4">
                                    <Zap className="w-6 h-6 text-yellow-400 mb-2" />
                                    <p className="text-3xl font-bold">{loyaltyPoints}</p>
                                    <p className="text-sm text-gray-400">Loyalty Points</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-3">Activity Breakdown</h3>
                            <div className="space-y-3">
                                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-400">Favorite Venue</span>
                                        <span className="text-sm font-semibold">The Purple Lounge</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-400">Most Ordered</span>
                                        <span className="text-sm font-semibold">Whisky</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-400">Avg. Bottle Price</span>
                                        <span className="text-sm font-semibold">₹{Math.round(profile.total_spent / Math.max(profile.total_bottles, 1)).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-400">Member Since</span>
                                        <span className="text-sm font-semibold">
                                            {new Date(profile.user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/50 px-6 py-4">
                <div className="flex items-center justify-around max-w-md mx-auto">
                    <Link to="/" className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
                        <Home className="w-6 h-6" />
                        <span className="text-xs font-medium">Home</span>
                    </Link>
                    <Link to="/my-bottles" className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
                        <Wine className="w-6 h-6" />
                        <span className="text-xs font-medium">My Bottles</span>
                    </Link>
                    <Link to="/profile" className="flex flex-col items-center gap-1 text-purple-400">
                        <User className="w-6 h-6" />
                        <span className="text-xs font-medium">Profile</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
