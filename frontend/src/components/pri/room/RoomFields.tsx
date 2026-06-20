import { useState, useEffect } from 'react';
import { Form, Input, Tooltip } from 'antd';
import { useTr } from '../../../i18n';
import { list } from '../../../lib/api';
import type { Domain333 } from '../../../types';
import FormText from '../../common/FormText';
import FormSelect from '../../common/FormSelect';

interface Props {
  readonly label: string;
  readonly onLabelChange: (v: string) => void;
  readonly slug: string;
  readonly onSlugChange: (v: string) => void;
  readonly domainId: string;
  readonly onDomainIdChange: (v: string) => void;
  readonly hideDomain?: boolean;
  readonly disabled?: boolean;
}

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export default function RoomFields({
  label, onLabelChange,
  slug, onSlugChange,
  domainId, onDomainIdChange,
  hideDomain,
  disabled,
}: Props) {
  const t = useTr();
  const [domains, setDomains] = useState<Domain333[]>([]);

  useEffect(() => {
    list('/api/pri/domain/list', 100)
      .then((res) => {
        const items: Domain333[] = Array.isArray(res) ? res : (res.items ?? []);
        const enabled = items.filter((d) => d.enabled);
        setDomains(enabled);
        if (enabled.length > 0 && !domainId) {
          onDomainIdChange(enabled[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const domainOptions: [string, string][] = domains.map((d) => [d.id, `${d.name} (${d.url})`]);

  return (
    <>
      <FormText name="label" label={t('form.label')} value={label} onChange={onLabelChange} required disabled={disabled} />

      <Form.Item label={t('form.slug')} required style={{ marginBottom: 16 }}>
        <Input
          value={slug}
          onChange={(e) => onSlugChange(e.target.value)}
          disabled={disabled}
          addonAfter={
            <Tooltip title={t('btn.random')}>
              <button
                type="button"
                tabIndex={0}
                style={{ cursor: disabled ? 'not-allowed' : 'pointer', padding: '0 4px', background: 'none', border: 'none' }}
                onClick={() => !disabled && onSlugChange(generateSlug())}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { if (!disabled) onSlugChange(generateSlug()); } }}
              >
                <i className="bi bi-shuffle" />
              </button>
            </Tooltip>
          }
        />
      </Form.Item>

      {!hideDomain && (
        <FormSelect
          name="domain_id"
          label={t('form.domain')}
          value={domainId}
          onChange={onDomainIdChange}
          options={domainOptions}
          disabled={disabled}
          required
        />
      )}
    </>
  );
}
