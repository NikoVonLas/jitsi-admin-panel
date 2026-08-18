import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useRoleStore } from '../store/role';
import { usePrefStore } from '../store/pref';
import { isAuthenticated } from '../lib/session';

export default function PrivateLayout() {
  const authenticated = isAuthenticated();
  const navigate = useNavigate();
  const { load: loadRole } = useRoleStore();
  const { load: loadPref } = usePrefStore();

  useEffect(() => {
    if (authenticated) {
      loadRole();
      loadPref();
    } else {
      navigate('/login', { replace: true });
    }
  }, [authenticated, navigate, loadRole, loadPref]);

  if (!authenticated) return null;

  return <Outlet />;
}
