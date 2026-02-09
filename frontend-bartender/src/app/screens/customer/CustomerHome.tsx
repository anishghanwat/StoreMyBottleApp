import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Wine, ArrowRight, Plus } from "lucide-react";
import { GlassCard } from "../../components/GlassCard";
import { useState, useEffect } from "react";
import { SkeletonCard } from "../../components/SkeletonCard";

interface Bottle {
  id: string;
  name: string;
  type: string;
  remainingMl: number;
  totalMl: number;
  venue: string;
  imageUrl: string;
}

const mockBottles: Bottle[] = [
  {
    id: "1",
    name: "Grey Goose Vodka",
    type: "Vodka",
    remainingMl: 580,
    totalMl: 750,
    venue: "Skybar Rooftop",
    imageUrl: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=200&h=200&fit=crop"
  },
  {
    id: "2",
    name: "Hennessy VS",
    type: "Cognac",
    remainingMl: 420,
    totalMl: 700,
    venue: "Club Mirage",
    imageUrl: "https://images.unsplash.com/photo-1602224876107-3c93c281832a?w=200&h=200&fit=crop"
  },
  {
    id: "3",
    name: "Jack Daniel's",
    type: "Whiskey",
    remainingMl: 150,
    totalMl: 750,
    venue: "The Underground",
    imageUrl: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=200&h=200&fit=crop"
  }
];

export function CustomerHome() {
  const navigate = useNavigate();
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setBottles(mockBottles);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] max-w-[375px] mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-purple-600/20 z-10">
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-400">Welcome back</p>
              <h1 className="text-2xl font-bold text-white">My Bottles</h1>
            </div>
            <button className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.5)]">
              <Plus className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottles List */}
      <div className="p-6 space-y-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : bottles.length === 0 ? (
          <div className="text-center py-16">
            <Wine className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No bottles yet</p>
          </div>
        ) : (
          bottles.map((bottle, index) => (
            <motion.div
              key={bottle.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard>
                <button
                  onClick={() => navigate(`/customer/bottle/${bottle.id}`)}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl flex items-center justify-center overflow-hidden">
                      <img 
                        src={bottle.imageUrl} 
                        alt={bottle.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{bottle.name}</h3>
                      <p className="text-sm text-gray-400 mb-2">{bottle.venue}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#2a2a3e] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                            style={{ width: `${(bottle.remainingMl / bottle.totalMl) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{bottle.remainingMl}ml</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              </GlassCard>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
