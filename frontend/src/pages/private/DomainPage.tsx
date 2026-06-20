import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DomainPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/setting?tab=domains', { replace: true });
  }, [navigate]);
  return null;
}
