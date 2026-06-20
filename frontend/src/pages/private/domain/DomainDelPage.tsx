import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Redirects to setting page with domains tab
// Actions are handled inline via Popconfirm in DomainListItem
export default function DomainDelPage() {
  const { uuid = '' } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/setting?tab=domains', { replace: true });
  }, [navigate]);
  return null;
}
