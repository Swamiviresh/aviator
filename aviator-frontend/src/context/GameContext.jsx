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
  const [activeBet1, setActiveBet1] = useState(null);
  const [activeBet2, setActiveBet2] = useState(null);
  const [autoCashout1, setAutoCashout1] = useState(null);
  const [autoCashout2, setAutoCashout2] = useState(null);

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

  const cashout = async (slotId) => {
    try {
      const response = await api.post('/api/cashout', { slotId });
      if (slotId === 1) setActiveBet1(null);
      else setActiveBet2(null);
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
      activeBet1 &&
      activeBet1.status === 'pending' &&
      autoCashout1 &&
      parseFloat(gameState.multiplier) >= parseFloat(autoCashout1)
    ) {
      cashout(1).catch(console.error);
    }
  }, [gameState.multiplier, gameState.status, activeBet1, autoCashout1]);

  useEffect(() => {
    if (
      gameState.status === 'RUNNING' &&
      activeBet2 &&
      activeBet2.status === 'pending' &&
      autoCashout2 &&
      parseFloat(gameState.multiplier) >= parseFloat(autoCashout2)
    ) {
      cashout(2).catch(console.error);
    }
  }, [gameState.multiplier, gameState.status, activeBet2, autoCashout2]);

  useEffect(() => {
    if (gameState.status === 'CRASHED' || gameState.status === 'WAITING' || gameState.status === 'STOPPED') {
      if (activeBet1) setActiveBet1(null);
      if (activeBet2) setActiveBet2(null);
    }
  }, [gameState.status, activeBet1, activeBet2]);

  return (
    <GameContext.Provider value={{
      gameState,
      activeBet1, activeBet2,
      placeBet,
      cashout,
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
