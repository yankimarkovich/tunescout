import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

function AuthProvider({ children }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    console.log('AuthProvider mounted - checking auth...');
    
    // Check if user just logged in (came from callback)
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error) {
      console.error('Auth error:', error);
      setLoading(false);
      return;
    }

    // For now, just set loading to false
    console.log('Setting loading to false');
    setLoading(false);
  }, [setUser, setLoading]);

  return children;
}

export default AuthProvider;