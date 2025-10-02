import { authAPI } from '../services/api';
import './Login.css';

function Login() {
  const handleLogin = () => {
    authAPI.login();
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <h1 className="login-title">
          🎵 TuneScout
        </h1>
        <p className="login-description">
          Create AI-powered Spotify playlists from natural language descriptions
        </p>
        <button 
          onClick={handleLogin}
          className="login-button"
        >
          Login with Spotify
        </button>
      </div>
    </div>
  );
}

export default Login;