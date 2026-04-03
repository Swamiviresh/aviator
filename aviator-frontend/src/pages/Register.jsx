import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Eye, EyeOff, Lock, User as UserIcon, CheckSquare } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/register', { username, password });
      alert('Registered successfully! Please login.');
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-red-600/30 blur-[120px] rounded-full rotate-45"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-blue-900/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md bg-[#111] p-8 rounded-2xl shadow-2xl border border-gray-800 z-10">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-red-600 tracking-tighter mb-2">AVIATOR</h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">The Ultimate Betting Experience</p>
        </div>

        <h2 className="text-2xl font-black mb-8 text-white uppercase tracking-tight">Create Account</h2>

        <form onSubmit={handleRegister} className="flex flex-col gap-6">
          <div className="relative group">
            <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-black border border-gray-800 rounded-xl focus:outline-none focus:border-red-500 transition-all font-medium text-sm placeholder:text-gray-600"
              required
            />
          </div>

          <div className="relative group">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-black border border-gray-800 rounded-xl focus:outline-none focus:border-red-500 transition-all font-medium text-sm placeholder:text-gray-600"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex items-start gap-3 mt-1">
             <div className="p-1 rounded bg-green-600/10 text-green-500 border border-green-900/30">
               <CheckSquare size={12} />
             </div>
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
               By registering, I confirm I am 18+ and agree to the <span className="text-gray-400">Terms of Service</span>.
             </p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl shadow-lg shadow-red-900/30 transform active:scale-95 transition-all text-sm uppercase tracking-widest mt-2 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">
          Already have an account? <Link to="/login" className="text-red-500 hover:text-red-400 transition-colors ml-2 underline underline-offset-4 decoration-2">Login Here</Link>
        </p>
      </div>

      <div className="mt-10 text-[9px] text-gray-600 font-bold uppercase tracking-[0.3em] z-10 flex items-center gap-4">
        <span>Curacao License #8048/JAZ</span>
        <span className="w-1 h-1 rounded-full bg-gray-800"></span>
        <span>18+ Gamble Responsibly</span>
      </div>
    </div>
  );
};

export default Register;
