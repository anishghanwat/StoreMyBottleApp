export function SkeletonCard() {
  return (
    <div className="bg-[#1a1a24]/80 backdrop-blur-xl border border-purple-600/20 rounded-3xl p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-purple-600/20 rounded-2xl" />
        <div className="flex-1">
          <div className="h-5 bg-purple-600/20 rounded-lg w-3/4 mb-2" />
          <div className="h-4 bg-purple-600/10 rounded-lg w-1/2" />
        </div>
      </div>
    </div>
  );
}
