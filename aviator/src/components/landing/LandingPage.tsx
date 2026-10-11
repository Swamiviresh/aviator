'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Plane, Zap, Shield, TrendingUp, Coins, Banknote, Menu, ArrowRight } from 'lucide-react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';

interface LandingPageProps {
  onNavigate: (view: 'login' | 'register') => void;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="bg-mesh noise-overlay min-h-screen flex flex-col">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 glass-strong !rounded-none border-x-0 border-t-0">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-3">
          <span className="text-2xl font-bold tracking-wider text-gradient-orange">AVIATOR</span>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => onNavigate('login')} className="glass-btn-ghost px-5 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white transition-colors">
              Sign In
            </button>
            <button onClick={() => onNavigate('register')} className="glass-btn px-5 py-2 rounded-lg text-sm">
              Play Now
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button className="text-white/70 hover:text-white p-2" aria-label="Open menu">
                  <Menu className="size-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#0a0a14] border-white/10">
                <SheetHeader className="mt-8">
                  <SheetTitle className="text-gradient-orange text-2xl font-bold tracking-wider">AVIATOR</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-3 mt-8 px-4">
                  <button
                    onClick={() => onNavigate('login')}
                    className="glass-btn-ghost w-full px-5 py-3 rounded-lg text-white/70 hover:text-white text-left transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => onNavigate('register')}
                    className="glass-btn w-full px-5 py-3 rounded-lg text-left"
                  >
                    Play Now
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>

      {/* ── Hero Section ───────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Animated plane */}
        <motion.div
          className="absolute pointer-events-none text-primary/20"
          style={{ top: '25%', left: '15%' }}
          animate={{
            x: [0, 120, 300],
            y: [0, -80, -200],
            opacity: [0, 0.6, 0],
            scale: [0.7, 1, 1.2],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Plane className="size-20 -rotate-[25deg]" />
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 text-center flex flex-col items-center"
        >
          <motion.h1
            variants={fadeInUp}
            transition={{ duration: 0.7 }}
            className="text-5xl md:text-7xl font-bold text-gradient-orange leading-tight"
          >
            Take Flight, Cash Out
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            transition={{ duration: 0.7 }}
            className="text-lg text-white/50 max-w-xl mx-auto mt-6"
          >
            The plane is rising. The multiplier is climbing. Cash out before it
            crashes — or lose it all.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 mt-10"
          >
            <button onClick={() => onNavigate('register')} className="glass-btn px-8 py-3 text-lg rounded-xl flex items-center gap-2">
              Start Playing
              <ArrowRight className="size-5" />
            </button>
            <button onClick={() => onNavigate('register')} className="glass-btn-ghost px-8 py-3 text-lg rounded-xl text-white/60 hover:text-white">
              Watch Demo
            </button>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.7 }}
            className="flex flex-wrap justify-center gap-3 mt-12"
          >
            {['10K+ Players', 'Instant Payouts', 'Provably Fair'].map((stat) => (
              <span key={stat} className="glass-subtle px-4 py-2 rounded-full text-sm text-white/50">
                {stat}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features Section ───────────────────────────────── */}
      <section className="py-24 grid-dots relative">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <AnimatedSection className="text-center mb-16">
            <motion.h2 variants={fadeInUp} transition={{ duration: 0.6 }} className="text-3xl md:text-4xl font-bold text-white">
              Why Aviator?
            </motion.h2>
            <motion.p variants={fadeInUp} transition={{ duration: 0.6 }} className="text-white/40 mt-3 text-lg">
              Built for thrill seekers
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="size-6 text-primary" />,
                title: 'Lightning Fast',
                desc: 'Real-time multiplayer action with instant bet placement and cashout. No lag, no delays.',
              },
              {
                icon: <Shield className="size-6 text-primary" />,
                title: 'Provably Fair',
                desc: 'Every crash point is generated using a transparent algorithm. Verify any round yourself.',
              },
              {
                icon: <TrendingUp className="size-6 text-primary" />,
                title: 'Smart Cashout',
                desc: 'Set auto-cashout targets or manually time your exit. Two bet slots for advanced strategy.',
              },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                transition={{ duration: 0.6 }}
                className="glass p-6 flex flex-col gap-4 hover:border-white/15 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-white font-semibold text-lg">{feature.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ── How To Play Section ────────────────────────────── */}
      <section className="py-24 relative">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <AnimatedSection className="text-center mb-16">
            <motion.h2 variants={fadeInUp} transition={{ duration: 0.6 }} className="text-3xl md:text-4xl font-bold text-white">
              How It Works
            </motion.h2>
          </AnimatedSection>

          <AnimatedSection className="flex flex-col md:flex-row items-stretch gap-6 md:gap-0 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-[3.5rem] left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40" />

            {[
              {
                step: 1,
                icon: <Coins className="size-6 text-primary" />,
                title: 'Place Your Bet',
                desc: 'Choose your amount and place a bet before the round starts.',
              },
              {
                step: 2,
                icon: <TrendingUp className="size-6 text-primary" />,
                title: 'Watch It Rise',
                desc: 'The multiplier climbs from 1.00x. The longer you wait, the higher the reward.',
              },
              {
                step: 3,
                icon: <Banknote className="size-6 text-primary" />,
                title: 'Cash Out In Time',
                desc: 'Click cashout before the plane crashes. Your bet is multiplied by the current value.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                variants={fadeInUp}
                transition={{ duration: 0.6 }}
                className="flex-1 glass p-6 md:p-8 flex flex-col items-center text-center relative"
              >
                {/* Step number */}
                <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg mb-4 relative z-10">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed max-w-xs">{item.desc}</p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ── Final CTA Section ──────────────────────────────── */}
      <section className="py-20 relative">
        <AnimatedSection className="text-center px-4">
          <motion.h2 variants={fadeInUp} transition={{ duration: 0.6 }} className="text-4xl md:text-5xl font-bold text-gradient-orange">
            Ready to Take Off?
          </motion.h2>
          <motion.p variants={fadeInUp} transition={{ duration: 0.6 }} className="text-white/40 mt-4 text-lg">
            Join thousands of players and test your nerve.
          </motion.p>
          <motion.div variants={fadeInUp} transition={{ duration: 0.6 }} className="mt-8">
            <button onClick={() => onNavigate('register')} className="glass-btn px-10 py-4 text-lg rounded-xl">
              Create Account
            </button>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="mt-auto py-8 border-t border-white/5 text-center">
        <p className="text-white/30 text-sm">&copy; 2026 Aviator. All rights reserved.</p>
      </footer>
    </div>
  );
}