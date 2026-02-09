import { motion } from "motion/react";

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 rounded-3xl border border-purple-500/20 bg-[rgba(17,17,27,0.7)] backdrop-blur-xl">
      <div className="animate-pulse">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-purple-500/20" />
          <div className="flex-1">
            <div className="h-4 bg-purple-500/20 rounded-lg w-24 mb-2" />
            <div className="h-6 bg-purple-500/30 rounded-lg w-40" />
          </div>
        </div>
        <div className="h-3 bg-purple-500/10 rounded w-32" />
      </div>
    </div>
  );
}

export function SkeletonBottleDetails() {
  return (
    <div className="glass-card p-8 rounded-3xl border border-purple-500/20 bg-[rgba(17,17,27,0.7)] backdrop-blur-xl">
      <div className="animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 rounded bg-purple-500/20" />
          <div className="h-5 bg-purple-500/30 rounded-lg w-32" />
        </div>

        <div className="mb-8">
          <div className="h-8 bg-purple-500/30 rounded-lg w-48 mb-2" />
          <div className="h-4 bg-purple-500/20 rounded-lg w-32" />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-purple-500/20" />
          ))}
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="h-4 bg-purple-500/20 rounded w-20" />
            <div className="h-5 bg-purple-500/30 rounded w-24" />
          </div>
          <div className="h-3 rounded-full bg-purple-500/20" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="glass-card p-4 rounded-2xl border border-purple-500/20 bg-[rgba(17,17,27,0.5)]"
        >
          <div className="animate-pulse">
            <div className="h-10 bg-purple-500/30 rounded-lg w-16 mb-2" />
            <div className="h-3 bg-purple-500/20 rounded-lg w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface PulsingDotProps {
  delay?: number;
}

export function PulsingDot({ delay = 0 }: PulsingDotProps) {
  return (
    <motion.div
      className="w-2 h-2 rounded-full bg-purple-400"
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        delay,
      }}
    />
  );
}
