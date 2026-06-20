import { Alert } from 'antd';
import { useTr } from '../../../i18n';
import type { Profile } from '../../../types';
import ProfileConfirmAction from './ProfileConfirmAction';

interface Props {
  readonly profile: Profile;
}

export default function ProfileSetDefault({ profile }: Props) {
  const t = useTr();
  return (
    <ProfileConfirmAction
      profile={profile}
      endpoint="/api/pri/profile/set/default"
      alertNode={<Alert type="info" message={`Set "${profile.name}" as your default profile?`} showIcon style={{ marginBottom: 16 }} />}
      errorNode={<Alert type="error" message={t('err.generic')} showIcon style={{ marginBottom: 16 }} />}
      submitLabel={t('btn.set_default_profile')}
    />
  );
}
