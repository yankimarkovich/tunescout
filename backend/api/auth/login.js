import dotenv from 'dotenv';
dotenv.config();

const handler = async (req, res) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  //const redirectUri = 'http://127.0.0.1:3000/api/auth/callback';
  const redirectUri = 'http://127.0.0.1:3000/api/auth/callback';

  // Scopes we need for creating playlists
  const scopes = [
    'playlist-modify-public',
    'playlist-modify-private',
    'user-read-private',
    'user-read-email'
  ].join(' ');
  
  // Generate random state for security
  const state = Math.random().toString(36).substring(7);
  
  // Build Spotify authorization URL
  const authUrl = `https://accounts.spotify.com/authorize?` +
    `response_type=code` +
    `&client_id=${clientId}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;
  
  // Redirect user to Spotify login
  res.redirect(authUrl);
};

export default handler;