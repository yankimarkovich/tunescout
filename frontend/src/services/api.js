import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth endpoints
export const authAPI = {
  login: () => {
    window.location.href = `${API_URL}/api/auth/login`;
  },

  logout: async () => {
    return Promise.resolve();
  },

  checkAuth: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Playlist endpoints
export const playlistAPI = {
  generate: async (prompt) => {
    // Get current auth data first
    const authData = await authAPI.checkAuth();
    
    const response = await api.post('/api/playlist/generate', {
      prompt: prompt,
      spotifyAccessToken: authData.spotifyAccessToken,
      userId: authData.userId
    });
    
    return response.data;
  },
};

export default api;