import { useNavigate } from 'react-router-dom';
import { getFirstDayOfMonth, getFirstDayOfWeek, getToday, toCalendarDayLabel, toLocaleDate, toLocaleTime } from '../../../lib/common';
import { useI18n, useTr } from '../../../i18n';
import type { MeetingSchedule222 } from '../../../types';

interface Props {
  readonly date: string;
  readonly calendar: MeetingSchedule222[];
}

const DAY_KEYS = ['cal.sun', 'cal.mon', 'cal.tue', 'cal.wed', 'cal.thu', 'cal.fri', 'cal.sat'];
const WEEKS = [0, 1, 2, 3, 4, 5];
const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function CalendarGrid({ date, calendar }: Props) {
  const t = useTr();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const weekStart = Number(localStorage.getItem('week_start') ?? 1);
  const headers = Array.from({ length: 7 }, (_, i) => t(DAY_KEYS[(weekStart + i) % 7]));
  const calendarDay = toLocaleDate(date);
  const firstOfMonth = getFirstDayOfMonth(date);
  const firstDay = getFirstDayOfWeek(firstOfMonth);
  const today = getToday();

  return (
    <div style={{ marginTop: 8, overflowX: 'auto' }}>
      <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', minHeight: 400 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={DAY_KEYS[(weekStart + i) % 7]} style={{ padding: '4px 8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {WEEKS.map((week) => (
            <tr key={week}>
              {DAYS.map((day) => {
                // Correct: iterate over calendar days in week order
                const actualDay = (() => {
                  const fdDate = new Date(firstDay);
                  const d = new Date(fdDate.getTime() + (week * 7 + day) * 24 * 60 * 60 * 1000);
                  return (
                    d.getFullYear() + '-' +
                    ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
                    ('0' + d.getDate()).slice(-2)
                  );
                })();
                const dayNum = Number(actualDay.slice(-2));
                const isCurrentMonth = actualDay.slice(0, 7) === calendarDay.slice(0, 7);
                const isToday = actualDay === today;
                const meetings = calendar.filter((m) => actualDay === toLocaleDate(m.started_at));
                const dayLabel = dayNum === 1 ? toCalendarDayLabel(actualDay, lang) : String(dayNum);
                let dayColor: string;
                if (!isCurrentMonth) {
                  dayColor = 'var(--color-text-tertiary)';
                } else if (isToday) {
                  dayColor = 'var(--color-today-text, #3949ab)';
                } else {
                  dayColor = 'var(--color-text-secondary)';
                }
                const handleDayClick = () => navigate(`/meeting?date=${actualDay}`);

                return (
                  <td
                    key={day}
                    style={{
                      border: '1px solid var(--color-border)',
                      padding: 2,
                      verticalAlign: 'top',
                      height: 86,
                      background: isToday ? 'var(--color-today-bg, #f0f5ff)' : undefined,
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ textAlign: 'right', fontSize: 11, color: dayColor, padding: '2px 4px', fontWeight: isToday ? 700 : 400 }}>
                      {dayLabel}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {meetings.map((m) => (
                        <button
                          key={`${m.meeting_id}-${m.started_at}`}
                          onClick={handleDayClick}
                          style={{
                            background: '#3949ab',
                            color: 'var(--color-bg)',
                            border: 'none',
                            borderRadius: 3,
                            padding: '0 4px',
                            fontSize: 11,
                            textAlign: 'left',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            width: '100%',
                          }}
                        >
                          {toLocaleTime(m.started_at)} {m.meeting_name}
                        </button>
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
