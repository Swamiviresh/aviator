'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Shield, Plane, Minus, Plus, X, Users, History } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useGameStore, type GameStatus, type Bet } from '@/store/gameStore';

// ── Constants ──────────────────────────────────────────────────
const GAME_SERVER_PORT = 3003;
const CANVAS_POINTS = 200;
const PRESET_AMOUNTS = [10, 50, 100, 500, 1000];

// ── Helpers ────────────────────────────────────────────────────
function getHistoryBadgeClass(val: string) {
  const n = parseFloat(val);
  if (n < 2) return 'badge-low';
  if (n < 5) return 'badge-mid';
  return 'badge-high';
}

function getMultiplierColor(status: GameStatus, multiplier: number) {
  if (status === 'CRASHED') return 'text-red-500';
  if (status === 'WAITING' || status === 'STOPPED') return 'text-white/40';
  if (multiplier < 2) return 'text-green-400';
  if (multiplier < 5) return 'text-green-300';
  return 'text-yellow-400';
}

function getMultiplierGlow(status: GameStatus, multiplier: number) {
  if (status === 'CRASHED') return '0 0 60px rgba(239, 68, 68, 0.5)';
  if (status === 'WAITING') return 'none';
  if (multiplier < 2) return '0 0 40px rgba(74, 222, 128, 0.3)';
  return '0 0 60px rgba(250, 204, 21, 0.4)';
}

// ── Multiplier Canvas ─────────────────────────────────────────
function MultiplierCanvas({ status, multiplier }: { status: GameStatus; multiplier: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const animFrameRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0, 0, W, H);

    if (status === 'WAITING' || status === 'STOPPED') {
      // Draw subtle grid
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(0, H * (i / 5));
        ctx.lineTo(W, H * (i / 5));
        ctx.stroke();
      }
      return;
    }

    if (status === 'CRASHED') {
      // Draw final state
      const pts = pointsRef.current;
      if (pts.length < 2) return;

      // Gradient fill under curve
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.15)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

      ctx.beginPath();
      ctx.moveTo(pts[0].x, H);
      pts.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length - 1].x, H);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Glow
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.shadowBlur = 0;
      return;
    }

    // RUNNING state - add point and draw
    const maxMult = Math.max(multiplier, 2);
    const x = (pointsRef.current.length / CANVAS_POINTS) * W;
    const y = H - ((multiplier - 1) / (maxMult - 1)) * (H * 0.85) - H * 0.05;

    if (x <= W) {
      pointsRef.current.push({ x, y });
    }

    const pts = pointsRef.current;
    if (pts.length < 2) return;

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(74, 222, 128, 0.12)');
    grad.addColorStop(1, 'rgba(74, 222, 128, 0.0)');

    ctx.beginPath();
    ctx.moveTo(pts[0].x, H);
    pts.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Glow
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Plane at tip
    const tip = pts[pts.length - 1];
    ctx.save();
    ctx.translate(tip.x, tip.y - 15);
    ctx.rotate(-Math.PI / 6);
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✈️', 0, 0);
    ctx.restore();

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, H * (i / 5));
      ctx.lineTo(W, H * (i / 5));
      ctx.stroke();
    }
  }, [status, multiplier]);

  useEffect(() => {
    if (status === 'RUNNING') {
      const animate = () => {
        draw();
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
      return () => cancelAnimationFrame(animFrameRef.current);
    } else {
      draw();
    }
  }, [status, draw]);

  useEffect(() => {
    if (status === 'WAITING') {
      pointsRef.current = [];
    }
  }, [status]);

  return (
    <div className="relative w-full h-full min-h-[280px] md:min-h-[350px]">
      <canvas ref={canvasRef} className="w-full h-full rounded-2xl" />
    </div>
  );
}

