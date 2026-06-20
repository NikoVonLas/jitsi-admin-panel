import { useTr } from '../../../i18n';
import ProfileDel from '../../../components/pri/profile/ProfileDel';
import ProfileActionPage from './ProfileActionPage';

export default function ProfileDelPage() {
  const t = useTr();
  return (
    <ProfileActionPage title={t('page.del_profile')}>
      {(profile) => <ProfileDel profile={profile} />}
    </ProfileActionPage>
  );
}
