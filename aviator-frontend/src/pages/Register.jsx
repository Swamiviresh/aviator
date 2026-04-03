import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/auth/register', { username, password });
      alert('Registered successfully! Please login.');
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-red-600 tracking-tight">Register</h2>
        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-3 bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
            required
          />
          <button 
            type="submit" 
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-lg transform active:scale-95 transition-all text-lg uppercase tracking-wider"
          >
            Create Account
          </button>
        </form>
        <p className="mt-6 text-center text-gray-500 text-sm">
          Already have an account? <Link to="/login" className="text-red-500 hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