// ── Bet Panel ─────────────────────────────────────────────────
function BetPanel({
  slotId,
  status,
  myBet,
  myQueuedBet,
  balance,
  onBet,
  onCashout,
  onCancel,
}: {
  slotId: number;
  status: GameStatus;
  myBet: Bet | undefined;
  myQueuedBet: Bet | undefined;
  balance: number;
  onBet: (amount: number, slotId: number) => void;
  onCashout: (slotId: number) => void;
  onCancel: (slotId: number) => void;
}) {
  const [amount, setAmount] = useState(100);
  const hasBet = myBet?.status === 'pending';
  const hasQueued = !!myQueuedBet;

  const canBet = status === 'WAITING' && !hasBet && !hasQueued;
  const canQueue = (status === 'RUNNING' || status === 'CRASHED') && !hasQueued;
  const canCashout = status === 'RUNNING' && hasBet;
  const canCancel = (status === 'WAITING' && hasBet) || hasQueued;

  return (
    <div className="glass p-4 md:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Bet Slot {slotId}</span>
        {myBet?.status === 'cashed_out' && (
          <span className="text-green-400 text-xs font-medium">Won ₹{myBet.payout?.toFixed(0)}</span>
        )}
      </div>

      {/* Amount controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setAmount((a) => Math.max(10, a - (a >= 100 ? 50 : 10)))}
          className="glass-btn-ghost w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white"
          disabled={hasBet || hasQueued}
        >
          <Minus className="size-4" />
        </button>
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(10, Number(e.target.value) || 0))}
            className="glass-input w-full pl-7 pr-3 py-2 text-center text-white font-medium text-lg"
            disabled={hasBet || hasQueued}
            min={10}
          />
        </div>
        <button
          onClick={() => setAmount((a) => a + (a >= 100 ? 50 : 10))}
          className="glass-btn-ghost w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white"
          disabled={hasBet || hasQueued}
        >
          <Plus className="size-4" />
        </button>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-1.5 flex-wrap">
        {PRESET_AMOUNTS.map((v) => (
          <button
            key={v}
            onClick={() => setAmount(v)}
            className={`flex-1 min-w-0 py-1 rounded-md text-xs font-medium transition-all ${
              amount === v ? 'bg-primary/20 text-primary border border-primary/30' : 'glass-btn-ghost text-white/40'
            }`}
            disabled={hasBet || hasQueued}
          >
            {v >= 1000 ? `${v / 1000}k` : v}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-1">
        {(canBet || canQueue) && (
          <button
            onClick={() => onBet(amount, slotId)}
            disabled={amount > balance || amount < 10}
            className="glass-btn flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {canQueue ? 'Queue Bet' : 'BET'}
          </button>
        )}
        {canCashout && (
          <button
            onClick={() => onCashout(slotId)}
            className="glass-btn-green flex-1 py-3 rounded-xl text-sm font-bold animate-pulse"
          >
            CASH OUT {status === 'RUNNING' ? `${parseFloat(useGameStore.getState().multiplier.toFixed(2))}x` : ''}
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => onCancel(slotId)}
            className="glass-btn-red flex-1 py-3 rounded-xl text-sm font-semibold"
          >
            CANCEL
          </button>
        )}
      </div>

      {/* Bet info */}
      {hasBet && status === 'RUNNING' && (
        <div className="text-center">
          <span className="text-white/30 text-xs">Potential: </span>
          <span className="text-green-400 text-sm font-medium">
            ₹{(myBet.amount * useGameStore.getState().multiplier).toFixed(0)}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Live Bets Panel ────────────────────────────────────────────
function LiveBetsPanel({ bets, status, multiplier }: { bets: Bet[]; status: GameStatus; multiplier: number }) {
  const [open, setOpen] = useState(false);
  const activeBets = bets.filter((b) => b.status === 'pending' || b.status === 'cashed_out');

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden glass-btn-ghost fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full flex items-center justify-center"
      >
        <Users className="size-5" />
        {activeBets.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
            {activeBets.length}
          </span>
        )}
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:block glass w-64 flex-shrink-0 max-h-[calc(100vh-80px)] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
          <Users className="size-4 text-white/40" />
          <span className="text-white/40 text-xs font-medium uppercase tracking-wider">
            Live Bets ({activeBets.length})
          </span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {activeBets.length === 0 && (
            <p className="text-white/20 text-xs text-center py-8">No active bets</p>
          )}
          {activeBets.map((bet, i) => (
            <div key={`${bet.userId}-${bet.slotId}-${i}`} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/50 font-bold flex-shrink-0">
                  {bet.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-white/70 text-xs truncate">{bet.username}</span>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                {bet.status === 'cashed_out' ? (
                  <span className="text-green-400 text-xs font-medium">{bet.multiplier.toFixed(2)}x</span>
                ) : (
                  <span className="text-white/40 text-xs">₹{bet.amount.toFixed(0)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/50"
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="absolute right-0 top-0 bottom-0 w-72 glass-strong !rounded-l-2xl !rounded-r-none flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-white/40" />
                  <span className="text-white/60 text-sm font-medium">Live Bets ({activeBets.length})</span>
                </div>
                <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white"><X className="size-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                {activeBets.map((bet, i) => (
                  <div key={`${bet.userId}-${bet.slotId}-${i}`} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/50 font-bold flex-shrink-0">
                        {bet.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white/70 text-xs truncate">{bet.username}</span>
                    </div>
                    <span className={`text-xs font-medium ${bet.status === 'cashed_out' ? 'text-green-400' : 'text-white/40'}`}>
                      {bet.status === 'cashed_out' ? `${bet.multiplier.toFixed(2)}x` : `₹${bet.amount.toFixed(0)}`}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main Game Page ─────────────────────────────────────────────
export default function GamePage() {
  const { token, user, logout, setView } = useAuthStore();
  const game = useGameStore();
  const socketRef = useRef<Socket | null>(null);

  // ── Socket Connection ─────────────────────────────────────
  useEffect(() => {
    if (!token || !user) return;

    const socket = io(`/?XTransformPort=${GAME_SERVER_PORT}`, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('authenticate', { userId: user.id, token });
    });

    socket.on('gameUpdate', (data: Record<string, unknown>) => {
      useGameStore.getState().setGameState({
        status: data.status as GameStatus,
        multiplier: typeof data.multiplier === 'string' ? parseFloat(data.multiplier) : (data.multiplier as number),
        timer: typeof data.timer === 'string' ? parseFloat(data.timer) : (data.timer as number),
        bets: (data.bets as Bet[]) || [],
        queuedBets: (data.queuedBets as Bet[]) || [],
        history: (data.history as string[]) || [],
        adminStopped: (data.adminStopped as boolean) || false,
      });
    });

    socket.on('balanceUpdate', (data: { balance: number }) => {
      useAuthStore.getState().updateBalance(data.balance);
    });

    socket.on('cashoutSuccess', (data: { multiplier: number; payout: number }) => {
      useGameStore.getState().setLastCashout(data);
      toast.success(`Cashed out at ${data.multiplier.toFixed(2)}x — ₹${data.payout.toFixed(0)}`);
    });

    socket.on('betError', (data: { message: string }) => {
      toast.error(data.message);
    });

    socket.on('cashoutError', (data: { message: string }) => {
      toast.error(data.message);
    });

    socket.on('cancelSuccess', (data: { refunded: number }) => {
      toast.success(`₹${data.refunded.toFixed(0)} refunded`);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  // ── Actions ───────────────────────────────────────────────
  const handleBet = useCallback((amount: number, slotId: number) => {
    if (!user || !socketRef.current) return;
    socketRef.current.emit('placeBet', { userId: user.id, username: user.username, amount, slotId });
  }, [user]);

  const handleCashout = useCallback((slotId: number) => {
    if (!user || !socketRef.current) return;
    socketRef.current.emit('cashout', { userId: user.id, slotId });
  }, [user]);

  const handleCancel = useCallback((slotId: number) => {
    if (!user || !socketRef.current) return;
    socketRef.current.emit('cancelBet', { userId: user.id, slotId });
  }, [user]);

  const handleLogout = () => {
    socketRef.current?.disconnect();
    logout();
  };

  const myBets1 = game.getMyBets(user?.id || 0).filter((b) => b.slotId === 1);
  const myBets2 = game.getMyBets(user?.id || 0).filter((b) => b.slotId === 2);
  const myQueued1 = game.getMyQueuedBets(user?.id || 0).filter((b) => b.slotId === 1);
  const myQueued2 = game.getMyQueuedBets(user?.id || 0).filter((b) => b.slotId === 2);

  return (
    <div className="bg-mesh-game noise-overlay min-h-screen flex flex-col">
      {/* ── Top Bar ──────────────────────────────────────── */}
      <header className="glass-strong !rounded-none border-x-0 border-t-0 z-30">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-3 md:px-6 py-2.5">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold tracking-wider text-gradient-orange">AVIATOR</span>
            <div className="hidden sm:flex items-center gap-2 glass-subtle px-3 py-1.5 rounded-lg">
              <span className="text-white/40 text-xs">Balance</span>
              <span className="text-white font-semibold text-sm">₹{(user?.balance || 0).toFixed(0)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile balance */}
            <span className="sm:hidden glass-subtle px-2.5 py-1 rounded-lg text-white font-semibold text-xs">
              ₹{(user?.balance || 0).toFixed(0)}
            </span>
            {user?.role === 'admin' && (
              <button onClick={() => setView('admin')} className="glass-btn-ghost p-2 rounded-lg" aria-label="Admin panel">
                <Shield className="size-4 text-white/50" />
              </button>
            )}
            <span className="hidden md:inline text-white/50 text-sm">{user?.username}</span>
            <button onClick={handleLogout} className="glass-btn-ghost p-2 rounded-lg" aria-label="Logout">
              <LogOut className="size-4 text-white/50" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────── */}
      <div className="flex-1 flex max-w-[1400px] mx-auto w-full">
        <div className="flex-1 flex flex-col p-3 md:p-4 gap-3 overflow-hidden">
          {/* Multiplier Display + Canvas */}
          <div className="glass-strong flex-1 flex flex-col overflow-hidden relative min-h-[300px]">
            {/* Status badge */}
            <div className="absolute top-3 left-3 z-10">
              {game.status === 'WAITING' && (
                <motion.span
                  className="glass-subtle px-3 py-1 rounded-full text-xs font-medium text-white/50 inline-flex items-center gap-1.5"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  Starting in {game.timer.toFixed(0)}s
                </motion.span>
              )}
              {game.status === 'STOPPED' && (
                <span className="glass-subtle px-3 py-1 rounded-full text-xs font-medium text-red-400/70 inline-flex items-center gap-1.5">
                  Game Stopped
                </span>
              )}
            </div>

            {/* History in top-right */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
              <History className="size-3 text-white/20" />
              <div className="flex gap-1 flex-wrap justify-end max-w-[200px] md:max-w-none">
                {game.history.slice(0, 10).map((h, i) => (
                  <span key={`${h}-${i}`} className={`${getHistoryBadgeClass(h)} px-2 py-0.5 rounded-md text-[10px] font-bold`}>
                    {h}x
                  </span>
                ))}
              </div>
            </div>

            {/* Multiplier + Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
              <motion.div
                key={`${game.status}-${game.multiplier.toFixed(2)}`}
                initial={game.status === 'CRASHED' ? { scale: 1.3 } : { scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="text-center z-10 relative"
                style={{ textShadow: getMultiplierGlow(game.status, game.multiplier) }}
              >
                <div className={`text-5xl md:text-7xl lg:text-8xl font-black tabular-nums tracking-tight ${getMultiplierColor(game.status, game.multiplier)}`}>
                  {game.status === 'WAITING' || game.status === 'STOPPED'
                    ? '1.00'
                    : game.multiplier.toFixed(2)}x
                </div>
              </motion.div>

              {/* Plane animation during running */}
              <AnimatePresence>
                {game.status === 'RUNNING' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    className="absolute bottom-[25%] left-1/2 -translate-x-1/2 text-4xl pointer-events-none"
                  >
                    <motion.div
                      animate={{ y: [0, -8, 0], rotate: [-15, -12, -15] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    >
                      <Plane className="size-10 text-white/70" style={{ transform: 'rotate(-25deg)' }} />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Canvas behind multiplier */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <MultiplierCanvas status={game.status} multiplier={game.multiplier} />
            </div>
          </div>

          {/* History strip (bottom) */}
          <div className="glass p-2.5 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            <History className="size-3.5 text-white/20 flex-shrink-0" />
            {game.history.length === 0 && <span className="text-white/20 text-xs">No history yet</span>}
            {game.history.map((h, i) => (
              <span key={`h-${h}-${i}`} className={`${getHistoryBadgeClass(h)} px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0`}>
                {h}x
              </span>
            ))}
          </div>

          {/* Bet Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BetPanel
              slotId={1}
              status={game.status}
              myBet={myBets1[0]}
              myQueuedBet={myQueued1[0]}
              balance={user?.balance || 0}
              onBet={handleBet}
              onCashout={handleCashout}
              onCancel={handleCancel}
            />
            <BetPanel
              slotId={2}
              status={game.status}
              myBet={myBets2[0]}
              myQueuedBet={myQueued2[0]}
              balance={user?.balance || 0}
              onBet={handleBet}
              onCashout={handleCashout}
              onCancel={handleCancel}
            />
          </div>
        </div>

        {/* Live Bets Sidebar */}
        <LiveBetsPanel bets={game.bets} status={game.status} multiplier={game.multiplier} />
      </div>
    </div>
  );
}