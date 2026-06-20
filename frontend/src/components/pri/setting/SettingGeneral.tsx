import { useState } from 'react';
import { Form } from 'antd';
import { action } from '../../../lib/api';
import { useTr } from '../../../i18n';
import FormText from '../../common/FormText';
import FormSelect from '../../common/FormSelect';
import AlertWarning from '../../common/AlertWarning';
import ButtonSubmit from '../../common/ButtonSubmit';

interface Props {
  readonly settings: { mkey: string; mvalue: string }[];
}

export default function SettingGeneral({ settings }: Props) {
  const t = useTr();
  const [warning, setWarning] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const init = { contact_email: '', galaxy_fqdn: '', galaxy_scheme: 'https', week_start: '1' };
  for (const item of settings) {
    if (item.mkey in init) (init as Record<string, string>)[item.mkey] = item.mvalue;
  }

  const [p, setP] = useState(init);
  const set = (key: string, val: string) => setP((prev) => ({ ...prev, [key]: val }));

  const weekOptions: [string, string][] = [['1', t('setting.week_mon')], ['0', t('setting.week_sun')]];
  const schemeOptions: [string, string][] = [['https', 'https'], ['http', 'http']];

  async function onFinish() {
    try {
      setWarning(false);
      setDisabled(true);
      await action('/api/pri/setting/update', p);
    } catch {
      setWarning(true);
    } finally {
      setDisabled(false);
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', marginTop: 8 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <FormText name="contact_email" label={t('form.contact_email')} value={p.contact_email} onChange={(v) => set('contact_email', v)} />
          <FormText name="galaxy_fqdn" label={t('form.galaxy_fqdn')} value={p.galaxy_fqdn} onChange={(v) => set('galaxy_fqdn', v)} />
          <FormSelect name="galaxy_scheme" label={t('form.galaxy_scheme')} value={p.galaxy_scheme} onChange={(v) => set('galaxy_scheme', v)} options={schemeOptions} />
          <FormSelect name="week_start" label={t('form.week_start')} value={p.week_start} onChange={(v) => set('week_start', v)} options={weekOptions} />

          {warning && <AlertWarning type="error">{t('err.update')}</AlertWarning>}

          <Form.Item style={{ marginTop: 24 }}>
            <ButtonSubmit disabled={disabled} label={t('btn.submit')} block />
          </Form.Item>
        </Form>
    </div>
  );
}
