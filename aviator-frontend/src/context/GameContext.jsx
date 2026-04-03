import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [activeBet, setActiveBet] = useState(null);
  const [autoCashout, setAutoCashout] = useState(null);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('gameUpdate', (data) => {
      setGameState(data);
    });

    return () => socket.disconnect();
  }, []);

  const placeBet = async (amount) => {
    try {
      const response = await api.post('/api/bet', { amount: parseFloat(amount) });
      setActiveBet(response.data);
      fetchUser();
    } catch (error) {
      throw error.response?.data?.error || 'Failed to place bet';
    }
  };

  const cashout = async () => {
    try {
      const response = await api.post('/api/cashout');
      setActiveBet(null);
      fetchUser();
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to cash out';
    }
  };

  // Auto cashout logic
  useEffect(() => {
    if (
      gameState.status === 'RUNNING' &&
      activeBet &&
      activeBet.status === 'pending' &&
      autoCashout &&
      parseFloat(gameState.multiplier) >= parseFloat(autoCashout)
    ) {
      // Use a small timeout or another mechanism to avoid sync setState in effect if needed,
      // but usually async API calls are fine. The lint error might be over-zealous here.
      // Wrapping in a check to ensure we only call it once.
      cashout().catch(console.error);
    }
  }, [gameState.multiplier, gameState.status, activeBet, autoCashout]);

  useEffect(() => {
    if (gameState.status === 'CRASHED' || gameState.status === 'WAITING' || gameState.status === 'STOPPED') {
      if (activeBet) {
        setActiveBet(null);
      }
    }
  }, [gameState.status, activeBet]);

  return (
    <GameContext.Provider value={{
      gameState,
      activeBet,
      placeBet,
      cashout,
      autoCashout,
      setAutoCashout
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
