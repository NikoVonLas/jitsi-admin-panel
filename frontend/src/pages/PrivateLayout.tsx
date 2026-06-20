import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useRoleStore } from '../store/role';
import { usePrefStore } from '../store/pref';

export default function PrivateLayout() {
  const isAuthenticated =
    !!sessionStorage.getItem('oidc_authenticated') ||
    !!localStorage.getItem('auth_token');
  const navigate = useNavigate();
  const { load: loadRole } = useRoleStore();
  const { load: loadPref } = usePrefStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadRole();
      loadPref();
    } else {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate, loadRole, loadPref]);

  if (!isAuthenticated) return null;

  return <Outlet />;
}
