import { Button, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTr } from '../../i18n';

interface Props {
  readonly title: string;
  readonly backUrl?: string;
}

export default function SubheaderCenter({ title, backUrl }: Props) {
  const t = useTr();
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 16, gap: 12, position: 'relative' }}>
      {backUrl && (
        <Tooltip title={t('sub.back')}>
          <Button icon={<i className="bi bi-arrow-left" />} onClick={() => navigate(backUrl)} style={{ position: 'absolute', left: 0 }} />
        </Tooltip>
      )}
      <h5 style={{ margin: 0, fontWeight: 600, fontSize: 18 }}>{title}</h5>
    </div>
  );
}
