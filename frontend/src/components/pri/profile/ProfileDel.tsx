import { Alert } from 'antd';
import { useTr } from '../../../i18n';
import type { Profile } from '../../../types';
import ProfileConfirmAction from './ProfileConfirmAction';

interface Props {
  readonly profile: Profile;
}

export default function ProfileDel({ profile }: Props) {
  const t = useTr();
  return (
    <ProfileConfirmAction
      profile={profile}
      endpoint="/api/pri/profile/del"
      alertNode={<Alert type="warning" message={t('warn.delete_profile')} showIcon style={{ marginBottom: 16 }} />}
      errorNode={<Alert type="error" message={t('err.delete')} showIcon style={{ marginBottom: 16 }} />}
      submitLabel={t('btn.delete')}
      danger
    />
  );
}
