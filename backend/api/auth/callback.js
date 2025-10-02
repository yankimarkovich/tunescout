import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const handler = async (req, res) => {
  console.log('🔥 Callback handler called!');
  console.log('Query params:', req.query);
  
  const { code, state, error } = req.query;
  
  // Check if user denied access
  if (error) {
    console.log('❌ User denied access:', error);
    return res.redirect(`${process.env.FRONTEND_URL}?error=access_denied`);
  }
  
  if (!code) {
    console.log('❌ No code received');
    return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
  }
  
  console.log('✅ Code received, exchanging for tokens...');
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
        ).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'http://127.0.0.1:3000/api/auth/callback'
      })
    });
    
    const tokens = await tokenResponse.json();
    console.log('Token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      console.error('❌ Token exchange failed:', tokens);
      return res.redirect(`${process.env.FRONTEND_URL}?error=token_failed`);
    }
    
    console.log('✅ Tokens received, getting profile...');
    
    // Get user profile
    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });
    
    const profile = await profileResponse.json();
    console.log('✅ Profile received:', profile.id);
    
    // Create JWT session token
    const sessionToken = jwt.sign(
      {
        userId: profile.id,
        spotifyAccessToken: tokens.access_token,
        spotifyRefreshToken: tokens.refresh_token
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('✅ JWT created, redirecting to dashboard...');
    
    // Set secure cookie
    res.setHeader('Set-Cookie', 
      `auth_token=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`
    );
    
    // Redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    
  } catch (error) {
    console.error('❌ Auth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}?error=server_error`);
  }
};

export default handler;