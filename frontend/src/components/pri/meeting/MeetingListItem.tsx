import { useState, useEffect } from 'react';
import { Card, Tag, Button, Tooltip, Modal, Popconfirm } from 'antd';
import { action, actionById, getById, listById } from '../../../lib/api';
import { useTr, useI18n } from '../../../i18n';
import { isOnline, isToday, showLocaleDatetime, copyText } from '../../../lib/common';
import { useRoleStore } from '../../../store/role';
import { toDataURL } from 'qrcode';
import type { Meeting, Meeting222 } from '../../../types';
import { HostKeyPanel, JoinLinks } from '../../common/ConferenceAccess';
import MeetingUpdate from './MeetingUpdate';
import ScheduleModal from '../meeting-schedule/ScheduleModal';

function getSessionColor(sessionList: string[]): string {
  if (!sessionList[0]) return 'var(--color-text-secondary)';
  if (isOnline(sessionList[0])) return '#3949ab';
  if (isToday(sessionList[0])) return '#d97706';
  return 'var(--color-text-secondary)';
}

interface BuildActionsOptions {
  readonly ownership: string;
  readonly scheduleType: string | undefined;
  readonly enabled: boolean;
  readonly toggleLoading: boolean;
  readonly delLoading: boolean;
  readonly t: (k: string) => string;
  readonly onEdit: () => void;
  readonly onShowSchedule: () => void;
  readonly onToggle: () => void;
  readonly onDel: () => void;
}

function buildMeetingActions(o: BuildActionsOptions) {
  if (o.ownership !== 'owner') return undefined;
  return [
    <Tooltip key="edit" title={o.t('btn.update')}>
      <Button type="text" icon={<i className="bi bi-pencil" />} onClick={o.onEdit} />
    </Tooltip>,
    ...(o.scheduleType === 'ephemeral'
      ? []
      : [
          <Tooltip key="sched" title={o.t('btn.show_schedules')}>
            <Button
              type="text"
              icon={<i className="bi bi-calendar3" />}
              onClick={o.onShowSchedule}
            />
          </Tooltip>,
        ]),
    <Popconfirm
      key="toggle"
      title={o.enabled ? o.t('page.disable_meeting') : o.t('page.enable_meeting')}
      description={o.enabled ? o.t('warn.disable_meeting') : undefined}
      onConfirm={o.onToggle}
      okText={o.enabled ? o.t('btn.disable') : o.t('btn.enable')}
      cancelText={o.t('btn.cancel')}
    >
      <Tooltip title={o.enabled ? o.t('btn.disable') : o.t('btn.enable')}>
        <Button
          type="text"
          loading={o.toggleLoading}
          icon={<i className={`bi ${o.enabled ? 'bi-pause-circle' : 'bi-play-circle'}`} />}
        />
      </Tooltip>
    </Popconfirm>,
    <Popconfirm
      key="del"
      title={o.t('page.del_meeting')}
      description={o.t('warn.delete_meeting')}
      onConfirm={o.onDel}
      okText={o.t('btn.delete')}
      cancelText={o.t('btn.cancel')}
      okButtonProps={{ danger: true }}
    >
      <Tooltip title={o.t('btn.delete')}>
        <Button type="text" danger loading={o.delLoading} icon={<i className="bi bi-trash" />} />
      </Tooltip>
    </Popconfirm>,
  ];
}

interface Props {
  readonly meeting: Meeting222;
  readonly onRefresh?: () => void;
}

