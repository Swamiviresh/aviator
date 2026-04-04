import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../api';
import { useAuth } from './AuthContext';

const GameContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const GameProvider = ({ children }) => {
  const { user, fetchUser } = useAuth();
  const [gameState, setGameState] = useState({
    status: 'WAITING',
    multiplier: 1.0,
    timer: 5.0,
    bets: [],
    queuedBets: [],
    history: [],
    adminStopped: false
  });
  const [autoCashout1, setAutoCashout1] = useState(null);
  const [autoCashout2, setAutoCashout2] = useState(null);

  const isCashingOut1 = useRef(false);
  const isCashingOut2 = useRef(false);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.on('gameUpdate', (data) => {
      setGameState(data);
    });
    return () => socket.disconnect();
  }, []);

  // Derive activeBets directly from server state — never lose sync
  const userId = user?.id;
  const activeBet1 = userId
    ? (gameState.bets.find(b => b.userId === userId && b.slotId === 1 && b.status === 'pending') ||
       gameState.queuedBets?.find(b => b.userId === userId && b.slotId === 1) || null)
    : null;
  const activeBet2 = userId
    ? (gameState.bets.find(b => b.userId === userId && b.slotId === 2 && b.status === 'pending') ||
       gameState.queuedBets?.find(b => b.userId === userId && b.slotId === 2) || null)
    : null;

  const placeBet = async (amount, slotId) => {
    try {
      await api.post('/api/bet', { amount: parseFloat(amount), slotId });
      fetchUser();
    } catch (error) {
      throw error.response?.data?.error || 'Failed to place bet';
    }
  };

  const cashout = useCallback(async (slotId) => {
    try {
      const response = await api.post('/api/cashout', { slotId });
      fetchUser();
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to cash out';
    }
  }, [fetchUser]);

  const cancelBet = useCallback(async (slotId) => {
    try {
      const response = await api.post('/api/cancel-bet', { slotId });
      fetchUser();
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to cancel bet';
    }
  }, [fetchUser]);

  // Auto cashout slot 1
  useEffect(() => {
    if (
      gameState.status === 'RUNNING' &&
      activeBet1 &&
      !activeBet1.queued &&
      autoCashout1 &&
      parseFloat(gameState.multiplier) >= parseFloat(autoCashout1) &&
      !isCashingOut1.current
    ) {
      isCashingOut1.current = true;
      cashout(1)
        .catch(console.error)
        .finally(() => { isCashingOut1.current = false; });
    }
  }, [gameState.multiplier, gameState.status, activeBet1, autoCashout1, cashout]);

  // Auto cashout slot 2
  useEffect(() => {
    if (
      gameState.status === 'RUNNING' &&
      activeBet2 &&
      !activeBet2.queued &&
      autoCashout2 &&
      parseFloat(gameState.multiplier) >= parseFloat(autoCashout2) &&
      !isCashingOut2.current
    ) {
      isCashingOut2.current = true;
      cashout(2)
        .catch(console.error)
        .finally(() => { isCashingOut2.current = false; });
    }
  }, [gameState.multiplier, gameState.status, activeBet2, autoCashout2, cashout]);

  // Reset cashout guards on round end
  useEffect(() => {
    if (gameState.status === 'CRASHED' || gameState.status === 'STOPPED') {
      isCashingOut1.current = false;
      isCashingOut2.current = false;
    }
  }, [gameState.status]);

  return (
    <GameContext.Provider value={{
      gameState,
      activeBet1, activeBet2,
      placeBet, cashout, cancelBet,
      autoCashout1, setAutoCashout1,
      autoCashout2, setAutoCashout2
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};