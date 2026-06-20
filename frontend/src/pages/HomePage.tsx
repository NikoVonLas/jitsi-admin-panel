import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function HomePage() {
  const navigate = useNavigate();
  useEffect(() => {
    const isAuthenticated =
      !!sessionStorage.getItem('oidc_authenticated') ||
      !!localStorage.getItem('auth_token');
    if (isAuthenticated) {
      navigate('/meeting', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);
  return null;
}
