import React from 'react';
import { useGame } from '../context/GameContext';
import PlaneCanvas from '../components/PlaneCanvas';
import BetPanel from '../components/BetPanel';
import LiveBets from '../components/LiveBets';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Clock } from 'lucide-react';

const Game = () => {
  const { gameState } = useGame();

  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-red-600/30">
      <Navbar />

      <div className="flex flex-1 relative">
        <Sidebar />

        <main className="flex-1 flex flex-col xl:ml-64 p-4 lg:p-6 gap-6 overflow-hidden">
          {/* Top Bar with History */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
             <div className="flex items-center gap-2 bg-[#111] px-3 py-1.5 rounded-lg border border-gray-800 shrink-0">
               <Clock size={14} className="text-gray-500" />
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">History</span>
             </div>
             {gameState.history.map((val, i) => (
               <span
                key={i}
                className={`px-3 py-1 rounded-full text-[11px] font-black border transition-all hover:scale-110 cursor-default ${
                  parseFloat(val) < 2
                  ? 'text-blue-400 border-blue-900/30 bg-blue-600/10'
                  : parseFloat(val) < 10
                  ? 'text-purple-400 border-purple-900/30 bg-purple-600/10'
                  : 'text-pink-400 border-pink-900/30 bg-pink-600/10 shadow-[0_0_10px_rgba(236,72,153,0.2)]'
                }`}
               >
                 {val}x
               </span>
             ))}
          </div>

          <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
            {/* Left/Center: Game Canvas & Control */}
            <div className="flex-[2.5] flex flex-col gap-6 min-h-0">
              <div className="flex-1 relative min-h-[400px] bg-[#050505] rounded-3xl border border-gray-800/50 overflow-hidden shadow-2xl">
                <PlaneCanvas multiplier={gameState.multiplier} status={gameState.status} />

                {gameState.status === 'WAITING' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-20">
                    <div className="text-center">
                      <div className="w-24 h-24 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mx-auto mb-6"></div>
                      <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-xs mb-2">Next Round In</p>
                      <p className="text-6xl font-black text-white tabular-nums">{gameState.timer}s</p>
                    </div>
                  </div>
                )}

                {gameState.status === 'STOPPED' && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-xl z-20">
                    <div className="text-center px-10 py-8 border border-red-900/30 bg-red-600/5 rounded-3xl">
                      <p className="text-red-500 font-black uppercase tracking-[0.3em] text-sm mb-2">Maintenance</p>
                      <p className="text-4xl font-black text-white mb-4">GAME PAUSED</p>
                      <p className="text-gray-500 text-xs font-bold uppercase max-w-xs mx-auto">The administrator has temporarily suspended new rounds. Please check back shortly.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Responsive Bet Panel Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <BetPanel />
                 <div className="hidden md:block">
                    <BetPanel /> {/* Show two panels on desktop like pro apps */}
                 </div>
              </div>
            </div>

            {/* Right: Live Bets */}
            <aside className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a] rounded-3xl border border-gray-800/50 overflow-hidden shadow-xl">
              <LiveBets bets={gameState.bets} history={gameState.history} />
            </aside>
          </div>
        </main>
      </div>

      {/* Footer / Mobile Nav */}
      <footer className="xl:ml-64 p-4 border-t border-gray-900 flex justify-between items-center bg-[#050505]">
         <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Network Status</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-gray-300">Operational</span>
              </div>
            </div>
            <div className="h-8 w-px bg-gray-800 hidden sm:block"></div>
            <div className="flex flex-col hidden sm:flex">
              <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Server Time</span>
              <span className="text-[10px] font-bold text-gray-300 font-mono">{new Date().toLocaleTimeString()}</span>
            </div>
         </div>
         <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.2em]">© 2024 Aviator Pro • Provably Fair</p>
      </footer>
    </div>
  );
};

export default Game;
