'use client';

import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

interface AuthFormsProps {
  mode: 'login' | 'register';
  onSwitch: (mode: 'login' | 'register') => void;
  onBack: () => void;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function PasswordInput({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass-input w-full p-3 pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export default function AuthForms({ mode, onSwitch, onBack }: AuthFormsProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isLogin = mode === 'login';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin
        ? { username: username.trim(), password }
        : { username: username.trim(), password, confirmPassword };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }

      const login = useAuthStore.getState().login;
      login(data.token, data.user);
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-mesh noise-overlay min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="glass-strong max-w-md w-full mx-auto p-8 relative"
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 text-white/40 hover:text-white/80 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5" />
        </button>

        <div className="mt-4">
          <h1 className="text-2xl font-bold text-white mb-8">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input w-full p-3"
              autoComplete="username"
            />

            <PasswordInput
              placeholder="Password"
              value={password}
              onChange={setPassword}
            />

            {!isLogin && (
              <PasswordInput
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="glass-btn w-full p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (isLogin ? 'Signing in...' : 'Creating account...') : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {error && (
            <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
          )}

          <p className="text-white/30 text-sm text-center mt-6">
            {isLogin ? (
              <>
                Don&apos;t have an account?{' '}
                <button onClick={() => { setError(''); onSwitch('register'); }} className="text-primary hover:underline">
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => { setError(''); onSwitch('login'); }} className="text-primary hover:underline">
                  Sign In
                </button>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}