import { Button, Space, Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import { useTr } from '../../i18n';
import { useIsMobile } from '../../hooks/useIsMobile';

interface Props {
  readonly title: string;
  readonly onAdd?: () => void;
  readonly addTitle?: string;
  readonly addHidden?: boolean;
  readonly hrefCalendar?: string;
  readonly hrefCalendarTitle?: string;
  readonly hrefMeeting?: string;
  readonly hrefMeetingTitle?: string;
  readonly extra?: React.ReactNode;
}

export default function Subheader({
  title, onAdd, addTitle, addHidden,
  hrefCalendar, hrefCalendarTitle,
  hrefMeeting, hrefMeetingTitle, extra,
}: Props) {
  const t = useTr();
  const isMobile = useIsMobile();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
      <Space align="center">
        {hrefCalendar && (
          <Tooltip title={hrefCalendarTitle || t('sub.calendar_view')}>
            <Link to={hrefCalendar}>
              <Button icon={<i className="bi bi-calendar3" />} />
            </Link>
          </Tooltip>
        )}
        {hrefMeeting && (
          <Tooltip title={hrefMeetingTitle || t('sub.meeting_list')}>
            <Link to={hrefMeeting}>
              <Button icon={<i className="bi bi-list-ul" />} />
            </Link>
          </Tooltip>
        )}
        <h5 style={{ margin: 0, fontWeight: 600, fontSize: 18 }}>{title}</h5>
      </Space>
      <Space wrap>
        {extra}
        <Button
          type="primary"
          icon={<i className="bi bi-plus-lg" />}
          onClick={onAdd}
          style={{ visibility: addHidden || !onAdd ? 'hidden' : 'visible' }}
        >
          {isMobile ? null : addTitle}
        </Button>
      </Space>
    </div>
  );
}
