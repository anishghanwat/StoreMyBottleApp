import { motion } from "motion/react";
import { ReactNode } from "react";

interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
  fullWidth?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}

export function PrimaryButton({ 
  children, 
  onClick, 
  variant = "primary", 
  fullWidth = false,
  disabled = false,
  type = "button"
}: PrimaryButtonProps) {
  const baseStyles = "h-14 rounded-2xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantStyles = {
    primary: "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.5)] hover:shadow-[0_0_30px_rgba(147,51,234,0.7)] active:scale-95",
    secondary: "bg-[#2a2a3e] text-white hover:bg-[#353549] active:scale-95",
    outline: "border-2 border-purple-600/50 text-purple-400 hover:bg-purple-600/10 active:scale-95"
  };
  
  return (
    <motion.button
      type={type}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${fullWidth ? 'w-full' : 'px-8'}`}
    >
      {children}
    </motion.button>
  );
}
