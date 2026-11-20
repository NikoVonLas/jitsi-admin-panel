import { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Space, Spin } from 'antd';
import { action, listById } from '../../../lib/api';
import { useTr } from '../../../i18n';
import AlertWarning from '../../common/AlertWarning';

interface Member {
  id: string;
  email: string | null;
}

interface Props {
  readonly roomId: string;
  readonly title: string;
  readonly onClose: () => void;
}

export default function RoomModerators({ roomId, title, onClose }: Props) {
  const t = useTr();
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const endpoint = '/api/pri/room/moderators';

  useEffect(() => {
    let active = true;
    listById(endpoint + '/list', roomId)
      .then((rows: Member[]) => {
        if (active) setMembers(rows);
      })
      .catch(() => {
        if (active) setError(t('err.generic'));
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [roomId, t]);

  async function save(member?: Member) {
    setBusy(true);
    setError('');
    try {
      if (member) {
        await action(endpoint + '/remove', { id: roomId, identity_id: member.id });
      } else {
        await action(endpoint + '/add', { id: roomId, email: email.trim() });
        setEmail('');
      }
    } catch {
      setError(member ? t('err.generic') : t('room.moderator_add_error'));
      setBusy(false);
      return;
    }
    try {
      setMembers(await listById(endpoint + '/list', roomId));
    } catch {
      setError(t('err.generic'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open title={t('room.moderators') + ' — ' + title} footer={null} onCancel={onClose}>
      <Form onFinish={() => save()} layout="vertical">
        <Form.Item label={t('room.moderator_email')} htmlFor="room-moderator-email">
          <Space.Compact block>
            <Input
              id="room-moderator-email"
              type="email"
              required
              value={email}
              disabled={busy}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button type="primary" htmlType="submit" disabled={busy || !email.trim()}>
              {t('btn.add')}
            </Button>
          </Space.Compact>
        </Form.Item>
      </Form>
      {error && <AlertWarning type="error">{error}</AlertWarning>}
      {busy && <Spin size="small" />}
      {members.map((member) => (
        <div
          key={member.id}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
        >
          <span>{member.email || member.id}</span>
          <Button danger type="text" disabled={busy} onClick={() => save(member)}>
            {t('room.revoke_moderator')}
          </Button>
        </div>
      ))}
    </Modal>
  );
}
