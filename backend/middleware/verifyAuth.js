import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const verifyAuth = (req, res, next) => {
  // Get token from cookie
  const token = req.cookies.auth_token;
  
  // Check if token exists
  if (!token) {
    return res.status(401).json({ 
      error: 'No authentication token found' 
    });
  }
  
  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user data to request object
    req.user = decoded;
    
    // Continue to next middleware/route handler
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(401).json({ 
      error: 'Invalid or expired token' 
    });
  }
};

export default verifyAuth;