import { useState } from 'react';
import { Card, Tag, Button, Tooltip, Modal } from 'antd';
import { actionById } from '../../../lib/api';
import { useTr } from '../../../i18n';
import { useRoleStore } from '../../../store/role';
import type { Domain333 } from '../../../types';
import AlertWarning from '../../common/AlertWarning';
import { entityCardActions } from '../../common/EntityCardActions';
import DomainUpdate from './DomainUpdate';

interface Props {
  readonly domain: Domain333;
  readonly onRefresh?: () => void;
}

export default function DomainListItem({ domain: p, onRefresh }: Props) {
  const t = useTr();
  const { isSuperAdmin } = useRoleStore();
  const [enabled, setEnabled] = useState(p.enabled);
  const [showEdit, setShowEdit] = useState(false);
  const [delLoading, setDelLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [delError, setDelError] = useState(false);
  const [toggleError, setToggleError] = useState(false);

  async function confirmDel() {
    try {
      setDelLoading(true);
      setDelError(false);
      await actionById('/api/pri/domain/del', p.id);
      onRefresh?.();
    } catch {
      setDelError(true);
      setDelLoading(false);
    }
  }

  async function confirmToggle() {
    try {
      setToggleLoading(true);
      setToggleError(false);
      const endpoint = enabled ? '/api/pri/domain/disable' : '/api/pri/domain/enable';
      await actionById(endpoint, p.id);
      setEnabled((v) => !v);
    } catch {
      setToggleError(true);
    } finally {
      setToggleLoading(false);
    }
  }

  return (
    <>
      <Card
        style={{ height: '100%', borderColor: enabled ? undefined : '#dc2626' }}
        actions={
          isSuperAdmin
            ? entityCardActions({
                enabled,
                toggleLoading,
                delLoading,
                toggleTitle: enabled ? t('page.disable_domain') : t('page.enable_domain'),
                toggleDescription: enabled ? t('warn.disable_domain') : undefined,
                delTitle: t('page.del_domain'),
                delDescription: t('warn.delete_domain'),
                onToggle: confirmToggle,
                onDel: confirmDel,
                t,
                extraActions: [
                  <Tooltip key="edit" title={t('btn.update')}>
                    <Button type="text" icon={<i className="bi bi-pencil" />} onClick={() => setShowEdit(true)} />
                  </Tooltip>,
                ],
              })
            : undefined
        }
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 600, wordBreak: 'break-word' }}>{p.name}</span>
          <Tag color={p.public ? 'success' : 'default'} style={{ flexShrink: 0 }}>
            {p.public ? t('domain.public') : t('domain.private')}
          </Tag>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{p.url}</div>
        {delError && <AlertWarning type="error">{t('err.delete')}</AlertWarning>}
        {toggleError && <AlertWarning type="error">{enabled ? t('err.disable') : t('err.enable')}</AlertWarning>}
      </Card>

      <Modal
        open={showEdit}
        onCancel={() => setShowEdit(false)}
        title={t('page.update_domain')}
        footer={null}
        width={600}
      >
        <DomainUpdate
          id={p.id}
          onCancel={() => setShowEdit(false)}
          onDone={() => {
            setShowEdit(false);
            onRefresh?.();
          }}
        />
      </Modal>
    </>
  );
}
