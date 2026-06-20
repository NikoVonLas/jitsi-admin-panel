import { useTr } from '../../../i18n';
import ProfileUpdate from '../../../components/pri/profile/ProfileUpdate';
import ProfileActionPage from './ProfileActionPage';

export default function ProfileUpdatePage() {
  const t = useTr();
  return (
    <ProfileActionPage title={t('page.update_profile')}>
      {(profile) => <ProfileUpdate profile={profile} />}
    </ProfileActionPage>
  );
}
