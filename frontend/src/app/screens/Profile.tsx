import { Link, useNavigate } from "react-router";
import { Home, Wine, User, LogOut, Settings, Shield, HelpCircle, Edit2, X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { profileService } from "../../services/profile.service";
import { authService } from "../../services/auth.service";
import { Profile as UserProfile } from "../../types/api.types";

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
      // Could show error toast here
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
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

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-gray-400 text-sm">Manage your account</p>
      </div>

      {/* User Info Card */}
      <div className="px-6 mb-6">
        <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {getInitials(profile.user.name)}
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
                    {profile.user.phone && profile.user.email && (
                      <p className="text-gray-500 text-xs mt-1">{profile.user.email}</p>
                    )}
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

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
            <div>
              <p className="text-gray-400 text-xs mb-1">Total Bottles</p>
              <p className="text-2xl font-bold text-purple-400">{profile.total_bottles}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-purple-400">₹{profile.total_spent.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-6 space-y-3">
        <button className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 flex items-center gap-4 hover:border-zinc-700 transition-colors active:scale-98">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-purple-400" />
          </div>
          <span className="flex-1 text-left font-medium">Settings</span>
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 flex items-center gap-4 hover:border-zinc-700 transition-colors active:scale-98">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <span className="flex-1 text-left font-medium">Privacy & Security</span>
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 flex items-center gap-4 hover:border-zinc-700 transition-colors active:scale-98">
          <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-green-400" />
          </div>
          <span className="flex-1 text-left font-medium">Help & Support</span>
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={handleLogout}
          className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 flex items-center gap-4 hover:border-red-800/50 transition-colors active:scale-98 group"
        >
          <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-400" />
          </div>
          <span className="flex-1 text-left font-medium text-red-400">Logout</span>
        </button>
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