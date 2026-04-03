import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/change-password', { newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="max-w-md mx-auto mt-20 p-6">
        <div className="bg-[#111] p-8 rounded-2xl border border-gray-800 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center text-red-500">
              <Lock size={32} />
            </div>
          </div>

          <h1 className="text-2xl font-black uppercase tracking-tight text-center mb-2">Change Password</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest text-center mb-8">Update your security credentials</p>

          {success ? (
            <div className="bg-green-600/10 border border-green-900/30 p-4 rounded-xl flex items-center gap-3 text-green-500">
              <CheckCircle size={20} />
              <span className="text-sm font-bold">Password updated! Redirecting...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="relative group">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 block">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-black border border-gray-800 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500 transition-colors"
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
              </div>
              <div className="relative group">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 block">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-black border border-gray-800 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500 transition-colors"
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
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl shadow-lg shadow-red-900/20 transform active:scale-95 transition-all text-sm uppercase tracking-widest mt-4 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChangePassword;
