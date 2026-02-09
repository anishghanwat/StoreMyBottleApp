import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  confirmText?: string;
  onConfirm?: () => void;
  cancelText?: string;
  variant?: "default" | "success" | "warning" | "error";
}

export default function BottomSheetConfirmation({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmText = "Confirm",
  onConfirm,
  cancelText = "Cancel",
  variant = "default",
}: BottomSheetProps) {
  const variantColors = {
    default: "from-purple-500 to-pink-500",
    success: "from-green-500 to-emerald-500",
    warning: "from-yellow-500 to-orange-500",
    error: "from-red-500 to-pink-500",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-[375px] mx-auto"
          >
            <div className="glass-card rounded-t-3xl border-t border-x border-purple-500/20 bg-[rgba(17,17,27,0.95)] backdrop-blur-xl p-6 pb-8">
              {/* Handle Bar */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-1.5 rounded-full bg-purple-500/30" />
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center hover:bg-purple-500/20 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              {/* Content */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {title}
                </h3>
                {description && (
                  <p className="text-gray-400 text-sm">{description}</p>
                )}
              </div>

              <div className="mb-6">{children}</div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 rounded-2xl border-2 border-purple-500/30 bg-[rgba(17,17,27,0.5)] text-white hover:bg-purple-500/10 transition-all"
                >
                  {cancelText}
                </button>
                {onConfirm && (
                  <button
                    onClick={onConfirm}
                    className={`flex-1 py-4 rounded-2xl bg-gradient-to-r ${variantColors[variant]} text-white shadow-lg hover:shadow-xl transition-all`}
                  >
                    {confirmText}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
