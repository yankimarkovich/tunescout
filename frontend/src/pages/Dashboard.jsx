import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/api';
import PlaylistGenerator from '../components/PlaylistGenerator';
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuthStore();

  useEffect(() => {
    console.log('Dashboard mounted, user:', user);
  }, [user]);

  const handleLogout = async () => {
    await authAPI.logout();
    logout();
    window.location.href = '/';
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">🎵 TuneScout</h1>
        <div className="header-actions">
          <span className="user-info">👤 {user?.userId}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <PlaylistGenerator />
      </main>
    </div>
  );
}

export default Dashboard;