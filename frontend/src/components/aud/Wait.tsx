import { useState, useEffect, useRef } from 'react';
import { Button, Card, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getByCode } from '../../lib/api';
import { epochToIntervalString, showLocaleDatetime } from '../../lib/common';
import { useTr, useI18n } from '../../i18n';
import type { MeetingSchedule111 } from '../../types';

interface Props {
  readonly schedule: MeetingSchedule111;
}

export default function Wait({ schedule: initialSchedule }: Props) {
  const t = useTr();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [p, setP] = useState(initialSchedule);
  const [remainingTime, setRemainingTime] = useState('');
  const counterRef = useRef(0);
  const startedAtRef = useRef(new Date(Date.now() + initialSchedule.waiting_time * 1000));

  const REFRESH_SEC = 60;

  useEffect(() => {
    startedAtRef.current = new Date(Date.now() + p.waiting_time * 1000);
  }, [p.waiting_time]);

  useEffect(() => {
    let alive = true;

    async function tick() {
      if (!alive) return;
      const interval = (startedAtRef.current.getTime() - Date.now()) / 1000;

      if (interval < 0) {
        navigate(`/aud/join/${p.code}`);
        return;
      }

      counterRef.current++;
      if (counterRef.current > REFRESH_SEC) {
        counterRef.current = 0;
        try {
          const s = await getByCode('/api/pub/meeting/schedule/get/bycode', p.code || '');
          setP(s as MeetingSchedule111);
          startedAtRef.current = new Date(Date.now() + (s as MeetingSchedule111).waiting_time * 1000);
        } catch {}
      }

      setRemainingTime(epochToIntervalString(interval));
      setTimeout(tick, 1000);
    }

    tick();
    return () => { alive = false; };
  }, [p.code]);

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        <Card style={{ maxWidth: 540, width: '100%', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--color-text-secondary)', background: 'var(--color-bg-subtle)', padding: '12px 24px', borderRadius: 6, marginBottom: 16 }}>
            {remainingTime}
          </h2>
          <h5 style={{ color: 'var(--color-text-secondary)' }}>{p.meeting_name}</h5>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>{showLocaleDatetime(p.started_at, lang)}</p>
          {p.meeting_info && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, textAlign: 'left', whiteSpace: 'pre-wrap', maxWidth: '90%', margin: '0 auto' }}>
              {p.meeting_info}
            </p>
          )}
          <div style={{ marginTop: 24 }}>
            <Space>
              <Button onClick={() => navigate('/')}>{t('btn.cancel')}</Button>
              {p.join_as === 'host' && (
                <Button type="primary" onClick={() => navigate(`/aud/join/${p.code}`)}>
                  {t('btn.join_now')}
                </Button>
              )}
            </Space>
          </div>
        </Card>

      </div>
    </section>
  );
}
