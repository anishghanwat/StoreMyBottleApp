import { useNavigate } from "react-router";
import { Home, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 border-2 border-red-500/30 mb-6">
          <AlertCircle className="w-12 h-12 text-red-400" />
        </div>

        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-300 mb-2">Page Not Found</h2>
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist.
        </p>

        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all"
        >
          <Home className="w-5 h-5" />
          Go Home
        </button>
      </motion.div>
    </div>
  );
}
