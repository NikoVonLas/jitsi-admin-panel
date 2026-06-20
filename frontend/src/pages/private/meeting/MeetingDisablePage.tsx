import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MeetingDisablePage() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/meeting', { replace: true }); }, [navigate]);
  return null;
}
