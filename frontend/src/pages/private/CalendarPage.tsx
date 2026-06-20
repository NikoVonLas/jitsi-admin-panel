import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToday } from '../../lib/common';

export default function CalendarPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(`/calendar/month/${getToday()}`, { replace: true });
  }, [navigate]);
  return null;
}
