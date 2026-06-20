import { useState } from 'react';
import { Card, Button, Tooltip, Popconfirm } from 'antd';
import { actionById } from '../../../lib/api';
import { useTr, useI18n, pluralRu } from '../../../i18n';
import { isAllDay, showLocaleDate, showLocaleDatetime, copyText } from '../../../lib/common';
import type { MeetingSchedule } from '../../../types';

interface Props {
  readonly schedule: MeetingSchedule;
  readonly onRefresh?: () => void;
}

const POS_KEYS: Record<string, string> = {
  '1': 'sched.pos_1', '2': 'sched.pos_2', '3': 'sched.pos_3',
  '4': 'sched.pos_4', '5': 'sched.pos_5',
  '-2': 'sched.pos_penultimate', '-1': 'sched.pos_last',
};

const DAY_FULL_KEYS = ['cal.sun_full', 'cal.mon_full', 'cal.tue_full', 'cal.wed_full', 'cal.thu_full', 'cal.fri_full', 'cal.sat_full'];

function formatPlural(lang: string, n: number, enForm: string, one: string, few: string, many: string): string {
  if (lang === 'ru') return pluralRu(n, one, few, many);
  return `${enForm}${n === 1 ? '' : 's'}`;
}

function getDaysLabel(repDays: string, t: (k: string) => string): string {
  if (!/^[01]{7}$/.exec(repDays)) return '';
  const selected: string[] = [];
  for (let i = 0; i < 7; i++) {
    if (repDays[i] === '1') selected.push(t(DAY_FULL_KEYS[i]));
  }
  if (!selected.length) return '';
  if (selected.length === 1) return selected[0];
  return selected.slice(0, -1).join(', ') + ' ' + t('sched.on') + ' ' + selected[selected.length - 1];
}

function getRepeatDisplay(
  attr: MeetingSchedule['schedule_attr'],
  sessionRemaining: number,
  lang: string,
  t: (k: string) => string,
): string {
  if (attr.type === 'd') {
    if (sessionRemaining === 1) return t('sched.last_session');
    const n = Number(attr.rep_every);
    return `${t('sched.repeat_every')} ${n} ${formatPlural(lang, n, 'day', 'день', 'дня', 'дней')} · ${sessionRemaining} ${formatPlural(lang, sessionRemaining, 'session', 'сессия', 'сессии', 'сессий')} ${t('sched.sessions_remaining')}`;
  }
  if (attr.type === 'w') {
    if (sessionRemaining === 1) return t('sched.last_session');
    const n = Number(attr.rep_every);
    return `${t('sched.repeat_every')} ${n} ${formatPlural(lang, n, 'week', 'неделю', 'недели', 'недель')} ${getDaysLabel(attr.rep_days, t)} · ${sessionRemaining} ${t('sched.sessions_remaining')}`;
  }
  if (attr.type === 'm') {
    if (sessionRemaining === 1) return t('sched.last_session');
    const n = Number(attr.rep_every);
    let modeStr = '';
    if (attr.rep_month_mode === 'd') {
      modeStr = `${t('sched.on_day_num')} ${attr.rep_month_day}`;
    } else {
      modeStr = `${t(POS_KEYS[attr.rep_month_pos] ?? 'sched.pos_1')} ${t(DAY_FULL_KEYS[Number(attr.rep_month_dow)] ?? 'cal.sun_full')}`;
    }
    return `${t('sched.repeat_every')} ${n} ${formatPlural(lang, n, 'month', 'месяц', 'месяца', 'месяцев')} ${modeStr} · ${sessionRemaining} ${t('sched.sessions_remaining')}`;
  }
  return '';
}

export default function ScheduleListItem({ schedule: p, onRefresh }: Props) {
  const t = useTr();
  const { lang } = useI18n();
  const [enabled, setEnabled] = useState(p.enabled);
  const [copied, setCopied] = useState(false);
  const [delLoading, setDelLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  const modUrl = `${globalThis.location.origin}/jm/${p.meeting_id}`;
  const attr = p.schedule_attr;

  async function handleDel() {
    try {
      setDelLoading(true);
      await actionById('/api/pri/meeting/schedule/del', p.id);
      onRefresh?.();
    } catch {
      setDelLoading(false);
    }
  }

  async function handleToggle() {
    try {
      setToggleLoading(true);
      const ep = enabled ? '/api/pri/meeting/schedule/disable' : '/api/pri/meeting/schedule/enable';
      await actionById(ep, p.id);
      setEnabled((v) => !v);
    } catch {
      // ignore
    } finally {
      setToggleLoading(false);
    }
  }

  const timeDisplay = isAllDay(attr.started_at, attr.duration)
    ? showLocaleDate(p.session_at, lang)
    : showLocaleDatetime(p.session_at, lang);

  const durationDisplay = isAllDay(attr.started_at, attr.duration)
    ? t('sched.all_day')
    : `${attr.duration} ${t('sched.mins')}`;

  const repeatDisplay = getRepeatDisplay(attr, p.session_remaining, lang, t);

  return (
    <Card
      style={{ borderColor: enabled ? undefined : '#dc2626' }}
      actions={[
        <Popconfirm key="toggle" title={enabled ? 'Disable this schedule?' : 'Enable this schedule?'} onConfirm={handleToggle} okText={enabled ? t('btn.disable') : t('btn.enable')} cancelText={t('btn.cancel')}>
          <Button type="text" loading={toggleLoading} icon={<i className={`bi ${enabled ? 'bi-pause-circle' : 'bi-play-circle'}`} />} />
        </Popconfirm>,
        <Popconfirm key="del" title="Delete this schedule?" onConfirm={handleDel} okText={t('btn.delete')} cancelText={t('btn.cancel')} okButtonProps={{ danger: true }}>
          <Button type="text" danger loading={delLoading} icon={<i className="bi bi-trash" />} />
        </Popconfirm>,
      ]}
    >
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{timeDisplay}</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginBottom: repeatDisplay ? 8 : 0 }}>{durationDisplay}</div>
        {repeatDisplay && <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{repeatDisplay}</div>}
      </div>
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <a href={modUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t('meeting.moderator_link')}
          </a>
          <code style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{p.host_key}</code>
          <Tooltip title={t('btn.copy')}>
            <Button type="text" onClick={async () => { await copyText(modUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              icon={copied ? <i className="bi bi-check-lg" style={{ color: '#16a34a' }} /> : <i className="bi bi-clipboard" />} />
          </Tooltip>
        </div>
      </div>
    </Card>
  );
}
