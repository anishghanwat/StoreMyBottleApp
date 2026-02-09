import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Wine, ScanLine } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-between p-6 max-w-[375px] mx-auto">
      {/* Logo and Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex flex-col items-center justify-center gap-8 text-center"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full blur-3xl opacity-50" />
          <Wine className="w-24 h-24 text-purple-500 relative" />
        </div>
        
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">StoreMyBottle</h1>
          <p className="text-gray-400">Premium nightlife experience</p>
        </div>

        <div className="w-full max-w-xs space-y-4 text-left">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
            <p className="text-sm text-gray-400">Buy bottles digitally at any venue</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
            <p className="text-sm text-gray-400">Redeem drinks with QR codes</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
            <p className="text-sm text-gray-400">Track your bottles in real-time</p>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full space-y-4"
      >
        <PrimaryButton 
          fullWidth 
          onClick={() => navigate("/customer")}
        >
          <Wine className="w-5 h-5 inline mr-2" />
          Customer
        </PrimaryButton>
        
        <PrimaryButton 
          fullWidth 
          variant="outline"
          onClick={() => navigate("/bartender/login")}
        >
          <ScanLine className="w-5 h-5 inline mr-2" />
          Bartender
        </PrimaryButton>
      </motion.div>
    </div>
  );
}