export default function MeetingListItem({ meeting: p, onRefresh }: Props) {
  const t = useTr();
  const { lang } = useI18n();
  const { isSuperAdmin } = useRoleStore();
  const [enabled, setEnabled] = useState(p.enabled);
  const [showEdit, setShowEdit] = useState(false);
  const [meetingData, setMeetingData] = useState<Meeting | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [delLoading, setDelLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [url, setUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedMod, setCopiedMod] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // Host key
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [hostKey, setHostKey] = useState('');
  const [keyLoading, setKeyLoading] = useState(false);
  const [keyResetting, setKeyResetting] = useState(false);
  const [keyScheduleId, setKeyScheduleId] = useState('');
  const [keyError, setKeyError] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);

  const moderatorUrl = p.chain_enabled ? `${globalThis.location.origin}/jm/${p.id}` : '';

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
    if (!p.chain_enabled) return;
    if (p.short_code) {
      const u = `${globalThis.location.origin}/j/${p.short_code}`;
      setUrl(u);
      toDataURL(u, { width: 512, margin: 2 })
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [p]);

  async function openKeyModal() {
    setKeyError(false);
    setKeyLoading(true);
    setKeyModalOpen(true);
    try {
      const schedules = await listById('/api/pri/meeting/schedule/list/bymeeting', p.id, 1);
      if (schedules[0]) {
        setHostKey(schedules[0].host_key);
        setKeyScheduleId(schedules[0].id);
      }
    } catch {
      setKeyError(true);
    } finally {
      setKeyLoading(false);
    }
  }

  async function resetKey() {
    try {
      setKeyError(false);
      setKeyResetting(true);
      const row = await action('/api/pri/meeting/schedule/reset/hostkey', { id: keyScheduleId });
      setHostKey(row.host_key);
    } catch {
      setKeyError(true);
    } finally {
      setKeyResetting(false);
    }
  }

  async function handleKeyCopy() {
    await copyText(hostKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 1500);
  }

  async function openEditModal() {
    try {
      const m = await getById('/api/pri/meeting/get', p.id);
      setMeetingData(m as Meeting);
      setShowEdit(true);
    } catch {}
  }

  async function confirmDel() {
    try {
      setDelLoading(true);
      await actionById('/api/pri/meeting/del', p.id);
      onRefresh?.();
    } catch {
      setDelLoading(false);
    }
  }

  async function confirmToggle() {
    try {
      setToggleLoading(true);
      const ep = enabled ? '/api/pri/meeting/disable' : '/api/pri/meeting/enable';
      await actionById(ep, p.id);
      setEnabled((v) => !v);
    } catch {
      // ignore
    } finally {
      setToggleLoading(false);
    }
  }

  function downloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-${p.short_code || p.id}.png`;
    a.click();
  }

  async function handleCopyUrl() {
    await copyText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1500);
  }

  async function handleCopyMod() {
    await copyText(moderatorUrl);
    setCopiedMod(true);
    setTimeout(() => setCopiedMod(false), 1500);
  }

  const sessionList = [...new Set(p.session_list)].slice(0, 3);
  const sessionColor = getSessionColor(sessionList);

  const actions = buildMeetingActions({
    ownership: p.ownership,
    scheduleType: p.schedule_type,
    enabled,
    toggleLoading,
    delLoading,
    t,
    onEdit: openEditModal,
    onShowSchedule: () => setShowSchedule(true),
    onToggle: confirmToggle,
    onDel: confirmDel,
  });

  return (
    <>
      <Card
        style={{ height: '100%', borderColor: enabled && p.chain_enabled ? undefined : '#dc2626' }}
        actions={actions}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 4,
          }}
        >
          <span style={{ fontWeight: 600, wordBreak: 'break-word' }}>{p.name}</span>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              alignItems: 'flex-end',
              flexShrink: 0,
            }}
          >
            {p.schedule_type === 'ephemeral' && <Tag>{t('meeting.type.ephemeral')}</Tag>}
            {isSuperAdmin && p.profile_email && (
              <Tooltip title={p.profile_name || p.profile_email}>
                <Tag
                  style={{
                    maxWidth: 120,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: 'default',
                  }}
                >
                  {p.profile_email}
                </Tag>
              </Tooltip>
            )}
          </div>
        </div>

        {p.info && (
          <p
            style={{
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              margin: '4px 0',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              whiteSpace: 'pre-wrap',
            }}
          >
            {p.info}
          </p>
        )}

        {p.schedule_type !== 'ephemeral' && (
          <div style={{ marginTop: 4 }}>
            {sessionList.length > 0 ? (
              <span style={{ fontSize: 12 }}>
                <span style={{ color: 'var(--color-text-tertiary)' }}>
                  {p.session_list.length === 1
                    ? t('meeting.once_session')
                    : t('meeting.next_session')}
                  :&nbsp;
                </span>
                <span style={{ fontWeight: 600, color: sessionColor }}>
                  {showLocaleDatetime(sessionList[0], lang)}
                </span>
              </span>
            ) : (
              <span
                style={{ fontSize: 12, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}
              >
                {t('meeting.not_planned')}
              </span>
            )}
          </div>
        )}

        {url && (
          <JoinLinks
            guestUrl={url}
            moderatorUrl={moderatorUrl}
            guestCopied={copiedUrl}
            moderatorCopied={copiedMod}
            canShare={canShare}
            keyLoading={keyLoading}
            t={t}
            onCopyGuest={handleCopyUrl}
            onCopyModerator={handleCopyMod}
            onShareGuest={() => navigator.share({ title: p.name, url }).catch(() => {})}
            onShareModerator={() =>
              navigator.share({ title: p.name, url: moderatorUrl }).catch(() => {})
            }
            onDownloadQr={downloadQr}
            onOpenKey={openKeyModal}
          />
        )}
      </Card>

      {/* Edit modal */}
      <Modal
        open={showEdit}
        onCancel={() => {
          setShowEdit(false);
          setMeetingData(null);
        }}
        title={`${t('page.update_meeting')} ${p.name}`}
        footer={null}
        width={600}
      >
        {meetingData && (
          <MeetingUpdate
            meeting={meetingData}
            onDone={() => {
              setShowEdit(false);
              setMeetingData(null);
              onRefresh?.();
            }}
          />
        )}
      </Modal>

      {/* Schedule modal */}
      <Modal
        open={showSchedule}
        onCancel={() => setShowSchedule(false)}
        title={`${t('page.schedules')} — ${p.name}`}
        footer={null}
        width={700}
      >
        {showSchedule && <ScheduleModal meetingId={p.id} />}
      </Modal>

      {/* Host key modal */}
      <Modal
        open={keyModalOpen}
        onCancel={() => setKeyModalOpen(false)}
        title={`${t('meeting.host_key')} — ${p.name}`}
        footer={null}
      >
        <HostKeyPanel
          error={keyError}
          loading={keyLoading}
          hostKey={hostKey}
          resetting={keyResetting}
          copied={keyCopied}
          t={t}
          onCopy={handleKeyCopy}
          onReset={resetKey}
        />
      </Modal>
    </>
  );
}
