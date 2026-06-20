import React, { useState, useEffect, useRef } from 'react';
import { Form } from 'antd';
import { action, get, list } from '../../../lib/api';
import { useTr } from '../../../i18n';
import { toLocaleDate, toLocaleTime } from '../../../lib/common';
import type { Domain333, Profile, Room333 } from '../../../types';
import AlertWarning from '../../common/AlertWarning';
import ButtonCancel from '../../common/ButtonCancel';
import ButtonSubmit from '../../common/ButtonSubmit';
import FormActions from '../../common/FormActions';
import MeetingFields from './MeetingFields';
import RoomFields from '../room/RoomFields';
import ScheduleFields, { type ScheduleFieldsRef } from '../meeting-schedule/ScheduleFields';

const NEW_ROOM = '__new__';

function makeScheduleRemoveHandler(
  index: number,
  setPending: React.Dispatch<React.SetStateAction<Record<string, string>[]>>,
): () => void {
  return () => setPending((prev) => prev.filter((_, j) => j !== index));
}

interface Props {
  readonly onCancel?: () => void;
  readonly onSuccess?: () => void;
}

type Step = 'meeting' | 'room' | 'schedule';
type SubStep = 'form' | 'choice';

function scheduleSummary(sa: Record<string, string>, t: (k: string) => string): string {
  try {
    const date = toLocaleDate(sa.started_at);
    const time = toLocaleTime(sa.started_at);
    const dur = sa.duration === '1440' ? t('sched.all_day') : `${sa.duration} ${t('sched.mins')}`;
    const typeKeys: Record<string, string> = { o: t('sched.once'), d: t('sched.daily'), w: t('sched.weekly'), m: t('sched.custom') };
    const type = typeKeys[sa.type] ?? sa.type;
    if (sa.duration === '1440') return `${date} — ${type} (${dur})`;
    return `${date} ${time} — ${type} (${dur})`;
  } catch {
    return '—';
  }
}

