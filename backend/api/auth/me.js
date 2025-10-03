export default async function handler(req, res) {
  try {
    // req.user is set by verifyAuth middleware (contains decoded JWT)
    const user = req.user;

    // Return user info including tokens
    return res.json({
      authenticated: true,
      userId: user.userId,  // From JWT
      spotifyAccessToken: user.spotifyAccessToken,  // From JWT
      displayName: user.displayName || null,
      email: user.email || null,
      image: null  // We don't store image in JWT
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return res.status(500).json({
      authenticated: false,
      error: 'Failed to get user info'
    });
  }
}