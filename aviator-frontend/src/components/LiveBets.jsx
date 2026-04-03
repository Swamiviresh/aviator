import React from 'react';

const LiveBets = ({ bets, history }) => {
  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg flex flex-col h-full overflow-hidden">
      <div className="mb-4">
        <h3 className="text-gray-400 font-bold uppercase tracking-wider mb-2">History</h3>
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {history.map((m, i) => (
            <span
              key={i}
              className={`px-3 py-1 rounded text-xs font-bold shadow-sm ${
                parseFloat(m) >= 2.0 ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
              }`}
            >
              {m}x
            </span>
          ))}
          {history.length === 0 && <span className="text-gray-500 italic">No history yet</span>}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-gray-400 font-bold uppercase tracking-wider mb-2">Live Bets ({bets.length})</h3>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 pr-2">
          <table className="w-full text-left">
            <thead className="bg-black text-gray-400 sticky top-0">
              <tr className="text-xs uppercase tracking-wider border-b border-gray-800">
                <th className="p-2">User</th>
                <th className="p-2">Amt</th>
                <th className="p-2">Mult</th>
                <th className="p-2">Payout</th>
              </tr>
            </thead>
            <tbody>
              {bets.map((bet, i) => (
                <tr key={i} className="border-b border-gray-800 text-sm hover:bg-gray-800 transition-colors">
                  <td className="p-2 text-gray-300 font-medium">{bet.username}</td>
                  <td className="p-2 text-green-500 font-bold">${bet.amount}</td>
                  <td className="p-2">
                    {bet.status === 'cashed_out' ? (
                      <span className="text-yellow-500 font-bold">{bet.multiplier.toFixed(2)}x</span>
                    ) : (
                      <span className="text-gray-500">...</span>
                    )}
                  </td>
                  <td className="p-2">
                    {bet.status === 'cashed_out' ? (
                      <span className="text-green-400 font-bold">${(bet.amount * bet.multiplier).toFixed(2)}</span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bets.length === 0 && <p className="text-center text-gray-600 italic py-4">No live bets</p>}
        </div>
      </div>
    </div>
  );
};

export default LiveBets;
