import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Modal, Space, Input, Tooltip } from 'antd';
import { get, action, listByValue } from '../../../lib/api';
import { useTr, useI18n } from '../../../i18n';
import { getDayOfNextMonth, getDayOfPreviousMonth, getToday, toLocaleDate, toLocaleMonthNameLong, copyText } from '../../../lib/common';
import type { MeetingSchedule222 } from '../../../types';
import Subheader from '../../../components/common/Subheader';
import AlertWarning from '../../../components/common/AlertWarning';
import Spinner from '../../../components/common/Spinner';
import CalendarGrid from '../../../components/pri/calendar/CalendarGrid';
import MeetingAdd from '../../../components/pri/meeting/MeetingAdd';

export default function CalendarMonthPage() {
  const { date: paramDate } = useParams();
  const navigate = useNavigate();
  const t = useTr();
  const { lang } = useI18n();

  let date: string;
  try {
    const normalized = toLocaleDate(paramDate || '');
    if (normalized !== paramDate) navigate(`/calendar/month/${normalized}`, { replace: true });
    date = normalized;
  } catch {
    const today = getToday();
    navigate(`/calendar/month/${today}`, { replace: true });
    date = today;
  }

  const monthName = (() => {
    try { return `${toLocaleMonthNameLong(date, lang)} ${date.slice(0, 4)}`; } catch { return date; }
  })();

  const [calendar, setCalendar] = useState<MeetingSchedule222[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncToken, setSyncToken] = useState('');
  const [syncCopied, setSyncCopied] = useState(false);
  const [syncRegenerating, setSyncRegenerating] = useState(false);
  const [syncWarning, setSyncWarning] = useState(false);

  async function loadCalendar() {
    try {
      setError(false);
      setLoading(true);
      const rows = await listByValue('/api/pri/calendar/list/bymonth', date, 500);
      setCalendar(Array.isArray(rows) ? rows : []);
    } catch { setError(true); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadCalendar(); }, [date]);

  async function openSyncModal() {
    setSyncWarning(false);
    setSyncToken('');
    setSyncOpen(true);
    try {
      const data = await get('/api/pri/calendar/token/get');
      setSyncToken(data.token);
    } catch { setSyncWarning(true); }
  }

  const syncUrl = syncToken ? `${globalThis.location.protocol}//${localStorage.getItem('galaxy_fqdn') || globalThis.location.host}/api/pub/ical/${syncToken}` : '';
  const webcalUrl = syncUrl.replace(/^https?:\/\//, 'webcal://');

  async function regenerateSyncToken() {
    try {
      setSyncRegenerating(true);
      setSyncWarning(false);
      const data = await action('/api/pri/calendar/token/regenerate', {});
      setSyncToken(data.token);
    } catch { setSyncWarning(true); }
    finally { setSyncRegenerating(false); }
  }

  return (
    <div>
      <Subheader title={monthName} onAdd={() => setAddOpen(true)} addTitle={t('sub.add_meeting')} hrefMeeting="/meeting" hrefMeetingTitle={t('sub.meeting_list')} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 8 }}>
        <Space>
          <Tooltip title={t('sub.prev_month')}><Button icon={<i className="bi bi-chevron-left" />} onClick={() => navigate(`/calendar/month/${getDayOfPreviousMonth(date)}`)} /></Tooltip>
          <Tooltip title={t('sub.today')}><Button icon={<i className="bi bi-calendar-check" />} onClick={() => navigate(`/calendar/month/${getToday()}`)} /></Tooltip>
          <Tooltip title={t('sub.next_month')}><Button icon={<i className="bi bi-chevron-right" />} onClick={() => navigate(`/calendar/month/${getDayOfNextMonth(date)}`)} /></Tooltip>
        </Space>
        <Button icon={<i className="bi bi-calendar-check" />} onClick={openSyncModal}>{t('cal.sync')}</Button>
      </div>
      {error && <AlertWarning type="error">{t('err.generic')}</AlertWarning>}
      {loading ? <Spinner /> : <CalendarGrid date={date} calendar={calendar} />}
      <Modal open={addOpen} onCancel={() => setAddOpen(false)} title={t('page.add_meeting')} footer={null} width={680}>
        <MeetingAdd onCancel={() => setAddOpen(false)} onSuccess={() => { setAddOpen(false); loadCalendar(); }} />
      </Modal>
      <Modal open={syncOpen} onCancel={() => setSyncOpen(false)} title={t('cal.sync_title')} footer={null}>
        {(() => {
          if (syncWarning) return <AlertWarning type="error">{t('err.generic')}</AlertWarning>;
          if (syncToken) return (
            <>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{t('cal.sync_hint')}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Input value={syncUrl} readOnly style={{ fontFamily: 'monospace', fontSize: 12 }} />
                <Button onClick={async () => { await copyText(syncUrl); setSyncCopied(true); setTimeout(() => setSyncCopied(false), 1500); }} icon={syncCopied ? <i className="bi bi-check-lg" style={{ color: '#16a34a' }} /> : <i className="bi bi-clipboard" />} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <Button href={webcalUrl} icon={<i className="bi bi-calendar-plus" />}>{t('cal.sync_subscribe')}</Button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Button danger onClick={regenerateSyncToken} loading={syncRegenerating} icon={<i className="bi bi-arrow-repeat" />}>{t('cal.sync_regenerate')}</Button>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{t('cal.sync_regenerate_warn')}</span>
              </div>
            </>
          );
          return <Spinner />;
        })()}
      </Modal>
    </div>
  );
}
