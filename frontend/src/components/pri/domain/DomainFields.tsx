import { Radio, Form, Switch } from 'antd';
import { useTr } from '../../../i18n';
import FormText from '../../common/FormText';
import FormUrl from '../../common/FormUrl';
import FormPassword from '../../common/FormPassword';
import { TOKEN_ALGO } from '../../../lib/config';

export interface DomainAttr {
  url: string; app_id: string; app_secret: string; app_alg: string;
}

export function getDefaultDomainAttr(): DomainAttr {
  return { url: '', app_id: '', app_secret: '', app_alg: TOKEN_ALGO };
}

interface Props {
  readonly name: string;
  readonly onNameChange: (v: string) => void;
  readonly authType: string;
  readonly onAuthTypeChange: (v: string) => void;
  readonly domainAttr: DomainAttr;
  readonly onDomainAttrChange: (v: DomainAttr) => void;
  readonly isPublic: boolean;
  readonly onPublicChange: (v: boolean) => void;
  readonly disabled?: boolean;
}

export default function DomainFields({ name, onNameChange, authType, onAuthTypeChange, domainAttr, onDomainAttrChange, isPublic, onPublicChange, disabled }: Props) {
  const t = useTr();
  const authTypeOptions = [{ value: 'none', label: t('domain.auth_none') }, { value: 'token', label: t('domain.auth_token') }];
  function setAttr<K extends keyof DomainAttr>(key: K, value: DomainAttr[K]) {
    onDomainAttrChange({ ...domainAttr, [key]: value });
  }
  return (
    <>
      <Form.Item>
        <Radio.Group options={authTypeOptions} value={authType} onChange={(e) => onAuthTypeChange(e.target.value)} disabled={disabled} optionType="button" buttonStyle="solid" />
      </Form.Item>
      <FormText name="name" label={t('form.name')} value={name} onChange={onNameChange} required disabled={disabled} />
      {authType === 'token' ? (
        <>
          <FormUrl name="url" label={t('form.url')} value={domainAttr.url} onChange={(v) => setAttr('url', v)} required disabled={disabled} />
          <FormText name="app_id" label={t('form.app_id')} value={domainAttr.app_id} onChange={(v) => setAttr('app_id', v)} required disabled={disabled} />
          <FormPassword name="app_secret" label={t('form.app_secret')} value={domainAttr.app_secret} onChange={(v) => setAttr('app_secret', v)} required disabled={disabled} />
        </>
      ) : (
        <FormUrl name="url" label={t('form.url')} value={domainAttr.url} onChange={(v) => setAttr('url', v)} required disabled={disabled} />
      )}
      <Form.Item label={t('domain.public_access')}>
        <Switch checked={isPublic} onChange={onPublicChange} disabled={disabled} />
      </Form.Item>
    </>
  );
}
