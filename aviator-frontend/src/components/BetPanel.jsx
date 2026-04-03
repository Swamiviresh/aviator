import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Minus, Zap, ShieldCheck } from 'lucide-react';

const BetPanel = () => {
  const { gameState, activeBet, placeBet, cashout, autoCashout, setAutoCashout } = useGame();
  const { user } = useAuth();
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canPlaceBet = gameState.status === 'WAITING' && !activeBet;
  const isPending = activeBet && activeBet.status === 'pending';
  const canCashout = gameState.status === 'RUNNING' && isPending;

  const handlePlaceBet = async () => {
    setLoading(true);
    setError(null);
    try {
      await placeBet(amount);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCashout = async () => {
    setLoading(true);
    setError(null);
    try {
      await cashout();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const adjustAmount = (val) => {
    setAmount(prev => Math.max(1, prev + val));
  };

  return (
    <div className="bg-[#1a1a1a] p-4 lg:p-6 rounded-2xl border border-gray-800 shadow-2xl flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-400 font-black uppercase text-xs tracking-widest flex items-center gap-2">
          <Zap size={14} className="text-red-500" />
          Quick Bet
        </h3>
        {user && (
            <span className="text-[10px] bg-red-600/10 text-red-500 px-2 py-0.5 rounded font-bold border border-red-900/20 uppercase">
                Ready to play
            </span>
        )}
      </div>

      <div className="flex flex-col gap-5">
        {/* Bet Amount Input */}
        <div className="bg-black rounded-xl p-3 border border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Amount</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">USD</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => adjustAmount(-1)}
              disabled={!canPlaceBet}
              className="w-8 h-8 rounded-full bg-gray-900 hover:bg-gray-800 flex items-center justify-center text-gray-400 transition-colors disabled:opacity-30"
            >
              <Minus size={16} />
            </button>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              disabled={!canPlaceBet}
              className="flex-1 bg-transparent text-center text-2xl font-black text-white focus:outline-none"
            />
            <button
              onClick={() => adjustAmount(1)}
              disabled={!canPlaceBet}
              className="w-8 h-8 rounded-full bg-gray-900 hover:bg-gray-800 flex items-center justify-center text-gray-400 transition-colors disabled:opacity-30"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5 mt-4">
            {[10, 50, 100, 500].map(val => (
              <button
                key={val}
                onClick={() => setAmount(val)}
                disabled={!canPlaceBet}
                className={`py-1.5 rounded-lg text-[10px] font-black transition-all border ${
                  amount === val ? 'bg-red-600 border-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.3)]' : 'bg-[#121212] border-gray-800 text-gray-500 hover:text-white hover:border-gray-600'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Auto Cashout Section */}
        <div className="bg-black rounded-xl p-3 border border-gray-800">
           <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={12} className="text-green-500" />
              Auto Cashout
            </h3>
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={!!autoCashout}
                onChange={(e) => setAutoCashout(e.target.checked ? 2.0 : null)}
              />
              <div className="w-8 h-4 bg-gray-800 rounded-full peer peer-checked:bg-green-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
            </div>
          </div>
          {autoCashout !== null && (
            <div className="flex items-center gap-3 mt-2 bg-[#121212] rounded-lg px-3 py-2 border border-gray-800">
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={autoCashout}
                onChange={(e) => setAutoCashout(parseFloat(e.target.value) || 0)}
                className="flex-1 bg-transparent text-sm font-black text-green-500 focus:outline-none"
              />
              <span className="text-xs font-bold text-gray-500">X</span>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider text-center">{error}</p>}

      {canCashout ? (
        <button
          onClick={handleCashout}
          disabled={loading}
          className="w-full h-20 bg-green-500 hover:bg-green-600 text-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-[0_10px_30px_rgba(34,197,94,0.3)] transition-all transform active:scale-95 disabled:opacity-50"
        >
          <span className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Cashout</span>
          <span className="text-3xl font-black">
            ${(amount * gameState.multiplier).toFixed(2)}
          </span>
        </button>
      ) : (
        <button
          onClick={handlePlaceBet}
          disabled={!canPlaceBet || loading}
          className={`w-full h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            canPlaceBet 
            ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_10px_30px_rgba(220,38,38,0.3)]'
            : 'bg-gray-800 text-gray-500 border border-gray-700'
          }`}
        >
          {loading ? (
            <span className="animate-pulse text-xs font-black uppercase tracking-[0.2em]">Processing...</span>
          ) : (
            <>
              <span className="text-xs font-black uppercase tracking-[0.2em]">
                {gameState.status === 'WAITING' ? 'Place Bet' : 'Wait Next Round'}
              </span>
              <span className="text-2xl font-black">
                {gameState.status === 'WAITING' ? `$${amount}` : '...'}
              </span>
            </>
          )}
        </button>
      )}

      <div className="flex items-center justify-center gap-1.5 opacity-50">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Secured Payment System</span>
      </div>
    </div>
  );
};

export default BetPanel;
