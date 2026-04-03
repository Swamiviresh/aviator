import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, LogOut, Shield, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#121212] border-b border-[#2a2a2a] px-4 py-2 flex items-center justify-between z-50 sticky top-0 shadow-2xl">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-2xl font-black text-red-600 tracking-tighter hover:scale-105 transition-transform">
          AVIATOR
        </Link>
        <div className="hidden md:flex gap-4">
          <Link to="/" className="text-white border-b-2 border-red-600 px-1 text-sm font-bold uppercase">Aviator</Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="bg-[#1a1a1a] px-4 py-1.5 rounded-full border border-gray-800 flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Wallet</span>
              <span className="text-green-500 font-extrabold text-lg">${user.balance.toFixed(2)}</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#252525] px-3 py-1.5 rounded-full border border-gray-800 transition-colors"
              >
                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                  <User size={14} className="text-white" />
                </div>
                <span className="text-sm font-bold text-gray-200 hidden sm:block">{user.username}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-2xl overflow-hidden py-2 z-[100]">
                  <div className="px-4 py-2 border-b border-gray-800 mb-2">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Username</p>
                    <p className="text-sm font-bold text-white">{user.username}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-2">Role</p>
                    <p className="text-[10px] font-bold text-red-500 uppercase">{user.role}</p>
                  </div>

                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-[#252525] hover:text-white transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Shield size={16} className="text-red-500" />
                      Admin Panel
                    </Link>
                  )}

                  <Link
                    to="/change-password"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-[#252525] hover:text-white transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <User size={16} />
                    Change Password
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-[#252525] transition-colors border-t border-gray-800 mt-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
