import { useState } from "react";
import { useNavigate } from "react-router";
import { Wine, LogIn, UserPlus, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { authService } from "../../services/api";
import { toast } from "sonner";

export default function BartenderLogin() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      if (isLogin) {
        const data = await authService.login(email, password);
        if (data.user.role !== "bartender" && data.user.role !== "admin") {
          setError("Access denied — not a bartender account.");
          toast.error("Access denied — not a bartender account");
          setIsLoading(false);
          return;
        }
        // Session is already saved by authService.login
        toast.success("Welcome back!");
        navigate("/home");
      } else {
        await authService.signup(name, email, password, phone);
        setIsLogin(true);
        setError("Account created! Ask your admin to grant bartender access, then log in.");
        toast.success("Account created successfully!");
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Authentication failed.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06060D] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-[-100px] left-[-80px] w-72 h-72 rounded-full bg-violet-700/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-60px] right-[-60px] w-56 h-56 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-violet-900 mb-4 shadow-lg shadow-violet-700/40">
          <Wine className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-2xl font-black tracking-tight">StoreMyBottle</h1>
        <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/8">
          <ShieldCheck className="w-3 h-3 text-amber-400" />
          <span className="text-[11px] text-[#6B6B9A] font-semibold tracking-wider uppercase">Staff Portal</span>
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 }}
        className="w-full max-w-sm"
      >
        <div className="bar-card p-7 shadow-2xl shadow-black/50">
          {/* Tab toggle */}
          <div className="flex bg-white/[0.04] rounded-xl p-1 mb-6">
            {[{ label: "Sign In", val: true }, { label: "Sign Up", val: false }].map(t => (
              <button
                key={String(t.val)}
                onClick={() => { setIsLogin(t.val); setError(""); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${isLogin === t.val
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-700/30"
                  : "text-[#6B6B9A] hover:text-white"
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full Name"
                  className="input-bar w-full px-4 py-3.5 text-sm"
                  required
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Phone (+91...)"
                  className="input-bar w-full px-4 py-3.5 text-sm"
                  required
                />
              </>
            )}

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              className="input-bar w-full px-4 py-3.5 text-sm"
              required
            />

            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                className="input-bar w-full pl-4 pr-12 py-3.5 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6B9A]"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {isLogin && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm text-[#6B6B9A] hover:text-violet-400 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-xs leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-bar-primary w-full py-4 flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isLogin ? "Sign In to Portal" : "Create Account"}
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-[#4A4A6A] text-xs mt-8"
      >
        v1.0.0 · Staff access only
      </motion.p>
    </div>
  );
}