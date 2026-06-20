import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DomainEnablePage() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/setting?tab=domains', { replace: true }); }, [navigate]);
  return null;
}
