import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const { user, logout, setUser } = useAuthStore();

  useEffect(() => {
    // When dashboard loads after login, we should have user data
    // For now, we'll just log it
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
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </header>

      <main className="dashboard-main">
        <section className="welcome-section">
          <h2>Welcome back!</h2>
          <p>User ID: {user?.userId || 'Not logged in yet'}</p>
        </section>

        <section className="playlist-section">
          <h3>Create a Playlist</h3>
          <p className="coming-soon">
            Coming soon: AI-powered playlist generation!
          </p>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;