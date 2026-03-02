import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { ArrowLeft, Mail, Lock, User, Loader2, Wine, AlertCircle } from "lucide-react";
import { authService } from "../../services/auth.service";
import { motion } from "motion/react";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Validation helpers
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters" };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: "Password must contain at least one number" };
    }
    return { valid: true };
  };

  const validateName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  // Client-side validation
  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    let isValid = true;

    if (isSignup) {
      if (!validateName(name)) {
        errors.name = "Name must be at least 2 characters";
        isValid = false;
      }
    }

    if (!validateEmail(email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.message;
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  // Parse backend error messages
  const parseErrorMessage = (err: any): string => {
    // Handle different error response formats
    if (err.response?.data?.detail) {
      const detail = err.response.data.detail;

      // Handle array of errors (FastAPI validation errors)
      if (Array.isArray(detail)) {
        return detail.map((e: any) => e.msg || e.message).join(", ");
      }

      // Handle string detail
      if (typeof detail === "string") {
        // Map common backend errors to user-friendly messages
        if (detail.includes("already registered") || detail.includes("already exists")) {
          return "This email is already registered. Try signing in instead.";
        }
        if (detail.includes("Invalid credentials") || detail.includes("Incorrect")) {
          return "Invalid email or password. Please try again.";
        }
        if (detail.includes("not found")) {
          return "No account found with this email. Try signing up instead.";
        }
        if (detail.includes("password")) {
          return "Password does not meet requirements.";
        }
        return detail;
      }
    }

    // Handle network errors
    if (err.message === "Network Error" || !err.response) {
      return "Unable to connect to server. Please check your internet connection.";
    }

    // Handle timeout
    if (err.code === "ECONNABORTED") {
      return "Request timed out. Please try again.";
    }

    // Handle specific status codes
    if (err.response?.status === 401) {
      return "Invalid email or password.";
    }
    if (err.response?.status === 403) {
      return "Access denied. Please contact support.";
    }
    if (err.response?.status === 429) {
      return "Too many attempts. Please try again later.";
    }
    if (err.response?.status >= 500) {
      return "Server error. Please try again later.";
    }

    return "Authentication failed. Please try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        await authService.signup(email.trim(), password, name.trim());
        toast.success("Welcome! 🎉");
      } else {
        await authService.login(email.trim(), password);
        toast.success("Welcome back!");
      }
      const destination = location.state?.from || "/";
      navigate(destination, { state: location.state });
    } catch (err: any) {
      const errorMsg = parseErrorMessage(err);
      setError(errorMsg);
      console.error("Auth error:", err);
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
            onClick={() => {
              setIsSignup(false);
              setError(null);
              setFieldErrors({});
              setName("");
              setPassword("");
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${!isSignup
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
              : "text-[#7171A0] hover:text-white"
              }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsSignup(true);
              setError(null);
              setFieldErrors({});
              setPassword("");
            }}
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
            className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm leading-relaxed">{error}</p>
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
            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A6A]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) {
                      setFieldErrors({ ...fieldErrors, name: undefined });
                    }
                  }}
                  placeholder="Full Name"
                  required
                  className={`input-nightlife w-full py-4 pl-11 pr-4 ${fieldErrors.name ? "border-red-500/50 focus:border-red-500" : ""
                    }`}
                />
              </div>
              {fieldErrors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1.5 ml-1"
                >
                  {fieldErrors.name}
                </motion.p>
              )}
            </div>
          )}

          <div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A6A]" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors({ ...fieldErrors, email: undefined });
                  }
                }}
                placeholder="Email address"
                required
                className={`input-nightlife w-full py-4 pl-11 pr-4 ${fieldErrors.email ? "border-red-500/50 focus:border-red-500" : ""
                  }`}
              />
            </div>
            {fieldErrors.email && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-xs mt-1.5 ml-1"
              >
                {fieldErrors.email}
              </motion.p>
            )}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A6A]" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors({ ...fieldErrors, password: undefined });
                  }
                }}
                placeholder="Password"
                required
                minLength={8}
                className={`input-nightlife w-full py-4 pl-11 pr-4 ${fieldErrors.password ? "border-red-500/50 focus:border-red-500" : ""
                  }`}
              />
            </div>
            {fieldErrors.password && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-xs mt-1.5 ml-1"
              >
                {fieldErrors.password}
              </motion.p>
            )}
            {isSignup && !fieldErrors.password && (
              <p className="text-[#4A4A6A] text-xs mt-1.5 ml-1">
                Min 8 characters with uppercase, lowercase, and number
              </p>
            )}
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
            className="btn-primary w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
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
