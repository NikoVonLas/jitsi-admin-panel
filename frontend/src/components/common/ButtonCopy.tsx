import { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { copyText } from '../../lib/common';
import { useTr } from '../../i18n';

interface Props {
  readonly text: string;
  readonly size?: 'small' | 'middle' | 'large';
}

export default function ButtonCopy({ text, size = 'small' }: Props) {
  const t = useTr();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Tooltip title={t('btn.copy')}>
      <Button size={size} onClick={handleCopy} icon={
        copied
          ? <i className="bi bi-check-lg" style={{ color: '#16a34a' }} />
          : <i className="bi bi-clipboard" />
      } />
    </Tooltip>
  );
}
