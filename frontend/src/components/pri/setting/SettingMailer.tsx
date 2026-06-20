import { useState } from 'react';
import { Form } from 'antd';
import { action } from '../../../lib/api';
import { useTr } from '../../../i18n';
import FormText from '../../common/FormText';
import FormPassword from '../../common/FormPassword';
import FormSwitch from '../../common/FormSwitch';
import AlertWarning from '../../common/AlertWarning';
import ButtonSubmit from '../../common/ButtonSubmit';

interface Props {
  readonly settings: { mkey: string; mvalue: string }[];
}

export default function SettingMailer({ settings }: Props) {
  const t = useTr();
  const [warning, setWarning] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const init = { mailer_host: '', mailer_port: '465', mailer_secure: true, mailer_user: '', mailer_pass: '', mailer_from: '' };
  for (const item of settings) {
    if (item.mkey === 'mailer_secure') {
      init.mailer_secure = item.mvalue !== 'false';
    } else if (item.mkey in init) {
      (init as Record<string, unknown>)[item.mkey] = item.mvalue;
    }
  }
  const [p, setP] = useState(init);
  const set = (key: string, val: unknown) => setP((prev) => ({ ...prev, [key]: val }));

  async function onFinish() {
    try {
      setWarning(false);
      setDisabled(true);
      await action('/api/pri/setting/update', { ...p, mailer_secure: String(p.mailer_secure) });
    } catch {
      setWarning(true);
    } finally {
      setDisabled(false);
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', marginTop: 8 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <FormText name="mailer_host" label={t('form.mailer_host')} value={p.mailer_host} onChange={(v) => set('mailer_host', v)} />
          <FormText name="mailer_port" label={t('form.mailer_port')} value={p.mailer_port} onChange={(v) => set('mailer_port', v)} />
          <FormSwitch label={t('form.mailer_secure')} checked={p.mailer_secure} onChange={(v) => set('mailer_secure', v)} />
          <FormText name="mailer_user" label={t('form.mailer_user')} value={p.mailer_user} onChange={(v) => set('mailer_user', v)} />
          <FormPassword name="mailer_pass" label={t('form.mailer_pass')} value={p.mailer_pass} onChange={(v) => set('mailer_pass', v)} hint={t('form.secret_hint')} />
          <FormText name="mailer_from" label={t('form.mailer_from')} value={p.mailer_from} onChange={(v) => set('mailer_from', v)} />

          {warning && <AlertWarning type="error">{t('err.update')}</AlertWarning>}

          <Form.Item style={{ marginTop: 24 }}>
            <ButtonSubmit disabled={disabled} label={t('btn.submit')} block />
          </Form.Item>
        </Form>
    </div>
  );
}
