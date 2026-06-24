'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Plus, Minus, Play, Square, Zap, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

const GAME_SERVER_PORT = 3003;

interface AdminUser {
  id: number;
  username: string;
  balance: number;
  role: string;
  totalBets: number;
  createdAt: string;
}

interface Transaction {
  id: number;
  userId: number;
  username: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

type Tab = 'users' | 'transactions' | 'controls';

export default function AdminDashboard() {
  const { token, user, setView } = useAuthStore();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [balanceUserId, setBalanceUserId] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [gameStopped, setGameStopped] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }), [token]);

  // Socket connection for game controls
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const socket = io(`/?XTransformPort=${GAME_SERVER_PORT}`, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('gameUpdate', (data: { adminStopped?: boolean }) => {
      if (typeof data.adminStopped === 'boolean') setGameStopped(data.adminStopped);
    });

    socket.on('adminResult', (data: { message: string; success: boolean }) => {
      toast.success(data.message);
    });

    return () => { socket.disconnect(); };
  }, [user]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { headers: authHeaders() });
      if (!res.ok) throw new Error();
      setUsers(await res.json());
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/transactions', { headers: authHeaders() });
      if (!res.ok) throw new Error();
      setTransactions(await res.json());
    } catch {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    else if (tab === 'transactions') fetchTransactions();
  }, [tab, fetchUsers, fetchTransactions]);

  const handleBalanceAction = async (action: 'add' | 'deduct') => {
    const userId = Number(balanceUserId);
    const amount = Number(balanceAmount);
    if (!userId || !amount || amount <= 0) {
      toast.error('Enter valid user ID and amount');
      return;
    }
    try {
      const res = await fetch('/api/admin/balance', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId, amount, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${action === 'add' ? 'Added' : 'Deducted'} ₹${amount} — New balance: ₹${data.newBalance.toFixed(0)}`);
      setBalanceAmount('');
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Delete this user and all their data?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      toast.success('User deleted');
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleGameControl = (action: 'start' | 'stop' | 'crash') => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit('adminControl', { userId: user.id, action });
  };

  return (
    <div className="bg-mesh noise-overlay min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-strong !rounded-none border-x-0 border-t-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 md:px-6 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('game')} className="text-white/40 hover:text-white transition-colors" aria-label="Back to game">
              <ArrowLeft className="size-5" />
            </button>
            <span className="text-lg font-bold text-white/80">Admin Dashboard</span>
          </div>
          <span className="glass-subtle px-3 py-1.5 rounded-lg text-xs text-white/40">
            {user?.username}
          </span>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {([
            { key: 'users' as Tab, label: 'Users', icon: <Users className="size-4" /> },
            { key: 'transactions' as Tab, label: 'Transactions', icon: <RefreshCw className="size-4" /> },
            { key: 'controls' as Tab, label: 'Game Controls', icon: <Zap className="size-4" /> },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t.key
                  ? 'glass-btn text-white'
                  : 'glass-btn-ghost text-white/40 hover:text-white/70'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {tab === 'users' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Balance adjustment */}
            <div className="glass p-4 md:p-5">
              <h3 className="text-white/60 text-sm font-medium mb-3">Adjust User Balance</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  placeholder="User ID"
                  value={balanceUserId}
                  onChange={(e) => setBalanceUserId(e.target.value)}
                  className="glass-input flex-1 p-2.5 text-sm"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  className="glass-input flex-1 p-2.5 text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={() => handleBalanceAction('add')} className="glass-btn-green px-4 py-2.5 rounded-lg text-sm flex items-center gap-1.5">
                    <Plus className="size-4" /> Add
                  </button>
                  <button onClick={() => handleBalanceAction('deduct')} className="glass-btn-red px-4 py-2.5 rounded-lg text-sm flex items-center gap-1.5">
                    <Minus className="size-4" /> Deduct
                  </button>
                </div>
              </div>
            </div>

            {/* Users table */}
            <div className="glass overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-white/60 text-sm font-medium">All Users ({users.length})</h3>
                <button onClick={fetchUsers} className="text-white/30 hover:text-white/60 transition-colors">
                  <RefreshCw className="size-4" />
                </button>
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[rgba(7,7,13,0.9)] backdrop-blur-sm">
                    <tr className="border-b border-white/5 text-white/30 text-xs uppercase">
                      <th className="text-left px-4 py-3">ID</th>
                      <th className="text-left px-4 py-3">Username</th>
                      <th className="text-left px-4 py-3">Balance</th>
                      <th className="text-left px-4 py-3">Role</th>
                      <th className="text-left px-4 py-3">Bets</th>
                      <th className="text-right px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-white/40">{u.id}</td>
                        <td className="px-4 py-3 text-white font-medium">{u.username}</td>
                        <td className="px-4 py-3 text-green-400 font-medium">₹{u.balance.toFixed(0)}</td>
                        <td className="px-4 py-3">
                          <span className={u.role === 'admin' ? 'text-primary text-xs font-medium' : 'text-white/30 text-xs'}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/40">{u.totalBets}</td>
                        <td className="px-4 py-3 text-right">
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-400/50 hover:text-red-400 transition-colors p-1"
                              aria-label={`Delete user ${u.username}`}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-12 text-white/20">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Transactions Tab */}
        {tab === 'transactions' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-white/60 text-sm font-medium">Recent Transactions ({transactions.length})</h3>
                <button onClick={fetchTransactions} className="text-white/30 hover:text-white/60 transition-colors">
                  <RefreshCw className="size-4" />
                </button>
              </div>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[rgba(7,7,13,0.9)] backdrop-blur-sm">
                    <tr className="border-b border-white/5 text-white/30 text-xs uppercase">
                      <th className="text-left px-4 py-3">User</th>
                      <th className="text-left px-4 py-3">Type</th>
                      <th className="text-left px-4 py-3">Amount</th>
                      <th className="text-left px-4 py-3">Description</th>
                      <th className="text-left px-4 py-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{t.username}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                            t.type === 'cashout' || t.type === 'credit' ? 'bg-green-500/15 text-green-400' :
                            t.type === 'bet' || t.type === 'debit' ? 'bg-red-500/15 text-red-400' :
                            'bg-white/10 text-white/50'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/70 font-medium">₹{t.amount.toFixed(0)}</td>
                        <td className="px-4 py-3 text-white/40 text-xs max-w-[200px] truncate">{t.description}</td>
                        <td className="px-4 py-3 text-white/30 text-xs">{new Date(t.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-12 text-white/20">No transactions</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Game Controls Tab */}
        {tab === 'controls' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="glass p-6 md:p-8">
              <h3 className="text-white font-semibold text-lg mb-2">Game Control Panel</h3>
              <p className="text-white/30 text-sm mb-6">Start, stop, or force-crash the current game round.</p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleGameControl('start')}
                  disabled={!gameStopped}
                  className="glass-btn-green px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Play className="size-4" /> Start Game
                </button>
                <button
                  onClick={() => handleGameControl('stop')}
                  disabled={gameStopped}
                  className="glass-btn-red px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Square className="size-4" /> Stop Game
                </button>
                <button
                  onClick={() => handleGameControl('crash')}
                  className="glass-btn px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
                >
                  <Zap className="size-4" /> Force Crash
                </button>
              </div>

              <div className="mt-6 glass-subtle p-4 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${gameStopped ? 'bg-red-500' : 'bg-green-500'} animate-pulse`} />
                  <span className="text-white/50 text-sm">Game is {gameStopped ? 'STOPPED' : 'RUNNING'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}