import { useState, useEffect } from 'react';
import { Form } from 'antd';
import { getById, action } from '../../../lib/api';
import { useTr } from '../../../i18n';
import type { Domain } from '../../../types';
import AlertWarning from '../../common/AlertWarning';
import Spinner from '../../common/Spinner';
import ButtonCancel from '../../common/ButtonCancel';
import ButtonSubmit from '../../common/ButtonSubmit';
import FormActions from '../../common/FormActions';
import DomainFields, { getDefaultDomainAttr } from './DomainFields';
import type { DomainAttr } from './DomainFields';

interface Props {
  readonly onCancel?: () => void;
  readonly onDone?: () => void;
  readonly domainId?: string;
}

export default function DomainForm({ onCancel, onDone, domainId }: Props) {
  const t = useTr();
  const isUpdate = domainId !== undefined;
  const [warning, setWarning] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [name, setName] = useState('');
  const [authType, setAuthType] = useState('none');
  const [domainAttr, setDomainAttr] = useState<DomainAttr>(getDefaultDomainAttr());
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(isUpdate);
  const [loadError, setLoadError] = useState(false);
  const [fetchedId, setFetchedId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!domainId) return;
    setLoading(true);
    setLoadError(false);
    getById('/api/pri/domain/get', domainId)
      .then((d) => {
        const dom = d as Domain;
        setFetchedId(dom.id);
        setName(dom.name);
        setAuthType(dom.auth_type);
        setDomainAttr({ ...getDefaultDomainAttr(), ...dom.domain_attr });
        setIsPublic(dom.public);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [domainId]);

  async function onFinish() {
    try {
      setWarning(false);
      setDisabled(true);
      if (isUpdate) {
        await action('/api/pri/domain/update', { id: fetchedId, name, auth_type: authType, domain_attr: domainAttr, public: isPublic });
      } else {
        await action('/api/pri/domain/add', { name, auth_type: authType, domain_attr: domainAttr, public: isPublic });
      }
      onDone?.();
    } catch {
      setWarning(true);
      setDisabled(false);
    }
  }

  if (loading) return <Spinner />;
  if (loadError) return <AlertWarning type="error">{t('err.generic')}</AlertWarning>;

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 540 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <DomainFields name={name} onNameChange={setName} authType={authType} onAuthTypeChange={setAuthType} domainAttr={domainAttr} onDomainAttrChange={setDomainAttr} isPublic={isPublic} onPublicChange={setIsPublic} disabled={disabled} />
          {warning && <AlertWarning type="error">{t(isUpdate ? 'err.update' : 'err.add')}</AlertWarning>}
          <FormActions>
            <ButtonCancel onClick={onCancel} disabled={disabled} block />
            <ButtonSubmit disabled={disabled} label={t(isUpdate ? 'btn.update' : 'btn.add')} block />
          </FormActions>
        </Form>
      </div>
    </div>
  );
}
