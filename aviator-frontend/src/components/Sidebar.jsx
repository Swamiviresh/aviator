import React from 'react';
import {
  Gamepad2,
  History,
  Settings,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

const Sidebar = () => {
  const categories = [
    { icon: <Gamepad2 size={20} />, label: 'Aviator', active: true },
  ];

  return (
    <aside className="w-64 bg-[#121212] border-r border-[#2a2a2a] h-screen fixed left-0 top-[57px] hidden xl:flex flex-col py-6 overflow-y-auto z-40 transition-all shadow-xl">
      <div className="px-6 mb-8">
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Game</p>
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

    </aside>
  );
};

export default Sidebar;
