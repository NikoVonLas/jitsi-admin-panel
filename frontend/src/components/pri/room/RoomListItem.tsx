import { useState, useEffect } from 'react';
import { Card, Button, Tooltip, Modal } from 'antd';
import { toDataURL } from 'qrcode';
import { action, actionById, getById } from '../../../lib/api';
import { useTr } from '../../../i18n';
import { copyText } from '../../../lib/common';
import type { Room, Room333 } from '../../../types';
import { HostKeyPanel, JoinLinks } from '../../common/ConferenceAccess';
import { entityCardActions } from '../../common/EntityCardActions';
import RoomUpdate from './RoomUpdate';

interface Props {
  readonly room: Room333;
  readonly onRefresh?: () => void;
}

export default function RoomListItem({ room: p, onRefresh }: Props) {
  const t = useTr();
  const [enabled, setEnabled] = useState(p.enabled);
  const [showEdit, setShowEdit] = useState(false);
  const [roomData, setRoomData] = useState<Room | null>(null);
  const [delLoading, setDelLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedGuest, setCopiedGuest] = useState(false);
  const [copiedMod, setCopiedMod] = useState(false);
  const [canShareUrl, setCanShareUrl] = useState(false);

  // Host key modal
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [hostKey, setHostKey] = useState('');
  const [keyLoading, setKeyLoading] = useState(false);
  const [keyResetting, setKeyResetting] = useState(false);
  const [keyError, setKeyError] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);

  const guestUrl =
    p.chain_enabled && p.short_code ? `${globalThis.location.origin}/r/${p.short_code}` : '';
  const modUrl = p.chain_enabled ? `${globalThis.location.origin}/rm/${p.id}` : '';
  const roomPath = `${(p.domain_url ?? '').replace(/^https?:\/\//, '')}/${p.name}`;
  const roomTitle = p.label || p.name;

  useEffect(() => {
    setCanShareUrl(typeof navigator !== 'undefined' && !!navigator.share);
    if (guestUrl) {
      toDataURL(guestUrl, { width: 512, margin: 2 })
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [guestUrl]);

  async function openKeyModal() {
    setKeyError(false);
    setKeyLoading(true);
    setKeyModalOpen(true);
    try {
      const row = await getById('/api/pri/room/get/hostkey', p.id);
      setHostKey(row.host_key || '');
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
      const row = await action('/api/pri/room/reset/hostkey', { id: p.id });
      setHostKey(row.host_key);
    } catch {
      setKeyError(true);
    } finally {
      setKeyResetting(false);
    }
  }

  async function copyKey() {
    await copyText(hostKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 1500);
  }

  async function downloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-room-${p.id}.png`;
    a.click();
  }

  async function confirmDel() {
    try {
      setDelLoading(true);
      await actionById('/api/pri/room/del', p.id);
      onRefresh?.();
    } catch {
      setDelLoading(false);
    }
  }

  async function confirmToggle() {
    try {
      setToggleLoading(true);
      const endpoint = enabled ? '/api/pri/room/disable' : '/api/pri/room/enable';
      await actionById(endpoint, p.id);
      setEnabled((v) => !v);
    } catch {
      // ignore
    } finally {
      setToggleLoading(false);
    }
  }

  async function openEditModal() {
    try {
      const r = await getById('/api/pri/room/get', p.id);
      setRoomData(r as Room);
      setShowEdit(true);
    } catch {}
  }

  async function handleCopyGuest() {
    await copyText(guestUrl);
    setCopiedGuest(true);
    setTimeout(() => setCopiedGuest(false), 1500);
  }

  async function handleCopyMod() {
    await copyText(modUrl);
    setCopiedMod(true);
    setTimeout(() => setCopiedMod(false), 1500);
  }

  return (
    <>
      <Card
        style={{ height: '100%', borderColor: enabled && p.chain_enabled ? undefined : '#dc2626' }}
        actions={entityCardActions({
          enabled,
          toggleLoading,
          delLoading,
          toggleTitle: enabled ? t('page.disable_room') : t('page.enable_room'),
          toggleDescription: enabled ? t('warn.disable_room') : undefined,
          delTitle: t('page.del_room'),
          delDescription: t('warn.delete_room'),
          onToggle: confirmToggle,
          onDel: confirmDel,
          t,
          extraActions: [
            <Tooltip key="edit" title={t('btn.update')}>
              <Button type="text" icon={<i className="bi bi-pencil" />} onClick={openEditModal} />
            </Tooltip>,
          ],
        })}
      >
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontWeight: 600, wordBreak: 'break-word', marginBottom: 2 }}>
            {roomTitle}
          </div>
          <div
            style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}
          >
            {roomPath}
          </div>
        </div>

        {guestUrl && (
          <JoinLinks
            guestUrl={guestUrl}
            moderatorUrl={modUrl}
            guestCopied={copiedGuest}
            moderatorCopied={copiedMod}
            canShare={canShareUrl}
            keyLoading={keyLoading}
            t={t}
            onCopyGuest={handleCopyGuest}
            onCopyModerator={handleCopyMod}
            onShareGuest={() =>
              navigator.share({ title: roomTitle, url: guestUrl }).catch(() => {})
            }
            onShareModerator={() =>
              navigator.share({ title: roomTitle, url: modUrl }).catch(() => {})
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
          setRoomData(null);
        }}
        title={`${t('page.update_room')} ${roomTitle}`}
        footer={null}
        width={600}
      >
        {roomData && (
          <RoomUpdate
            room={roomData}
            onCancel={() => {
              setShowEdit(false);
              setRoomData(null);
            }}
            onDone={() => {
              setShowEdit(false);
              setRoomData(null);
              onRefresh?.();
            }}
          />
        )}
      </Modal>

      {/* Host key modal */}
      <Modal
        open={keyModalOpen}
        onCancel={() => setKeyModalOpen(false)}
        title={`${t('meeting.host_key')} — ${roomTitle}`}
        footer={null}
      >
        <HostKeyPanel
          error={keyError}
          loading={keyLoading}
          hostKey={hostKey}
          resetting={keyResetting}
          copied={keyCopied}
          t={t}
          onCopy={copyKey}
          onReset={resetKey}
        />
      </Modal>
    </>
  );
}
