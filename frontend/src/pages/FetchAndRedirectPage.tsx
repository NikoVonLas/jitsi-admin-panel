import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { action } from '../lib/api';
import { useTr } from '../i18n';
import Spinner from '../components/common/Spinner';
import AlertWarning from '../components/common/AlertWarning';

interface Props {
  readonly endpoint: string;
}

export default function FetchAndRedirectPage({ endpoint }: Props) {
  const t = useTr();
  const { code = '' } = useParams();
  const [err, setErr] = useState(false);

  useEffect(() => {
    action(endpoint, { short_code: code })
      .then((link) => {
        if (!link.url) throw new Error('no url');
        globalThis.location.replace(link.url as string);
      })
      .catch(() => setErr(true));
  }, [code, endpoint]);

  if (err) return <AlertWarning type="error">{t('err.generic')}</AlertWarning>;
  return <Spinner />;
}
