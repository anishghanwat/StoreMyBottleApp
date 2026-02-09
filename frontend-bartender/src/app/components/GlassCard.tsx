import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div className={`bg-[#1a1a24]/80 backdrop-blur-xl border border-purple-600/20 rounded-3xl p-6 ${className}`}>
      {children}
    </div>
  );
}
