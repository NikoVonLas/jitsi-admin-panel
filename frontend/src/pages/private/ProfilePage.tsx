import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { Link } from 'react-router-dom';
import { list } from '../../lib/api';
import { useTr } from '../../i18n';
import type { Profile } from '../../types';
import Spinner from '../../components/common/Spinner';
import AlertWarning from '../../components/common/AlertWarning';
import Subheader from '../../components/common/Subheader';
import ProfileListItem from '../../components/pri/profile/ProfileListItem';

export default function ProfilePage() {
  const t = useTr();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function loadProfiles() {
    try {
      setError(false);
      setLoading(true);
      const rows = await list('/api/pri/profile/list', 100);
      setProfiles(Array.isArray(rows) ? rows : (rows.items ?? []));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfiles(); }, []);

  return (
    <div>
      <Subheader
        title={t('page.profiles')}
        extra={
          <Link to="/profile/add">
            <Button type="primary" icon={<i className="bi bi-plus-lg" />}>
              {t('btn.add')}
            </Button>
          </Link>
        }
      />
      {error && <AlertWarning type="error">{t('err.generic')}</AlertWarning>}
      {(() => {
        if (loading) return <Spinner />;
        if (profiles.length === 0) return (
          <AlertWarning>
            There is no profile in the list.{' '}
            <Link to="/profile/add">{t('btn.add')}</Link>
          </AlertWarning>
        );
        return (
          <div className="card-grid" style={{ marginTop: 16 }}>
            {profiles.map((p) => (
              <ProfileListItem key={p.id} profile={p} />
            ))}
          </div>
        );
      })()}
    </div>
  );
}
