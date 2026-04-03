import React from 'react';

const LiveBets = ({ bets }) => {
  return (
    <div className="bg-[#0a0a0a] text-white p-4 flex flex-col h-full overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-gray-500 font-black uppercase tracking-[0.2em] text-[10px]">All Bets</h3>
           <span className="bg-red-600/10 text-red-500 px-2 py-0.5 rounded text-[10px] font-black border border-red-900/30">
             LIVE: {bets.length}
           </span>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <table className="w-full text-left border-separate border-spacing-y-1">
            <thead className="bg-[#050505] text-gray-500 sticky top-0 z-10">
              <tr className="text-[9px] font-black uppercase tracking-widest">
                <th className="px-3 py-2 first:rounded-l-lg">User</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Mult</th>
                <th className="px-3 py-2 last:rounded-r-lg text-right">Cashout</th>
              </tr>
            </thead>
            <tbody className="text-[11px] font-bold">
              {bets.map((bet, i) => (
                <tr key={i} className={`group transition-all ${bet.status === 'cashed_out' ? 'bg-green-600/5' : 'hover:bg-white/5'}`}>
                  <td className="px-3 py-2 first:rounded-l-lg text-gray-300">
                    {bet.username.substring(0, 3)}***
                  </td>
                  <td className="px-3 py-2 text-gray-100">${bet.amount.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    {bet.status === 'cashed_out' ? (
                      <span className="text-yellow-500">{bet.multiplier.toFixed(2)}x</span>
                    ) : (
                      <span className="text-gray-700">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 last:rounded-r-lg text-right">
                    {bet.status === 'cashed_out' ? (
                      <span className="text-green-500">${(bet.amount * bet.multiplier).toFixed(2)}</span>
                    ) : (
                      <span className="text-gray-700">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-700">
               <div className="w-12 h-12 rounded-full border-2 border-gray-900 mb-4 animate-pulse"></div>
               <p className="text-[10px] font-black uppercase tracking-widest">Waiting for bets...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveBets;
