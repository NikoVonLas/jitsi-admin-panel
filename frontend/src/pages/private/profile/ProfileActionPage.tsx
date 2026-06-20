import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getById } from '../../../lib/api';
import { useTr } from '../../../i18n';
import type { Profile } from '../../../types';
import Spinner from '../../../components/common/Spinner';
import AlertWarning from '../../../components/common/AlertWarning';
import SubheaderCenter from '../../../components/common/SubheaderCenter';

interface Props {
  readonly title: string;
  readonly children: (profile: Profile) => React.ReactNode;
}

export default function ProfileActionPage({ title, children }: Props) {
  const t = useTr();
  const { uuid = '' } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getById('/api/pri/profile/get', uuid)
      .then((p) => setProfile(p as Profile))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [uuid]);

  return (
    <>
      <SubheaderCenter title={title} backUrl="/profile" />
      {(() => {
        if (loading) return <Spinner />;
        if (error) return <AlertWarning type="error">{t('err.generic')}</AlertWarning>;
        return profile ? children(profile) : null;
      })()}
    </>
  );
}
