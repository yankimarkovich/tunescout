const handler = (req, res) => {
  // req.user is set by verifyAuth middleware
  // It contains the decoded JWT payload
  
  const { userId, spotifyAccessToken } = req.user;
  
  // Return user data (don't send tokens to frontend for security)
  res.json({
    userId: userId,
    isAuthenticated: true
  });
};

export default handler;