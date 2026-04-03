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

        <main className="flex-1 flex flex-col xl:ml-64 p-3 lg:p-4 gap-3 overflow-hidden">
          {/* History Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <div className="flex items-center gap-1.5 bg-[#111] px-2.5 py-1 rounded-lg border border-gray-800 shrink-0">
              <Clock size={12} className="text-gray-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">History</span>
            </div>
            {gameState.history.map((val, i) => (
              <span
                key={i}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border transition-all cursor-default ${
                  parseFloat(val) < 2
                    ? 'text-blue-400 border-blue-900/30 bg-blue-600/10'
                    : parseFloat(val) < 10
                    ? 'text-purple-400 border-purple-900/30 bg-purple-600/10'
                    : 'text-pink-400 border-pink-900/30 bg-pink-600/10'
                }`}
              >
                {val}x
              </span>
            ))}
          </div>

          <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0">
            {/* Center: Canvas + Bets */}
            <div className="flex-[2.5] flex flex-col gap-3 min-h-0">
              {/* Canvas — smaller */}
              <div className="relative min-h-[220px] max-h-[280px] bg-[#050505] rounded-2xl border border-gray-800/50 overflow-hidden shadow-2xl" style={{ height: '260px' }}>
                <PlaneCanvas multiplier={gameState.multiplier} status={gameState.status} />

                {gameState.status === 'WAITING' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-20">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px] mb-1">Next Round In</p>
                      <p className="text-5xl font-black text-white tabular-nums">{gameState.timer}s</p>
                    </div>
                  </div>
                )}

                {gameState.status === 'STOPPED' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-xl z-20">
                    <div className="text-center px-8 py-6 border border-red-900/30 bg-red-600/5 rounded-2xl">
                      <p className="text-red-500 font-black uppercase tracking-[0.3em] text-xs mb-1">Maintenance</p>
                      <p className="text-3xl font-black text-white mb-3">GAME PAUSED</p>
                      <p className="text-gray-500 text-xs font-bold uppercase max-w-xs mx-auto">Administrator has suspended new rounds.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bet Panels — smaller */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <BetPanel slot={1} />
                <div className="hidden md:block">
                  <BetPanel slot={2} />
                </div>
              </div>
            </div>

            {/* Right: Live Bets */}
            <aside className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a] rounded-2xl border border-gray-800/50 overflow-hidden shadow-xl">
              <LiveBets bets={gameState.bets} history={gameState.history} />
            </aside>
          </div>
        </main>
      </div>

      <footer className="xl:ml-64 p-3 border-t border-gray-900 flex justify-center items-center bg-[#050505]">
        <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.2em]">© 2024 Aviator Pro • Provably Fair</p>
      </footer>
    </div>
  );
};

export default Game;
