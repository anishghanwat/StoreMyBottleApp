import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { ArrowLeft, Mail, Lock, User, Loader2, Wine } from "lucide-react";
import { authService } from "../../services/auth.service";
import { motion } from "motion/react";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignup) {
        await authService.login(email, password, name);
        toast.success("Account created successfully! Welcome! 🎉");
      } else {
        await authService.login(email, password);
        toast.success("Welcome back!");
      }
      const destination = location.state?.from || "/payment";
      navigate(destination, { state: location.state });
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Authentication failed. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090F] text-white flex flex-col relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-[-80px] left-[-60px] w-64 h-64 rounded-full bg-violet-600/20 blur-3xl pointer-events-none float" />
      <div className="absolute top-[30%] right-[-80px] w-48 h-48 rounded-full bg-fuchsia-600/15 blur-3xl pointer-events-none float-delayed" />
      <div className="absolute bottom-[20%] left-[-40px] w-56 h-56 rounded-full bg-violet-800/10 blur-3xl pointer-events-none" />

      {/* Back Button */}
      <div className="px-5 pt-12 pb-4 flex items-center relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#7171A0]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 relative z-10">
        {/* Logo + Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Wine className="w-5 h-5 text-white" strokeWidth={1.8} />
            </div>
            <span className="text-sm font-semibold tracking-wider text-[#7171A0] uppercase">StoreMyBottle</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {isSignup ? "Create account" : "Welcome back"}
          </h1>
          <p className="text-[#7171A0] text-sm leading-relaxed">
            {isSignup
              ? "Join to purchase & store bottles at top venues"
              : "Sign in to access your stored bottles"}
          </p>
        </motion.div>

        {/* Tab Toggle */}
        <div className="flex bg-[#111118] border border-white/[0.07] rounded-2xl p-1 mb-6">
          <button
            onClick={() => { setIsSignup(false); setError(null); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${!isSignup
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
              : "text-[#7171A0] hover:text-white"
              }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsSignup(true); setError(null); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${isSignup
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
              : "text-[#7171A0] hover:text-white"
              }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-4"
          >
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          key={isSignup ? "signup" : "login"}
          initial={{ opacity: 0, x: isSignup ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {isSignup && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A6A]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                required
                className="input-nightlife w-full py-4 pl-11 pr-4"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A6A]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="input-nightlife w-full py-4 pl-11 pr-4"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A6A]" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="input-nightlife w-full py-4 pl-11 pr-4"
            />
          </div>

          {!isSignup && (
            <div className="flex justify-end -mt-1">
              <Link
                to="/forgot-password"
                className="text-sm text-[#7171A0] hover:text-violet-400 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isSignup ? "Creating account..." : "Signing in..."}
              </>
            ) : (
              isSignup ? "Create Account" : "Sign In"
            )}
          </button>
        </motion.form>

        {/* Guest browse */}
        <div className="text-center pt-8 mt-2 border-t border-white/[0.06]">
          <Link to="/" className="text-[#4A4A6A] text-sm hover:text-[#7171A0] transition-colors">
            Browse venues without signing in →
          </Link>
        </div>
      </div>
    </div>
  );
}
