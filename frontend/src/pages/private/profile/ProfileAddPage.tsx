import { useTr } from '../../../i18n';
import SubheaderCenter from '../../../components/common/SubheaderCenter';
import ProfileAdd from '../../../components/pri/profile/ProfileAdd';

export default function ProfileAddPage() {
  const t = useTr();
  return (
    <>
      <SubheaderCenter title={t('page.add_profile')} backUrl="/profile" />
      <ProfileAdd />
    </>
  );
}
