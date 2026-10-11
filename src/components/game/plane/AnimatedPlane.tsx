'use client';

import { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useMotionValue, AnimatePresence } from 'framer-motion';
import { Plane } from 'lucide-react';
import { type GameStatus } from '@/store/gameStore';
import { PlaneTrail } from './PlaneTrail';

interface AnimatedPlaneProps {
  status: GameStatus;
  multiplier: number;
}

export function AnimatedPlane({ status, multiplier }: AnimatedPlaneProps) {
  // Motion values for physics-based animation
  const multiplierValue = useMotionValue(multiplier);
  const smoothMultiplier = useSpring(multiplierValue, {
    stiffness: 50,
    damping: 20,
    mass: 1,
  });

  // Transform multiplier to visual properties
  const yOffset = useTransform(smoothMultiplier, [1, 2, 5, 10], [0, -15, -35, -60]);
  const rotateZ = useTransform(smoothMultiplier, [1, 2, 5, 10], [-15, -20, -25, -35]);
  const scale = useTransform(smoothMultiplier, [1, 2, 5, 10], [1, 1.05, 1.15, 1.25]);
  
  // Glow intensity based on multiplier
  const glowIntensity = useTransform(
    smoothMultiplier, 
    [1, 2, 5, 10], 
    [0.2, 0.4, 0.7, 1]
  );

  // Color shift from white/yellow to orange/red at high multipliers
  const glowColor = useTransform(
    smoothMultiplier,
    [1, 3, 6, 10],
    [
      'rgba(255, 255, 255, 0.4)',
      'rgba(251, 191, 36, 0.5)',
      'rgba(255, 107, 43, 0.6)',
      'rgba(239, 68, 68, 0.7)',
    ]
  );

  // Engine vibration for running state
  const vibrationY = useMotionValue(0);
  
  useEffect(() => {
    if (status !== 'RUNNING') return;
    
    const animateVibration = () => {
      const vibrationIntensity = Math.min((multiplier - 1) * 0.5, 3);
      vibrationY.set((Math.random() - 0.5) * vibrationIntensity);
    };
    
    const interval = setInterval(animateVibration, 50);
    return () => clearInterval(interval);
  }, [status, multiplier, vibrationY]);

  // Update spring when multiplier changes
  useEffect(() => {
    multiplierValue.set(multiplier);
  }, [multiplier, multiplierValue]);

  const containerVariants = {
    initial: { opacity: 0, y: 50, scale: 0.8 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 200, damping: 20 },
    },
    exit: {
      opacity: 0,
      y: -100,
      x: 200,
      rotate: -45,
      scale: 0.5,
      transition: { duration: 0.5, ease: 'easeIn' },
    },
  };

  return (
    <AnimatePresence mode="wait">
      {(status === 'RUNNING' || (status === 'CRASHED' && multiplier > 1)) && (
        <motion.div
          key="plane-container"
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="absolute bottom-[20%] left-1/2 -translate-x-1/2 pointer-events-none"
        >
          {/* Glow effect container */}
          <motion.div
            className="relative"
            style={{
              filter: useTransform(
                glowIntensity,
                (v) => `drop-shadow(0 0 ${10 + v * 20}px ${useTransform(glowColor, (c) => c).get()})`
              ),
            }}
          >
            <PlaneTrail status={status} multiplier={multiplier} />

            <motion.div
              style={{ y: yOffset, rotate: rotateZ, scale }}
              className="relative"
            >
              {/* Engine glow */}
              <motion.div
                className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-4 rounded-full blur-md"
                style={{
                  background: useTransform(smoothMultiplier, [1, 2, 5, 10], [
                    'rgba(255, 255, 255, 0.3)',
                    'rgba(251, 191, 36, 0.5)',
                    'rgba(255, 107, 43, 0.7)',
                    'rgba(255, 80, 0, 0.9)',
                  ]),
                }}
              />

              {/* Plane with vibration */}
              <motion.div style={{ y: useTransform(vibrationY, (v) => v) }}>
                <Plane className="size-12 md:size-14 lg:size-16 text-white drop-shadow-lg" />
              </motion.div>

              {/* Speed lines at high multipliers */}
              {multiplier > 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 0 }}
                  animate={{ opacity: [0, 1, 0], x: [-20, -60] }}
                  transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 0.1 }}
                  className="absolute right-full top-1/2 -translate-y-1/2 flex gap-1"
                >
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-8 h-0.5 rounded-full"
                      style={{
                        background: `linear-gradient(to left, rgba(255,255,255,${0.6-i*0.15}), transparent)`,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
