import { Card, Tag, Button, Space, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTr } from '../../../i18n';
import type { Profile } from '../../../types';

function avatarInitials(n: string): string {
  const words = n.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  '#1a73e8', '#e53935', '#43a047', '#fb8c00', '#8e24aa',
  '#00897b', '#d81b60', '#3949ab', '#039be5', '#f4511e',
];

function avatarColor(n: string): string {
  let hash = 0;
  for (let i = 0; i < n.length; i++) hash = Math.trunc(hash * 31 + (n.codePointAt(i) ?? 0));
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface Props {
  readonly profile: Profile;
}

export default function ProfileListItem({ profile }: Props) {
  const t = useTr();
  const navigate = useNavigate();

  return (
    <Card
      style={{ height: '100%' }}
      actions={[
        <Tooltip key="update" title={t('btn.update')}>
          <Button type="text" icon={<i className="bi bi-pencil" />} onClick={() => navigate(`/profile/update/${profile.id}`)} />
        </Tooltip>,
        ...(profile.is_default
          ? []
          : [
              <Tooltip key="default" title={t('btn.set_default_profile')}>
                <Button type="text" icon={<i className="bi bi-star" />} onClick={() => navigate(`/profile/set/default/${profile.id}`)} />
              </Tooltip>,
            ]),
        <Tooltip key="delete" title={t('btn.delete')}>
          <Button type="text" danger icon={<i className="bi bi-trash" />} onClick={() => navigate(`/profile/del/${profile.id}`)} />
        </Tooltip>,
      ]}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="avatar"
            style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div
            className="avatar-initials"
            style={{
              width: 48, height: 48, flexShrink: 0,
              background: avatarColor(profile.name),
              fontSize: '1.1rem',
            }}
          >
            {avatarInitials(profile.name)}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile.name}
          </div>
          {profile.email && (
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.email}
            </div>
          )}
          <Space style={{ marginTop: 4 }}>
            {profile.is_default && <Tag color="default">{t('profile.default')}</Tag>}
          </Space>
        </div>
      </div>
    </Card>
  );
}
