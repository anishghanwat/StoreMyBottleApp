import { useState } from "react";
import { Wine, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AgeGateProps {
    onConfirm: () => void;
}

export default function AgeGate({ onConfirm }: AgeGateProps) {
    const [denied, setDenied] = useState(false);

    if (denied) {
        return (
            <div className="min-h-screen bg-[#09090F] text-white flex flex-col items-center justify-center px-6 text-center">
                <ShieldAlert className="w-16 h-16 text-red-400 mb-6" strokeWidth={1.5} />
                <h1 className="text-2xl font-bold mb-3">Access Restricted</h1>
                <p className="text-[#7171A0] text-sm leading-relaxed max-w-xs">
                    Sorry, this service is only available to individuals aged 25 and above as per Indian law.
                </p>
            </div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-screen bg-[#09090F] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden"
            >
                {/* Ambient orbs */}
                <div className="absolute top-[-80px] left-[-60px] w-72 h-72 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 rounded-full bg-fuchsia-600/15 blur-3xl pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center text-center max-w-sm w-full relative z-10"
                >
                    {/* Logo */}
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-xl shadow-violet-500/30 mb-6">
                        <Wine className="w-8 h-8 text-white" strokeWidth={1.8} />
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight mb-2">StoreMyBottle</h1>

                    <div className="w-12 h-px bg-white/10 my-5" />

                    <p className="text-[#7171A0] text-sm leading-relaxed mb-2">
                        This platform contains alcohol-related content and services.
                    </p>
                    <p className="text-white/80 text-base font-semibold mb-1">
                        Are you 25 years of age or older?
                    </p>
                    <p className="text-[#4A4A6A] text-xs leading-relaxed mb-8">
                        As per Indian law, the purchase and consumption of alcohol is restricted to individuals aged 25 and above in Maharashtra and Delhi.
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-col gap-3 w-full">
                        <button
                            onClick={onConfirm}
                            className="w-full py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-transform"
                        >
                            Yes, I am 25 or older
                        </button>
                        <button
                            onClick={() => setDenied(true)}
                            className="w-full py-4 rounded-2xl font-semibold text-base text-[#7171A0] bg-white/5 border border-white/[0.07] active:scale-[0.98] transition-transform"
                        >
                            No, I am under 25
                        </button>
                    </div>

                    <p className="text-[#4A4A6A] text-xs mt-8 leading-relaxed">
                        By entering, you confirm you are of legal drinking age in your jurisdiction and agree to our Terms & Conditions.
                    </p>

                    <p className="text-[#4A4A6A] text-xs mt-4">
                        🍷 Please drink responsibly. Don't drink and drive.
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
