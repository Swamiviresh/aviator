import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../api';
import { useAuth } from './AuthContext';

const GameContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const GameProvider = ({ children }) => {
  const { fetchUser } = useAuth();
  const [gameState, setGameState] = useState({
    status: 'WAITING',
    multiplier: 1.0,
    timer: 5.0,
    bets: [],
    history: [],
    adminStopped: false
  });
  const [activeBet1, setActiveBet1] = useState(null);
  const [activeBet2, setActiveBet2] = useState(null);
  const [autoCashout1, setAutoCashout1] = useState(null);
  const [autoCashout2, setAutoCashout2] = useState(null);

  // Refs to prevent double-firing auto cashout
  const isCashingOut1 = useRef(false);
  const isCashingOut2 = useRef(false);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.on('gameUpdate', (data) => {
      setGameState(data);
    });
    return () => socket.disconnect();
  }, []);

  const placeBet = async (amount, slotId) => {
    try {
      const response = await api.post('/api/bet', { amount: parseFloat(amount), slotId });
      if (slotId === 1) setActiveBet1(response.data);
      else setActiveBet2(response.data);
      fetchUser();
    } catch (error) {
      throw error.response?.data?.error || 'Failed to place bet';
    }
  };

  const cancelBet = useCallback(async (slotId) => {
    try {
      // Optimistic update
      if (slotId === 1) setActiveBet1(null);
      else setActiveBet2(null);
      const response = await api.post('/api/cancel-bet', { slotId });
      fetchUser();
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to cancel bet';
    }
  }, [fetchUser]);

  const cashout = useCallback(async (slotId) => {
    try {
      // Optimistic update — clear bet instantly so UI responds immediately
      if (slotId === 1) setActiveBet1(null);
      else setActiveBet2(null);
      const response = await api.post('/api/cashout', { slotId });
      fetchUser();
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to cash out';
    }
  }, [fetchUser]);

  // Auto cashout slot 1
  useEffect(() => {
    if (
      gameState.status === 'RUNNING' &&
      activeBet1 &&
      activeBet1.status === 'pending' &&
      autoCashout1 &&
      parseFloat(gameState.multiplier) >= parseFloat(autoCashout1) &&
      !isCashingOut1.current  // prevent double fire
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
      activeBet2.status === 'pending' &&
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

  // Reset active bets when round ends
  // But keep queued bets alive — they carry into the next round
  useEffect(() => {
    if (gameState.status === 'CRASHED' || gameState.status === 'STOPPED') {
      setActiveBet1(prev => (prev?.queued ? prev : null));
      setActiveBet2(prev => (prev?.queued ? prev : null));
      isCashingOut1.current = false;
      isCashingOut2.current = false;
    }
    // When WAITING starts, strip the queued flag — bet is now live
    if (gameState.status === 'WAITING') {
      setActiveBet1(prev => prev?.queued ? { ...prev, queued: false } : prev);
      setActiveBet2(prev => prev?.queued ? { ...prev, queued: false } : prev);
    }
  }, [gameState.status]);

  return (
    <GameContext.Provider value={{
      gameState,
      activeBet1, activeBet2,
      placeBet,
      cashout,
      cancelBet,
      autoCashout1, setAutoCashout1,
      autoCashout2, setAutoCashout2
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
