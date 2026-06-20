import { useState, useImperativeHandle, forwardRef } from 'react';
import { Form, Radio, Checkbox, Row, Col, Space } from 'antd';
import { useTr } from '../../../i18n';
import {
  dateAfterXDays, getDuration, getEndTime, getLastDayOfWeek,
  getToday, isAllDay, isOver, toLocaleDate, toLocaleTime,
} from '../../../lib/common';
import FormDate from '../../common/FormDate';
import FormTime from '../../common/FormTime';
import FormNumber from '../../common/FormNumber';
import FormSelect from '../../common/FormSelect';
import FormSwitch from '../../common/FormSwitch';

export interface ScheduleFieldsRef {
  normalizeInto: (sa: Record<string, string>) => void;
}

interface Props {
  readonly initial?: Record<string, string>;
}

function buildScheduleOnce(sa: Record<string, string>, started_at: Date, dur: number): void {
  if (isOver(started_at, dur)) throw new Error('already over');
}

function buildScheduleDaily(
  sa: Record<string, string>,
  started_at: Date,
  dur: number,
  timesMode: string,
  times: number,
  every: number,
): void {
  if (timesMode === 'forever') {
    sa.rep_end_type = 'forever';
    sa.rep_end_x = '';
  } else {
    if (isOver(started_at, (times - 1) * every * 1440 + dur)) throw new Error('already over');
    sa.rep_end_type = 'x';
    sa.rep_end_x = String(times);
  }
  sa.rep_every = String(every);
}

function buildScheduleWeekly(
  sa: Record<string, string>,
  started_at: Date,
  ended_at: Date,
  date0: string,
  date1: string,
  every: number,
  days: boolean[],
): void {
  if (isOver(ended_at)) throw new Error('already over');
  if (date1 < date0) throw new Error('invalid period');
  if (!days.some(Boolean)) throw new Error('no day');
  sa.rep_end_type = 'at';
  sa.rep_end_at = ended_at.toISOString();
  sa.rep_every = String(every);
  sa.rep_days = days.map((b) => (b ? '1' : '0')).join('');
}

interface BuildScheduleMonthlyOptions {
  sa: Record<string, string>;
  ended_at: Date;
  date0: string;
  date1: string;
  everyMonth: number;
  monthMode: string;
  monthDay: number;
  monthPos: string;
  monthDow: string;
}

function buildScheduleMonthly({
  sa, ended_at, date0, date1, everyMonth, monthMode, monthDay, monthPos, monthDow,
}: BuildScheduleMonthlyOptions): void {
  if (isOver(ended_at)) throw new Error('already over');
  if (date1 < date0) throw new Error('invalid period');
  sa.rep_end_type = 'at';
  sa.rep_end_at = ended_at.toISOString();
  sa.rep_every = String(everyMonth);
  sa.rep_month_mode = monthMode;
  if (monthMode === 'd') {
    sa.rep_month_day = String(monthDay);
  } else {
    sa.rep_month_pos = monthPos;
    sa.rep_month_dow = monthDow;
  }
}

function defaultStartTime(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
}

