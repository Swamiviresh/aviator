import React from 'react';
import {
  Gamepad2,
  Trophy,
  History,
  Settings,
  HelpCircle,
  MessageSquare,
  PieChart,
  Menu,
  ChevronRight,
  TrendingUp,
  Award,
  CircleDot,
  Activity,
  Monitor
} from 'lucide-react';

const Sidebar = () => {
  const categories = [
    { icon: <Gamepad2 size={20} />, label: 'Aviator', active: true },
    { icon: <CircleDot size={20} />, label: 'Cricket' },
    { icon: <Activity size={20} />, label: 'Football' },
    { icon: <Monitor size={20} />, label: 'Live Casino' },
    { icon: <TrendingUp size={20} />, label: 'Popular', badge: 'HOT' },
    { icon: <History size={20} />, label: 'Recent' },
  ];

  const support = [
    { icon: <HelpCircle size={18} />, label: 'FAQ' },
    { icon: <Settings size={18} />, label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-[#121212] border-r border-[#2a2a2a] h-screen fixed left-0 top-[57px] hidden xl:flex flex-col py-6 overflow-y-auto z-40 transition-all shadow-xl">
      <div className="px-6 mb-8">
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Categories</p>
        <div className="flex flex-col gap-1">
          {categories.map((cat, i) => (
            <button
              key={i}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group ${
                cat.active ? 'bg-[#1a1a1a] text-red-500 shadow-inner border border-gray-800' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={cat.active ? 'text-red-500' : 'text-gray-500 group-hover:text-red-500 transition-colors'}>
                  {cat.icon}
                </span>
                <span className="text-sm font-bold">{cat.label}</span>
              </div>
              {cat.badge && (
                <span className="bg-red-600 text-[9px] text-white px-1.5 py-0.5 rounded font-black animate-pulse">
                  {cat.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 mb-8">
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Quick Links</p>
        <div className="flex flex-col gap-1">
          {support.map((item, i) => (
            <button
              key={i}
              className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#1a1a1a] hover:text-white transition-all rounded-lg group"
            >
              <span className="text-gray-500 group-hover:text-gray-300 transition-colors">
                {item.icon}
              </span>
              <span className="text-sm font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;
