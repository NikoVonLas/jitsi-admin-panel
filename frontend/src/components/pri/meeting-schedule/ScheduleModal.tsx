import { useState, useEffect, useRef } from 'react';
import { Button, Form, Modal } from 'antd';
import { action, listById } from '../../../lib/api';
import { useTr } from '../../../i18n';
import type { MeetingSchedule } from '../../../types';
import AlertWarning from '../../common/AlertWarning';
import Spinner from '../../common/Spinner';
import ScheduleListItem from './ScheduleListItem';
import ScheduleFields, { type ScheduleFieldsRef } from './ScheduleFields';
import ButtonCancel from '../../common/ButtonCancel';
import ButtonSubmit from '../../common/ButtonSubmit';
import FormActions from '../../common/FormActions';

interface Props {
  readonly meetingId: string;
}

export default function ScheduleModal({ meetingId }: Props) {
  const t = useTr();
  const [schedules, setSchedules] = useState<MeetingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addDisabled, setAddDisabled] = useState(false);
  const [addWarning, setAddWarning] = useState(false);
  const [addKey, setAddKey] = useState(0);
  const fieldsRef = useRef<ScheduleFieldsRef>(null);

  async function load() {
    try {
      setError(false);
      setLoading(true);
      const rows = await listById('/api/pri/meeting/schedule/list/bymeeting', meetingId, 100);
      setSchedules(Array.isArray(rows) ? rows : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [meetingId]);

  async function handleAddSchedule() {
    if (!fieldsRef.current) return;
    try {
      setAddWarning(false);
      setAddDisabled(true);
      const sa: Record<string, string> = {};
      fieldsRef.current.normalizeInto(sa);
      await action('/api/pri/meeting/schedule/add', { meeting_id: meetingId, schedule_attr: sa });
      setAddOpen(false);
      setAddKey((k) => k + 1);
      await load();
    } catch {
      setAddWarning(true);
    } finally {
      setAddDisabled(false);
    }
  }

  return (
    <div>
      {error && <AlertWarning type="error">{t('err.generic')}</AlertWarning>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button type="primary" icon={<i className="bi bi-plus-lg" />} onClick={() => setAddOpen(true)}>
          {t('btn.add_schedule')}
        </Button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {schedules.map((s) => (
            <ScheduleListItem key={s.id} schedule={s} onRefresh={load} />
          ))}
        </div>
      )}

      {!loading && schedules.length === 0 && !error && (
        <AlertWarning>No schedules yet. Add one to get started.</AlertWarning>
      )}

      <Modal
        open={addOpen}
        onCancel={() => { setAddOpen(false); setAddKey((k) => k + 1); }}
        title={t('page.add_schedule')}
        footer={null}
        width={600}
      >
        <Form layout="vertical" key={addKey}>
          <ScheduleFields ref={fieldsRef} />
          {addWarning && <AlertWarning type="error">{t('err.add')}</AlertWarning>}
          <FormActions>
            <ButtonCancel onClick={() => { setAddOpen(false); setAddKey((k) => k + 1); }} disabled={addDisabled} block />
            <ButtonSubmit onClick={handleAddSchedule} disabled={addDisabled} label={t('btn.add_schedule')} htmlType="button" block />
          </FormActions>
        </Form>
      </Modal>
    </div>
  );
}