const ScheduleFields = forwardRef<ScheduleFieldsRef, Props>(({ initial }, ref) => {
  const t = useTr();
  const isEdit = !!initial;
  const timezoneOffset = new Date().getTimezoneOffset();
  const dateAfter90Days = dateAfterXDays(90);

  const [schedType, setSchedType] = useState(initial?.type ?? 'o');
  const [date0, setDate0] = useState(initial ? toLocaleDate(initial.started_at) : getToday());
  const [date1, setDate1] = useState(() => {
    if (initial?.rep_end_at) return toLocaleDate(initial.rep_end_at);
    if (initial?.started_at) return toLocaleDate(initial.started_at);
    return getLastDayOfWeek(`${dateAfter90Days}T00:00:00`);
  });
  const [time0, setTime0] = useState(initial ? toLocaleTime(initial.started_at) : defaultStartTime());
  const [time1, setTime1] = useState(() => {
    const t0 = initial ? toLocaleTime(initial.started_at) : defaultStartTime();
    const dur = initial ? Number(initial.duration) : 30;
    try { return getEndTime(t0, dur); } catch { return t0; }
  });
  const [allDay, setAllDay] = useState(initial ? isAllDay(initial.started_at, initial.duration) : false);
  const [duration, setDuration] = useState(initial ? Number(initial.duration) : 30);
  const [every, setEvery] = useState(Number(initial?.rep_every) || 1);
  const [everyMonth, setEveryMonth] = useState(Number(initial?.rep_every) || 1);
  const [timesMode, setTimesMode] = useState(initial?.rep_end_type === 'forever' ? 'forever' : 'custom');
  const [times, setTimes] = useState(Number(initial?.rep_end_x) || 10);
  const weekDays = initial?.rep_days
    ? Array.from(initial.rep_days).map((c) => c === '1')
    : [false, true, true, true, true, true, false];
  const [days, setDays] = useState(weekDays);
  const [monthMode, setMonthMode] = useState(initial?.rep_month_mode ?? 'd');
  const todayDate = new Date(`${getToday()}T00:00`);
  const [monthDay, setMonthDay] = useState(Number(initial?.rep_month_day) || todayDate.getDate());
  const [monthPos, setMonthPos] = useState(initial?.rep_month_pos ?? '1');
  const [monthDow, setMonthDow] = useState(initial?.rep_month_dow ?? `${todayDate.getDay()}`);

  function handleTime0Change(v: string) {
    setTime0(v);
    try { setTime1(getEndTime(v, duration)); } catch {}
  }
  function handleTime1Change(v: string) {
    setTime1(v);
    try { setDuration(getDuration(time0, v)); } catch {}
  }
  function handleDurationChange(v: number) {
    const d = Math.max(1, Math.min(1440, v));
    setDuration(d);
    try { setTime1(getEndTime(time0, d)); } catch {}
  }

  useImperativeHandle(ref, () => ({
    normalizeInto(sa: Record<string, string>) {
      sa.timezone_offset = `${timezoneOffset}`;
      sa.type = schedType;
      let t0 = time0, dur = duration;
      if (allDay) { t0 = '00:00'; dur = 1440; }
      const started_at = new Date(`${date0}T${t0}`);
      const ended_at = new Date(`${date1}T23:59:59`);

      if (schedType === 'o') {
        buildScheduleOnce(sa, started_at, dur);
      } else if (schedType === 'd') {
        buildScheduleDaily(sa, started_at, dur, timesMode, times, every);
      } else if (schedType === 'w') {
        buildScheduleWeekly(sa, started_at, ended_at, date0, date1, every, days);
      } else if (schedType === 'm') {
        buildScheduleMonthly({ sa, ended_at, date0, date1, everyMonth, monthMode, monthDay, monthPos, monthDow });
      }

      sa.started_at = started_at.toISOString();
      sa.duration = String(dur);
    },
  }));

  const schedTypeOptions = [
    { value: 'o', label: t('sched.once') },
    { value: 'd', label: t('sched.daily') },
    { value: 'w', label: t('sched.weekly') },
    { value: 'm', label: t('sched.custom') },
  ];

  const weekStart = Number(localStorage.getItem('week_start') ?? 1);
  const DOW_KEYS = ['cal.sun', 'cal.mon', 'cal.tue', 'cal.wed', 'cal.thu', 'cal.fri', 'cal.sat'];
  const DOW_FULL_KEYS = ['cal.sun_full', 'cal.mon_full', 'cal.tue_full', 'cal.wed_full', 'cal.thu_full', 'cal.fri_full', 'cal.sat_full'];
  const monthWeekdayOptions: [string, string][] = Array.from({ length: 7 }, (_, i) => {
    const dow = (weekStart + i) % 7;
    return [`${dow}`, t(DOW_FULL_KEYS[dow])];
  });
  const monthPositionOptions: [string, string][] = [
    ['1', t('sched.pos_1')], ['2', t('sched.pos_2')], ['3', t('sched.pos_3')],
    ['4', t('sched.pos_4')], ['5', t('sched.pos_5')],
    ['-2', t('sched.pos_penultimate')], ['-1', t('sched.pos_last')],
  ];

  return (
    <div>
      {!isEdit && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
          <Radio.Group
            options={schedTypeOptions}
            value={schedType}
            onChange={(e) => setSchedType(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          />
        </div>
      )}

      {schedType === 'o' && (
        <FormDate name="date0" label={t('form.date')} value={date0} onChange={setDate0} required />
      )}

      {schedType === 'd' && (
        <>
          <FormDate name="date0" label={t('form.from')} value={date0} onChange={setDate0} required />
          <FormNumber name="every" label={t('form.every_days')} value={every} onChange={setEvery} min={1} />
          <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
            <Radio.Group
              options={[{ value: 'forever', label: t('sched.rep_forever') }, { value: 'custom', label: t('sched.rep_custom') }]}
              value={timesMode}
              onChange={(e) => setTimesMode(e.target.value)}
              optionType="button"
            />
          </div>
          {timesMode === 'custom' && (
            <FormNumber name="times" label={t('form.rep_count')} value={times} onChange={setTimes} min={1} />
          )}
        </>
      )}

      {schedType === 'w' && (
        <>
          <Row gutter={12}>
            <Col span={12}><FormDate name="date0" label={t('form.from')} value={date0} onChange={setDate0} required /></Col>
            <Col span={12}><FormDate name="date1" label={t('form.to')} value={date1} onChange={setDate1} required /></Col>
          </Row>
          <FormNumber name="every" label={t('form.every_weeks')} value={every} onChange={setEvery} min={1} />
          <Form.Item label="">
            <Space wrap>
              {Array.from({ length: 7 }, (_, i) => {
                const dow = (weekStart + i) % 7;
                return (
                  <Checkbox
                    key={dow}
                    checked={days[dow]}
                    onChange={(e) => {
                      const newDays = [...days];
                      newDays[dow] = e.target.checked;
                      setDays(newDays);
                    }}
                  >
                    {t(DOW_KEYS[dow])}
                  </Checkbox>
                );
              })}
            </Space>
          </Form.Item>
        </>
      )}

      {schedType === 'm' && (
        <>
          <Row gutter={12}>
            <Col span={12}><FormDate name="date0" label={t('form.from')} value={date0} onChange={setDate0} required /></Col>
            <Col span={12}><FormDate name="date1" label={t('form.to')} value={date1} onChange={setDate1} required /></Col>
          </Row>
          <FormNumber name="everyMonth" label={t('form.every_months')} value={everyMonth} onChange={setEveryMonth} min={1} />
          <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
            <Radio.Group
              options={[{ value: 'd', label: t('form.month_mode_d') }, { value: 'w', label: t('form.month_mode_w') }]}
              value={monthMode}
              onChange={(e) => setMonthMode(e.target.value)}
              optionType="button"
            />
          </div>
          {monthMode === 'd' ? (
            <FormNumber name="monthDay" label={t('form.month_day')} value={monthDay} onChange={setMonthDay} min={1} max={31} />
          ) : (
            <Row gutter={12}>
              <Col span={12}><FormSelect name="monthPos" label={t('form.month_position')} value={monthPos} onChange={setMonthPos} options={monthPositionOptions} /></Col>
              <Col span={12}><FormSelect name="monthDow" label={t('form.month_weekday')} value={monthDow} onChange={setMonthDow} options={monthWeekdayOptions} /></Col>
            </Row>
          )}
        </>
      )}

      <div style={{ marginTop: 16 }}>
        <FormSwitch label={t('form.all_day')} checked={allDay} onChange={setAllDay} />
      </div>

      {!allDay && (
        <Row gutter={12}>
          <Col span={12}><FormTime name="time0" label={t('form.start_time')} value={time0} onChange={handleTime0Change} required /></Col>
          <Col span={12}><FormTime name="time1" label={t('form.end_time')} value={time1} onChange={handleTime1Change} required /></Col>
        </Row>
      )}
    </div>
  );
});

ScheduleFields.displayName = 'ScheduleFields';
export default ScheduleFields;
