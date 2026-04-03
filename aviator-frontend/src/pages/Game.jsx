import React from 'react';
import { useGameState } from '../hooks/useGameState';
import PlaneCanvas from '../components/PlaneCanvas';
import BetPanel from '../components/BetPanel';
import LiveBets from '../components/LiveBets';

const Game = () => {
  const { gameState, user, activeBet, placeBet, cashout } = useGameState();

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <header className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 shadow-xl z-10">
        <h1 className="text-2xl font-black text-red-600 tracking-tighter">AVIATOR</h1>
        {user && (
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase font-bold">Player</p>
              <p className="font-bold text-gray-200 text-sm">{user.username}</p>
            </div>
            <div className="text-right border-l border-gray-700 pl-6">
              <p className="text-[10px] text-gray-400 uppercase font-bold">Balance</p>
              <p className="font-extrabold text-green-500 text-lg">${user.balance.toFixed(2)}</p>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        {/* Left: Bet Panel */}
        <aside className="w-full lg:w-80 flex flex-col gap-4">
          <BetPanel 
            onPlaceBet={placeBet} 
            onCashout={cashout} 
            user={user} 
            activeBet={activeBet} 
            gameState={gameState} 
          />
        </aside>

        {/* Center: Plane Canvas */}
        <div className="flex-1 flex flex-col relative min-h-0 bg-gray-950 rounded-xl overflow-hidden border border-gray-800">
          <div className="flex-1 relative">
            <PlaneCanvas multiplier={gameState.multiplier} status={gameState.status} />
            {gameState.status === 'WAITING' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-20">
                <div className="text-center">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Next Round Starts In</p>
                  <p className="text-5xl font-black text-red-600 animate-pulse">{gameState.timer}s</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right: Live Bets / History */}
        <aside className="w-full lg:w-96 flex flex-col min-h-0">
          <LiveBets bets={gameState.bets} history={gameState.history} />
        </aside>
      </main>
    </div>
  );
};

export default Game;