export default function MeetingAdd({ onCancel, onSuccess }: Props) {
  const t = useTr();
  const [step, setStep] = useState<Step>('meeting');
  const [schedSubStep, setSchedSubStep] = useState<SubStep>('form');
  const [warning, setWarning] = useState(false);
  const [disabled, setDisabled] = useState(false);

  // Meeting step
  const [meetingName, setMeetingName] = useState('');
  const [meetingInfo, setMeetingInfo] = useState('');
  const [roomId, setRoomId] = useState(NEW_ROOM);
  const [rawRooms, setRawRooms] = useState<Room333[]>([]);
  const [profileId, setProfileId] = useState('');
  const [hideDomainInRoom, setHideDomainInRoom] = useState(false);

  // Room step
  const [roomLabel, setRoomLabel] = useState('');
  const [roomSlug, setRoomSlug] = useState('');
  const [roomDomainId, setRoomDomainId] = useState('');

  // Schedule step
  const [pendingSchedules, setPendingSchedules] = useState<Record<string, string>[]>([]);
  const [schedKey, setSchedKey] = useState(0);
  const fieldsRef = useRef<ScheduleFieldsRef>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const [p, rooms, domains] = await Promise.all([
          get('/api/pri/profile/get/default').catch(() => null),
          list('/api/pri/room/list', 500).catch(() => ({ items: [] })),
          list('/api/pri/domain/list', 100).catch(() => []),
        ]);
        if (p) setProfileId((p as Profile).id);
        const roomItems: Room333[] = Array.isArray(rooms) ? rooms : (rooms.items ?? []);
        const enableds = roomItems.filter((r) => r.enabled && r.chain_enabled).sort((a, b) => a.updated_at > b.updated_at ? -1 : 1);
        if (enableds[0]) setRoomId(enableds[0].id);
        setRawRooms(roomItems);
        const domainItems: Domain333[] = Array.isArray(domains) ? domains : (domains.items ?? []);
        if (domainItems.filter((d) => d.enabled).length === 1) setHideDomainInRoom(true);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const roomOptions: [string, string][] = [
    [NEW_ROOM, t('form.new_room')],
    ...rawRooms.map((r): [string, string] => {
      const disabledSuffix = r.enabled && r.chain_enabled ? '' : ` - ${t('meeting.disabled')}`;
      return [r.id, `${r.label} — ${r.domain_url.replace(/^https?:\/\//, '')}/${r.name}${disabledSuffix}`];
    }),
  ];

  function cancel() {
    if (step === 'schedule') {
      if (schedSubStep === 'choice') {
        setSchedSubStep('form');
        setSchedKey((k) => k + 1);
        setWarning(false);
        return;
      }
      setPendingSchedules([]);
      setSchedSubStep('form');
      setStep(roomId === NEW_ROOM ? 'room' : 'meeting');
      setWarning(false);
      return;
    }
    if (step === 'room') { setStep('meeting'); setWarning(false); return; }
    onCancel?.();
  }

  async function handleNext() {
    setWarning(false);
    if (step === 'meeting') {
      if (roomId === NEW_ROOM) { setStep('room'); return; }
      setStep('schedule');
      return;
    }
    if (step === 'room') { setStep('schedule'); return; }
    // schedule step: add to pending
    try {
      if (!fieldsRef.current) throw new Error('no ref');
      const sa: Record<string, string> = {};
      fieldsRef.current.normalizeInto(sa);
      setPendingSchedules((prev) => [...prev, sa]);
      setSchedSubStep('choice');
    } catch {
      setWarning(true);
    }
  }

  async function finalize() {
    try {
      setDisabled(true);
      setWarning(false);
      let finalRoomId = roomId;
      if (roomId === NEW_ROOM) {
        const room = await action('/api/pri/room/add', { label: roomLabel, name: roomSlug, domain_id: roomDomainId, has_suffix: false });
        finalRoomId = room.id;
      }
      const meeting = await action('/api/pri/meeting/add', {
        profile_id: profileId, room_id: finalRoomId,
        name: meetingName, info: meetingInfo, hidden: true, subscribable: true,
      });
      await Promise.all(pendingSchedules.map((sa) => action('/api/pri/meeting/schedule/add', { meeting_id: meeting.id, schedule_attr: sa })));
      onSuccess?.();
    } catch {
      setWarning(true);
      setDisabled(false);
    }
  }

  if (loading) return <div style={{ padding: 32, textAlign: 'center' }}><i className="bi bi-hourglass-split" /></div>;

  return (
    <Form layout="vertical">
      {step === 'meeting' && (
        <MeetingFields name={meetingName} onNameChange={setMeetingName} info={meetingInfo} onInfoChange={setMeetingInfo} roomId={roomId} onRoomIdChange={setRoomId} rooms={roomOptions} disabled={disabled} />
      )}

      {step === 'room' && (
        <>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 12 }}>{t('form.new_room')}</p>
          <RoomFields label={roomLabel} onLabelChange={setRoomLabel} slug={roomSlug} onSlugChange={setRoomSlug} domainId={roomDomainId} onDomainIdChange={setRoomDomainId} hideDomain={hideDomainInRoom} disabled={disabled} />
        </>
      )}

      {step === 'schedule' && schedSubStep === 'form' && (
        <div key={schedKey}>
          <ScheduleFields ref={fieldsRef} />
        </div>
      )}

      {step === 'schedule' && schedSubStep === 'choice' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {pendingSchedules.map((sa, i) => {
            const handleRemove = makeScheduleRemoveHandler(i, setPendingSchedules);
            return (
              <div key={sa.started_at || String(i)} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--color-border)', borderRadius: 6, padding: '6px 12px' }}>
                <i className="bi bi-calendar-check" style={{ color: '#16a34a' }} />
                <span style={{ flex: 1, fontSize: 13 }}>{scheduleSummary(sa, t)}</span>
                <ButtonCancel onClick={handleRemove} label="×" />
              </div>
            );
          })}
        </div>
      )}

      {warning && <AlertWarning type="error">{t('err.add')}</AlertWarning>}

      {step === 'schedule' && schedSubStep === 'choice' ? (
        <FormActions>
          <ButtonCancel onClick={() => { setSchedSubStep('form'); setSchedKey((k) => k + 1); setWarning(false); }} label={t('btn.add_schedule')} disabled={disabled} block />
          <ButtonSubmit onClick={finalize} disabled={disabled} label={t('btn.create_meeting')} htmlType="button" block />
        </FormActions>
      ) : (
        <FormActions>
           <ButtonCancel onClick={cancel} disabled={disabled} label={step === 'meeting' ? t('btn.cancel') : t('sub.back')} block />
          <ButtonSubmit onClick={handleNext} disabled={disabled} label={step === 'schedule' ? t('btn.add_schedule') : t('btn.next')} htmlType="button" block />
        </FormActions>
      )}
    </Form>
  );
}
