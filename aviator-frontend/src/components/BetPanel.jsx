import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Minus, Zap, ShieldCheck } from 'lucide-react';

const BetPanel = ({ slot = 1 }) => {
  const {
    gameState,
    activeBet1, activeBet2,
    placeBet,
    cashout,
    autoCashout1, setAutoCashout1,
    autoCashout2, setAutoCashout2
  } = useGame();
  const { user } = useAuth();
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const activeBet = slot === 1 ? activeBet1 : activeBet2;
  const autoCashout = slot === 1 ? autoCashout1 : autoCashout2;
  const setAutoCashout = slot === 1 ? setAutoCashout1 : setAutoCashout2;

  const canPlaceBet = (gameState.status === 'WAITING' || gameState.status === 'RUNNING') && !activeBet;
  const isPending = activeBet && activeBet.status === 'pending';
  const canCashout = gameState.status === 'RUNNING' && isPending;

  const handlePlaceBet = async () => {
    setLoading(true);
    setError(null);
    try {
      await placeBet(amount, slot);
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
      await cashout(slot);
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
    <div className="bg-[#1a1a1a] p-3 rounded-xl border border-gray-800 shadow-xl flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-400 font-black uppercase text-[10px] tracking-widest flex items-center gap-1.5">
          <Zap size={12} className="text-red-500" />
          Bet {slot}
        </h3>
        {user && (
          <span className="text-[9px] bg-red-600/10 text-red-500 px-2 py-0.5 rounded font-bold border border-red-900/20 uppercase">
            Ready
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {/* Bet Amount */}
        <div className="bg-black rounded-lg p-2.5 border border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Amount</span>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">USD</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustAmount(-1)}
              disabled={!canPlaceBet}
              className="w-7 h-7 rounded-full bg-gray-900 hover:bg-gray-800 flex items-center justify-center text-gray-400 transition-colors disabled:opacity-30"
            >
              <Minus size={13} />
            </button>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              disabled={!canPlaceBet}
              className="flex-1 bg-transparent text-center text-xl font-black text-white focus:outline-none"
            />
            <button
              onClick={() => adjustAmount(1)}
              disabled={!canPlaceBet}
              className="w-7 h-7 rounded-full bg-gray-900 hover:bg-gray-800 flex items-center justify-center text-gray-400 transition-colors disabled:opacity-30"
            >
              <Plus size={13} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1 mt-2">
            {[10, 50, 100, 500].map(val => (
              <button
                key={val}
                onClick={() => setAmount(val)}
                disabled={!canPlaceBet}
                className={`py-1 rounded text-[9px] font-black transition-all border ${
                  amount === val
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'bg-[#121212] border-gray-800 text-gray-500 hover:text-white hover:border-gray-600'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Auto Cashout */}
        <div className="bg-black rounded-lg p-2.5 border border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-[9px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck size={11} className="text-green-500" />
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
            <div className="flex items-center gap-2 mt-1.5 bg-[#121212] rounded px-2.5 py-1.5 border border-gray-800">
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

      {error && <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider text-center">{error}</p>}

      {/* Action Button */}
      {isPending ? (
        <button
          onClick={handleCashout}
          disabled={!canCashout || loading}
          className={`w-full h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all transform active:scale-95 disabled:opacity-50 border-2 ${
            canCashout
              ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-[0_6px_20px_rgba(234,88,12,0.35)] border-orange-400/30 animate-pulse'
              : 'bg-gray-800 text-gray-500 border-gray-700'
          }`}
        >
          <span className="text-[9px] font-black uppercase tracking-[0.25em] opacity-80">
            {canCashout ? `Cashout · ${gameState.multiplier}x` : 'Wait for Start'}
          </span>
          <span className="text-2xl font-black tabular-nums">
            {canCashout ? `$${(amount * gameState.multiplier).toFixed(2)}` : '...'}
          </span>
        </button>
      ) : (
        <button
          onClick={handlePlaceBet}
          disabled={!canPlaceBet || loading}
          className={`w-full h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            canPlaceBet
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_6px_20px_rgba(220,38,38,0.3)]'
              : 'bg-gray-800 text-gray-500 border border-gray-700'
          }`}
        >
          {loading ? (
            <span className="animate-pulse text-[10px] font-black uppercase tracking-[0.2em]">Processing...</span>
          ) : (
            <>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                {gameState.status === 'RUNNING'
                  ? 'Queue for Next Round'
                  : gameState.status === 'WAITING'
                  ? 'Place Bet'
                  : 'Wait...'}
              </span>
              <span className="text-xl font-black">${amount}</span>
            </>
          )}
        </button>
      )}

      <div className="flex items-center justify-center gap-1.5 opacity-40">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Secured</span>
      </div>
    </div>
  );
};

export default BetPanel;
