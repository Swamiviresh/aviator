'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore, type View } from '@/store/authStore';
import LandingPage from '@/components/landing/LandingPage';
import AuthForms from '@/components/auth/AuthForms';
import GamePage from '@/components/game/GamePage';
import AdminDashboard from '@/components/admin/AdminDashboard';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export default function Home() {
  const { token, user, view, setView } = useAuthStore();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Auto-login from stored token
  useEffect(() => {
    if (token && !user) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error();
        })
        .then((data) => {
          useAuthStore.getState().login(token, { ...data, totalBets: undefined });
        })
        .catch(() => {
          useAuthStore.getState().logout();
        });
    }
  }, [token, user]);

  if (!mounted) {
    return (
      <div className="bg-mesh noise-overlay min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-2xl font-bold tracking-wider text-gradient-orange"
        >
          AVIATOR
        </motion.div>
      </div>
    );
  }

  const navigateAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setView(mode === 'login' ? 'login' : 'register');
  };

  return (
    <AnimatePresence mode="wait">
      {view === 'landing' && (
        <motion.div key="landing" variants={pageVariants} initial="initial" animate="animate" exit="exit">
          <LandingPage onNavigate={navigateAuth} />
        </motion.div>
      )}

      {(view === 'login' || view === 'register') && (
        <motion.div key={view} variants={pageVariants} initial="initial" animate="animate" exit="exit">
          <AuthForms
            mode={authMode}
            onSwitch={(m) => {
              setAuthMode(m);
              setView(m === 'login' ? 'login' : 'register');
            }}
            onBack={() => setView('landing')}
          />
        </motion.div>
      )}

      {view === 'game' && (
        <motion.div key="game" variants={pageVariants} initial="initial" animate="animate" exit="exit">
          <GamePage />
        </motion.div>
      )}

      {view === 'admin' && (
        <motion.div key="admin" variants={pageVariants} initial="initial" animate="animate" exit="exit">
          <AdminDashboard />
        </motion.div>
      )}
    </AnimatePresence>
  );
}