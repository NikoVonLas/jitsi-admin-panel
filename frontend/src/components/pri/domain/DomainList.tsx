import { useTr } from '../../../i18n';
import type { Domain333 } from '../../../types';
import AlertWarning from '../../common/AlertWarning';
import DomainListItem from './DomainListItem';

interface Props {
  readonly domains: Domain333[];
  readonly onRefresh?: () => void;
}

export default function DomainList({ domains, onRefresh }: Props) {
  const t = useTr();
  return (
    <div>
      {domains.length === 0 ? (
        <AlertWarning>{t('empty.domains')}{t('empty.domains_suffix')}</AlertWarning>
      ) : (
        <div className="card-grid" style={{ marginTop: 8 }}>
          {domains.map((d) => (
            <DomainListItem key={d.id} domain={d} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}
