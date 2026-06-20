import { useState, useEffect } from 'react';
import { Card, Button, Tooltip, Modal } from 'antd';
import { toDataURL } from 'qrcode';
import { action, actionById, getById } from '../../../lib/api';
import { useTr } from '../../../i18n';
import { copyText } from '../../../lib/common';
import type { Room, Room333 } from '../../../types';
import AlertWarning from '../../common/AlertWarning';
import { entityCardActions } from '../../common/EntityCardActions';
import RoomUpdate from './RoomUpdate';

function formatKey(key: string): string {
  return key.replace(/(.{3})(?=.)/g, '$1 ');
}

interface RoomKeyModalBodyProps {
  readonly keyError: boolean;
  readonly keyLoading: boolean;
  readonly hostKey: string;
  readonly keyResetting: boolean;
  readonly keyCopied: boolean;
  readonly t: (k: string) => string;
  readonly onCopy: () => void;
  readonly onReset: () => void;
}

function RoomKeyModalBody({ keyError, keyLoading, hostKey, keyResetting, keyCopied, t, onCopy, onReset }: RoomKeyModalBodyProps) {
  if (keyError) return <AlertWarning type="error">{t('err.generic')}</AlertWarning>;
  if (keyLoading) return <div style={{ textAlign: 'center', padding: 24 }}><i className="bi bi-hourglass-split" /></div>;
  return (
    <>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{t('meeting.host_key_hint')}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <code style={{ flex: 1, background: 'var(--color-bg-hover)', padding: '6px 12px', borderRadius: 6, fontFamily: 'monospace', letterSpacing: '0.1em' }}>
          {formatKey(hostKey)}
        </code>
        <Button onClick={onCopy} icon={keyCopied ? <i className="bi bi-check-lg" style={{ color: '#16a34a' }} /> : <i className="bi bi-clipboard" />} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button danger onClick={onReset} loading={keyResetting} icon={<i className="bi bi-arrow-clockwise" />}>
          {t('btn.reset_key')}
        </Button>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{t('meeting.host_key_reset_warn')}</span>
      </div>
    </>
  );
}

interface RoomUrlSectionProps {
  readonly guestUrl: string;
  readonly modUrl: string;
  readonly roomTitle: string;
  readonly copiedGuest: boolean;
  readonly copiedMod: boolean;
  readonly canShareUrl: boolean;
  readonly keyLoading: boolean;
  readonly t: (k: string) => string;
  readonly onCopyGuest: () => void;
  readonly onCopyMod: () => void;
  readonly onShareGuest: () => void;
  readonly onShareMod: () => void;
  readonly onDownloadQr: () => void;
  readonly onOpenKeyModal: () => void;
}

function RoomUrlSection({
  guestUrl, modUrl, roomTitle, copiedGuest, copiedMod, canShareUrl,
  keyLoading, t, onCopyGuest, onCopyMod, onShareGuest, onShareMod,
  onDownloadQr, onOpenKeyModal,
}: RoomUrlSectionProps) {
  return (
    <div style={{ marginTop: 8, borderTop: '1px solid var(--color-border)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Guest link */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <a href={guestUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {t('meeting.link')}
        </a>
        <Tooltip title={t('btn.download_qr')}><Button type="text" icon={<i className="bi bi-qr-code" />} onClick={onDownloadQr} /></Tooltip>
        <Tooltip title={t('btn.copy')}>
          <Button type="text" onClick={onCopyGuest}
            icon={copiedGuest ? <i className="bi bi-check-lg" style={{ color: '#16a34a' }} /> : <i className="bi bi-clipboard" />} />
        </Tooltip>
        {canShareUrl && <Tooltip title={t('btn.share')}><Button type="text" icon={<i className="bi bi-share" />} onClick={onShareGuest} /></Tooltip>}
      </div>

      {/* Mod link */}
      {modUrl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <a href={modUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t('meeting.moderator_link')}
          </a>
          <Tooltip title={t('meeting.host_key')}>
            <Button type="text" loading={keyLoading} icon={<i className="bi bi-key" />} onClick={onOpenKeyModal} />
          </Tooltip>
          <Tooltip title={t('btn.copy')}>
            <Button type="text" onClick={onCopyMod}
              icon={copiedMod ? <i className="bi bi-check-lg" style={{ color: '#16a34a' }} /> : <i className="bi bi-clipboard" />} />
          </Tooltip>
          {canShareUrl && <Tooltip title={t('btn.share')}><Button type="text" icon={<i className="bi bi-share" />} onClick={onShareMod} /></Tooltip>}
        </div>
      )}
    </div>
  );
}

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

  const guestUrl = p.chain_enabled && p.short_code ? `${globalThis.location.origin}/r/${p.short_code}` : '';
  const modUrl = p.chain_enabled ? `${globalThis.location.origin}/rm/${p.id}` : '';
  const roomPath = `${(p.domain_url ?? '').replace(/^https?:\/\//, '')}/${p.name}`;
  const roomTitle = p.label || p.name;

  useEffect(() => {
    setCanShareUrl(typeof navigator !== 'undefined' && !!navigator.share);
    if (guestUrl) {
      toDataURL(guestUrl, { width: 512, margin: 2 }).then(setQrDataUrl).catch(() => {});
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
          <div style={{ fontWeight: 600, wordBreak: 'break-word', marginBottom: 2 }}>{roomTitle}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{roomPath}</div>
        </div>

        {guestUrl && (
          <RoomUrlSection
            guestUrl={guestUrl}
            modUrl={modUrl}
            roomTitle={roomTitle}
            copiedGuest={copiedGuest}
            copiedMod={copiedMod}
            canShareUrl={canShareUrl}
            keyLoading={keyLoading}
            t={t}
            onCopyGuest={handleCopyGuest}
            onCopyMod={handleCopyMod}
            onShareGuest={() => navigator.share({ title: roomTitle, url: guestUrl }).catch(() => {})}
            onShareMod={() => navigator.share({ title: roomTitle, url: modUrl }).catch(() => {})}
            onDownloadQr={downloadQr}
            onOpenKeyModal={openKeyModal}
          />
        )}
      </Card>

      {/* Edit modal */}
      <Modal open={showEdit} onCancel={() => { setShowEdit(false); setRoomData(null); }} title={`${t('page.update_room')} ${roomTitle}`} footer={null} width={600}>
        {roomData && <RoomUpdate room={roomData} onCancel={() => { setShowEdit(false); setRoomData(null); }} onDone={() => { setShowEdit(false); setRoomData(null); onRefresh?.(); }} />}
      </Modal>

      {/* Host key modal */}
      <Modal open={keyModalOpen} onCancel={() => setKeyModalOpen(false)} title={`${t('meeting.host_key')} — ${roomTitle}`} footer={null}>
        <RoomKeyModalBody
          keyError={keyError}
          keyLoading={keyLoading}
          hostKey={hostKey}
          keyResetting={keyResetting}
          keyCopied={keyCopied}
          t={t}
          onCopy={copyKey}
          onReset={resetKey}
        />
      </Modal>
    </>
  );
}
