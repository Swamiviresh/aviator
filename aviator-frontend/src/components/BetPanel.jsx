import React, { useState } from 'react';

const BetPanel = ({ onPlaceBet, onCashout, user, activeBet, gameState }) => {
  const [amount, setAmount] = useState(10);

  const canPlaceBet = gameState.status === 'WAITING' && !activeBet;
  const canCashout = gameState.status === 'RUNNING' && activeBet && activeBet.status === 'pending';

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg flex flex-col gap-4">
      <div className="flex justify-between items-center mb-4">
        <span className="text-gray-400 font-bold uppercase tracking-wider">Balance</span>
        <span className="text-green-500 font-extrabold text-xl">${user ? user.balance.toFixed(2) : '0.00'}</span>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-gray-400 text-sm">Bet Amount</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!canPlaceBet}
            className="w-full bg-black border border-gray-700 text-white rounded p-3 text-lg font-bold focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {[1, 2, 5, 10].map(val => (
            <button
              key={val}
              onClick={() => setAmount(val)}
              disabled={!canPlaceBet}
              className="bg-gray-800 hover:bg-gray-700 text-sm py-1 rounded transition-colors"
            >
              +{val}
            </button>
          ))}
        </div>
      </div>

      {canCashout ? (
        <button
          onClick={onCashout}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-lg shadow-lg transform active:scale-95 transition-all text-xl uppercase tracking-widest"
        >
          CASH OUT ({(amount * gameState.multiplier).toFixed(2)})
        </button>
      ) : (
        <button
          onClick={() => onPlaceBet(amount)}
          disabled={!canPlaceBet}
          className={`w-full font-bold py-4 rounded-lg shadow-lg transform active:scale-95 transition-all text-xl uppercase tracking-widest ${
            canPlaceBet 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {gameState.status === 'WAITING' ? 'BET' : 'WAITING...'}
        </button>
      )}

      {activeBet && activeBet.status === 'pending' && (
        <p className="text-center text-sm text-yellow-500 font-medium">Bet placed: ${activeBet.amount}</p>
      )}
    </div>
  );
};

export default BetPanel;
