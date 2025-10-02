import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
// Import route handlers
import loginHandler from './api/auth/login.js';
import callbackHandler from './api/auth/callback.js';
import verifyAuth from './middleware/verifyAuth.js';
import meHandler from './api/auth/me.js';
import generatePlaylistHandler from './api/playlist/generate.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/api/auth/login', loginHandler);
app.get('/api/auth/callback', callbackHandler);
app.get('/api/auth/me', verifyAuth, meHandler);
app.post('/api/playlist/generate', verifyAuth, generatePlaylistHandler);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://127.0.0.1:${PORT}`);
  console.log(`📱 Frontend should be at ${process.env.FRONTEND_URL}`);
});