import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  if (showRegister) {
    return (
      <Register 
        onLogin={handleLogin} 
        onSwitchToLogin={() => setShowRegister(false)} 
      />
    );
  }

  return (
    <Login 
      onLogin={handleLogin} 
      onSwitchToRegister={() => setShowRegister(true)} 
    />
  );
}

export default App;