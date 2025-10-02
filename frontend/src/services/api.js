import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important: sends cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth endpoints
export const authAPI = {
  login: () => {
    // Redirect to backend login endpoint
    window.location.href = `${API_URL}/api/auth/login`;
  },

  logout: async () => {
    // For now, just clear client-side state
    // Later we can add a backend logout endpoint
    return Promise.resolve();
  },

  checkAuth: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Playlist endpoints
export const playlistAPI = {
  generate: async (description) => {
    const response = await api.post('/api/playlist/generate', { description });
    return response.data;
  },
};

export default api;