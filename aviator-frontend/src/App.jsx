import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Game from './pages/Game';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/game" 
          element={
            <ProtectedRoute>
              <Game />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/game" />} />
      </Routes>
    </Router>
  );
}

export default App;
