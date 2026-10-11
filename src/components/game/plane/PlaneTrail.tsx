'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type GameStatus } from '@/store/gameStore';

interface Particle {
  id: number;
  x: number;
  y: number;
  opacity: number;
  scale: number;
}

interface PlaneTrailProps {
  status: GameStatus;
  multiplier: number;
}

export function PlaneTrail({ status, multiplier }: PlaneTrailProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [particleId, setParticleId] = useState(0);

  useEffect(() => {
    if (status !== 'RUNNING') {
      setParticles([]);
      return;
    }

    // Spawn particles more frequently as multiplier increases
    const spawnRate = Math.max(100, 400 - (multiplier - 1) * 50);
    
    const interval = setInterval(() => {
      setParticles((prev) => {
        // Limit particles for performance
        const filtered = prev.filter((p) => p.id > particleId - 20);
        
        return [
          ...filtered,
          {
            id: particleId,
            x: 0,
            y: 0,
            opacity: 0.8,
            scale: 1,
          },
        ];
      });
      setParticleId((id) => id + 1);
    }, spawnRate);

    return () => clearInterval(interval);
  }, [status, multiplier, particleId]);

  if (status !== 'RUNNING') return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      <AnimatePresence>
        {particles.map((particle, index) => (
          <motion.div
            key={particle.id}
            initial={{
              opacity: particle.opacity,
              scale: particle.scale,
              x: 0,
              y: 0,
            }}
            animate={{
              opacity: 0,
              scale: 0.3,
              x: -20 - index * 8,
              y: 10 + index * 3,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.8,
              ease: 'easeOut',
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: ` radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 107, 43, ${0.4 - index * 0.02}) 50%, transparent 100%)`,
                boxShadow: `0 0 10px rgba(255, 107, 43, ${0.3 - index * 0.015})`,
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
