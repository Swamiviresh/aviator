import React, { useState, useEffect } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import {
  Users, DollarSign, Play, Square, Plus, Minus, X, Activity,
  Trash2, History, LayoutDashboard, AlertCircle, RefreshCw
} from 'lucide-react';

const Admin = () => {
  const { user: currentUser } = useAuth();
  const { gameState } = useGame();
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'users', 'transactions'
  const [modal, setModal] = useState({ show: false, type: 'add', user: null, amount: '' });

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/api/admin/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to fetch transactions', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'transactions') fetchTransactions();
    if (activeTab === 'dashboard') {
      fetchUsers();
      fetchTransactions();
    }
  }, [activeTab]);

  const handleGameControl = async (action) => {
    try {
      await api.post('/api/admin/game-control', { action });
      if (action === 'crash') {
        alert('Game force crashed successfully');
      } else {
        alert(`Game ${action === 'stop' ? 'stopped' : 'started'} successfully`);
      }
    } catch (error) {
      console.error('Failed to control game', error);
      alert(error.response?.data?.error || 'Failed to control game');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      alert('User deleted successfully');
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleBalanceUpdate = async () => {
    const endpoint = modal.type === 'add' ? '/api/admin/add-balance' : '/api/admin/deduct-balance';
    try {
      await api.post(endpoint, { userId: modal.user.id, amount: modal.amount });
      alert('Balance updated successfully');
      setModal({ show: false, type: 'add', user: null, amount: '' });
      fetchUsers();
      fetchTransactions();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update balance');
    }
  };

  if (currentUser?.role !== 'admin') {
    return <div className="p-10 text-center text-white">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 p-4 lg:p-8">
        {/* Admin Sidebar */}
        <aside className="w-full lg:w-64 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'dashboard' ? 'bg-red-600 shadow-lg shadow-red-900/20 text-white' : 'bg-[#111] text-gray-500 hover:text-white border border-gray-800'}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'users' ? 'bg-red-600 shadow-lg shadow-red-900/20 text-white' : 'bg-[#111] text-gray-500 hover:text-white border border-gray-800'}`}
          >
            <Users size={18} />
            Users
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'transactions' ? 'bg-red-600 shadow-lg shadow-red-900/20 text-white' : 'bg-[#111] text-gray-500 hover:text-white border border-gray-800'}`}
          >
            <History size={18} />
            Transactions
          </button>
        </aside>

        <main className="flex-1">
          {activeTab === 'dashboard' && (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tight">System Status</h1>
                  <p className="text-gray-500 text-sm font-bold uppercase mt-1 tracking-widest">Global game controls</p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => handleGameControl('start')}
                    disabled={!gameState.adminStopped}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-30 px-6 py-3 rounded-xl font-black uppercase text-sm transition-all shadow-lg shadow-green-900/20"
                  >
                    <Play size={18} fill="currentColor" />
                    Start Game
                  </button>
                  <button
                    onClick={() => handleGameControl('stop')}
                    disabled={gameState.adminStopped}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-30 px-6 py-3 rounded-xl font-black uppercase text-sm transition-all shadow-lg shadow-red-900/20"
                  >
                    <Square size={18} fill="currentColor" />
                    Stop Game
                  </button>
                  <button
                    onClick={() => handleGameControl('crash')}
                    disabled={gameState.status !== 'RUNNING'}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-30 px-6 py-3 rounded-xl font-black uppercase text-sm transition-all shadow-lg shadow-orange-900/20"
                  >
                    <AlertCircle size={18} />
                    Force Crash
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-[#111] p-6 rounded-2xl border border-gray-800">
             <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center text-red-500">
                 <Users size={24} />
               </div>
               <div>
                 <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Total Users</p>
                 <p className="text-2xl font-black">{users.length}</p>
               </div>
             </div>
          </div>
          <div className="bg-[#111] p-6 rounded-2xl border border-gray-800">
             <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-green-600/10 rounded-xl flex items-center justify-center text-green-500">
                 <DollarSign size={24} />
               </div>
               <div>
                 <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Total Balance</p>
                 <p className="text-2xl font-black">${users.reduce((acc, u) => acc + u.balance, 0).toFixed(2)}</p>
               </div>
             </div>
          </div>
          <div className="bg-[#111] p-6 rounded-2xl border border-gray-800">
             <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500">
                 <Activity size={24} />
               </div>
               <div>
                 <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Total Bets</p>
                 <p className="text-2xl font-black">{users.reduce((acc, u) => acc + (u.totalBets || 0), 0)}</p>
               </div>
             </div>
          </div>
          <div className="bg-[#111] p-6 rounded-2xl border border-gray-800 flex items-center justify-between">
             <div>
                 <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Game Status</p>
                 <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${gameState.adminStopped ? 'bg-red-600/20 text-red-500 border border-red-900/30' : 'bg-green-600/20 text-green-500 border border-green-900/30'}`}>
                   {gameState.adminStopped ? 'Stopped' : 'Running'}
                 </span>
             </div>
          </div>
        </div>

            </>
          )}

          {activeTab === 'users' && (
            <div className="bg-[#111] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                <h2 className="font-black uppercase tracking-widest text-sm">User Management</h2>
                <button onClick={fetchUsers} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400">
                  <RefreshCw size={12} />
                  Refresh
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-800">
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Username</th>
                      <th className="px-6 py-4">Balance</th>
                      <th className="px-6 py-4">Total Bets</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-gray-500">#{u.id}</td>
                        <td className="px-6 py-4 font-bold">{u.username}</td>
                        <td className="px-6 py-4 font-black text-green-500">${u.balance.toFixed(2)}</td>
                        <td className="px-6 py-4 font-bold">{u.totalBets || 0}</td>
                        <td className="px-6 py-4">
                           <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${u.role === 'admin' ? 'text-red-500 border-red-900/30 bg-red-600/10' : 'text-gray-400 border-gray-700 bg-gray-800/50'}`}>
                             {u.role}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              title="Add Balance"
                              onClick={() => setModal({ show: true, type: 'add', user: u, amount: '' })}
                              className="p-2 bg-green-600/10 text-green-500 hover:bg-green-600 hover:text-white rounded-lg transition-all"
                            >
                              <Plus size={16} />
                            </button>
                            <button
                              title="Deduct Balance"
                              onClick={() => setModal({ show: true, type: 'deduct', user: u, amount: '' })}
                              className="p-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                            >
                              <Minus size={16} />
                            </button>
                            <button
                              title="Delete User"
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-2 bg-gray-800/50 text-gray-400 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="bg-[#111] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                <h2 className="font-black uppercase tracking-widest text-sm">Transaction Logs</h2>
                <button onClick={fetchTransactions} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400">
                  <RefreshCw size={12} />
                  Refresh
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-800">
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-white/[0.02] transition-colors text-sm">
                        <td className="px-6 py-4 font-mono text-gray-500 text-xs">
                          {new Date(t.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-bold">{t.username}</td>
                        <td className="px-6 py-4">
                           <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${['credit', 'cashout'].includes(t.type) ? 'text-green-500 border-green-900/30 bg-green-600/10' : 'text-red-500 border-red-900/30 bg-red-600/10'}`}>
                             {t.type}
                           </span>
                        </td>
                        <td className={`px-6 py-4 text-right font-black ${['credit', 'cashout'].includes(t.type) ? 'text-green-500' : 'text-red-500'}`}>
                          {['credit', 'cashout'].includes(t.type) ? '+' : '-'}${t.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs italic">{t.description}</td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-10 text-center text-gray-500 italic">No transactions found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Balance Modal */}
      {modal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#111] border border-gray-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1a1a1a]">
              <h3 className="font-black uppercase tracking-widest text-sm">
                {modal.type === 'add' ? 'Add Credits' : 'Deduct Credits'}
              </h3>
              <button onClick={() => setModal({ ...modal, show: false })} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">User</p>
                <div className="bg-black p-3 rounded-xl border border-gray-800 font-bold">
                  {modal.user.username}
                </div>
              </div>
              <div className="mb-8">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Amount</p>
                <input
                  type="number"
                  value={modal.amount}
                  onChange={(e) => setModal({ ...modal, amount: e.target.value })}
                  placeholder="Enter amount..."
                  className="w-full bg-black border border-gray-800 rounded-xl p-3 text-xl font-black focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <button
                onClick={handleBalanceUpdate}
                className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all ${
                  modal.type === 'add' ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20' : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20'
                }`}
              >
                Confirm {modal.type === 'add' ? 'Credit' : 'Debit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
