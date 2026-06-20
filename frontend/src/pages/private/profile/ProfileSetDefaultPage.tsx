import { useTr } from '../../../i18n';
import ProfileSetDefault from '../../../components/pri/profile/ProfileSetDefault';
import ProfileActionPage from './ProfileActionPage';

export default function ProfileSetDefaultPage() {
  const t = useTr();
  return (
    <ProfileActionPage title={t('page.set_default_profile')}>
      {(profile) => <ProfileSetDefault profile={profile} />}
    </ProfileActionPage>
  );
}
