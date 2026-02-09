import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { ArrowLeft, Mail, Lock, User, Loader2 } from "lucide-react";
import { authService } from "../../services/auth.service";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignup) {
        // For MVP, we'll use email as the identifier
        // In a real app, you'd have a separate signup endpoint
        await authService.login(email, password, name);
      } else {
        await authService.login(email, password);
      }

      // Navigate to intended destination or payment page
      const destination = location.state?.from || "/payment";
      navigate(destination, { state: location.state });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Authentication failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-zinc-800/50 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold">
          {isSignup ? "Create Account" : "Sign In"}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6">
          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">
              {isSignup ? "Join StoreMyBottle" : "Welcome Back"}
            </h2>
            <p className="text-gray-400">
              {isSignup
                ? "Create an account to purchase and redeem bottles"
                : "Sign in to continue your purchase"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (Signup only) */}
            {isSignup && (
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-zinc-700 disabled:to-zinc-700 text-white py-5 rounded-2xl font-medium text-base transition-all duration-300 active:scale-95 shadow-lg shadow-purple-500/25 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isSignup ? "Creating Account..." : "Signing In..."}
                </>
              ) : (
                <>{isSignup ? "Create Account" : "Sign In"}</>
              )}
            </button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="text-center pt-4">
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setError(null);
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {isSignup ? (
                <>
                  Already have an account?{" "}
                  <span className="text-purple-400 font-medium">Sign In</span>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <span className="text-purple-400 font-medium">Sign Up</span>
                </>
              )}
            </button>
          </div>

          {/* Guest Browsing Note */}
          <div className="text-center pt-6 border-t border-zinc-800">
            <Link to="/" className="text-gray-500 text-sm hover:text-white transition-colors">
              You can browse venues and bottles without signing in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
