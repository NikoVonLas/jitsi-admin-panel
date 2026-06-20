import { Button, Popconfirm, Tooltip } from 'antd';
import type { ReactNode } from 'react';

interface Props {
  readonly enabled: boolean;
  readonly toggleLoading: boolean;
  readonly delLoading: boolean;
  readonly toggleTitle: string;
  readonly toggleDescription?: string;
  readonly delTitle: string;
  readonly delDescription: string;
  readonly onToggle: () => void;
  readonly onDel: () => void;
  readonly t: (k: string) => string;
  readonly extraActions?: ReactNode[];
}

export function entityCardActions({
  enabled, toggleLoading, delLoading,
  toggleTitle, toggleDescription, delTitle, delDescription,
  onToggle, onDel, t, extraActions = [],
}: Props): ReactNode[] {
  return [
    ...extraActions,
    <Popconfirm
      key="toggle"
      title={toggleTitle}
      description={toggleDescription}
      onConfirm={onToggle}
      okText={enabled ? t('btn.disable') : t('btn.enable')}
      cancelText={t('btn.cancel')}
    >
      <Tooltip title={enabled ? t('btn.disable') : t('btn.enable')}>
        <Button
          type="text"
          loading={toggleLoading}
          icon={<i className={`bi ${enabled ? 'bi-pause-circle' : 'bi-play-circle'}`} />}
        />
      </Tooltip>
    </Popconfirm>,
    <Popconfirm
      key="del"
      title={delTitle}
      description={delDescription}
      onConfirm={onDel}
      okText={t('btn.delete')}
      cancelText={t('btn.cancel')}
      okButtonProps={{ danger: true }}
    >
      <Tooltip title={t('btn.delete')}>
        <Button type="text" danger loading={delLoading} icon={<i className="bi bi-trash" />} />
      </Tooltip>
    </Popconfirm>,
  ];
}
