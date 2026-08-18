import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { isAuthenticated } from '../lib/session';

export default function HomePage() {
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/meeting', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);
  return null;
}
