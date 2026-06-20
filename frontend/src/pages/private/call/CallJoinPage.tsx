import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { actionById } from '../../../lib/api';
import { delMessage } from '../../../hooks/useIntercom';
import { useTr } from '../../../i18n';
import type { IntercomMessage222 } from '../../../types';
import Spinner from '../../../components/common/Spinner';
import AlertWarning from '../../../components/common/AlertWarning';

export default function CallJoinPage() {
  const t = useTr();
  const { uuid = '' } = useParams();
  const [err, setErr] = useState(false);

  useEffect(() => {
    async function join() {
      try {
        const json = localStorage.getItem(`msg-${uuid}`);
        if (!json) throw new Error('storage item not found');
        const msg = JSON.parse(json) as IntercomMessage222;
        const url = msg.intercom_attr.url;
        await actionById('/api/pri/intercom/set/accepted', uuid);
        delMessage(uuid);
        globalThis.location.replace(url);
      } catch {
        setErr(true);
      }
    }
    join();
  }, [uuid]);

  if (err) return <AlertWarning>{t('err.generic')}</AlertWarning>;
  return <Spinner>{t('status.joining')}</Spinner>;
}
