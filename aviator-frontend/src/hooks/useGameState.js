import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../api';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useGameState = () => {
  const [gameState, setGameState] = useState({
    status: 'WAITING',
    multiplier: 1.0,
    timer: 5.0,
    bets: [],
    history: []
  });
  const [user, setUser] = useState(null);
  const [activeBet, setActiveBet] = useState(null);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('gameUpdate', (data) => {
      setGameState(data);
    });

    return () => socket.disconnect();
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/api/user/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user', error);
      localStorage.removeItem('token');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      fetchUser();
    }
  }, [fetchUser]);

  const placeBet = async (amount) => {
    try {
      const response = await api.post('/api/bet', { amount: parseFloat(amount) });
      setActiveBet(response.data);
      fetchUser();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to place bet');
    }
  };

  const cashout = async () => {
    try {
      const response = await api.post('/api/cashout');
      alert(`Cashed out at ${response.data.multiplier}x! Payout: ${response.data.payout.toFixed(2)}`);
      setActiveBet(null);
      fetchUser();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to cash out');
    }
  };

  useEffect(() => {
    if (gameState.status === 'CRASHED' || gameState.status === 'WAITING') {
      setActiveBet(null);
    }
  }, [gameState.status]);

  return { gameState, user, activeBet, placeBet, cashout, fetchUser };
};
