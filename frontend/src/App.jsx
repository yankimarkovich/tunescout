import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { authAPI } from './services/api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './App.css';

function AppContent() {
  const { isAuthenticated, isLoading, setLoading, setUser, logout } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      console.log('Checking authentication...');
      
      // If we're on the dashboard route, user likely just logged in
      if (location.pathname === '/dashboard') {
        try {
          // Call backend to verify JWT and get user data
          const userData = await authAPI.checkAuth();
          console.log('User authenticated:', userData);
          setUser(userData);
        } catch (error) {
          console.error('Auth check failed:', error);
          // If auth check fails, user is not logged in
          logout();
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [location.pathname, setLoading, setUser, logout]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
      />
      <Route 
        path="/dashboard" 
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} 
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;