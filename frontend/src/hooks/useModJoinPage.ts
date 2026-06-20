import { useState, useEffect } from 'react';
import { toDataURL } from 'qrcode';

export type JoinError = '' | 'too_early' | 'invalid';

export class JoinPageError extends Error {
  constructor(public readonly code: Exclude<JoinError, ''>) {
    super(code);
  }
}

export interface ModJoinPageConfig {
  uuid: string;
  /** URL path prefix for the participant link, e.g. '/j/' or '/r/' */
  participantPathPrefix: string;
  /** Fetch display name and short code; thrown errors are silently ignored */
  fetchInfo: (uuid: string) => Promise<{ name: string; short_code: string }>;
  /** Return the moderator URL to redirect to, or undefined; thrown errors are silently ignored */
  fetchModeratorLink: (uuid: string) => Promise<string | undefined>;
  /** Return { url } on success; throw JoinPageError for typed error codes */
  submitJoin: (uuid: string, hostKey: string) => Promise<{ url: string }>;
}

export function useModJoinPage(config: ModJoinPageConfig) {
  const { uuid, participantPathPrefix, fetchInfo, fetchModeratorLink, submitJoin } = config;

  const [ready, setReady] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<JoinError>('');
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [canShare, setCanShare] = useState(false);

  const participantUrl = shortCode
    ? `${globalThis.location.origin}${participantPathPrefix}${shortCode}`
    : '';

  useEffect(() => {
    if (participantUrl) {
      toDataURL(participantUrl, { width: 512, margin: 2 }).then(setQrDataUrl).catch(() => {});
    }
  }, [participantUrl]);

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);

    async function init() {
      try {
        const info = await fetchInfo(uuid);
        setName(info.name);
        setShortCode(info.short_code);
      } catch {
        // ignore — page still renders without name/shortCode
      }

      const isAuth = sessionStorage.getItem('oidc_authenticated');
      if (isAuth) {
        setJoining(true);
        try {
          const modUrl = await fetchModeratorLink(uuid);
          if (modUrl) {
            globalThis.location.replace(modUrl);
            return;
          }
        } catch {
          // ignore — fall through to guest join form
        }
        setJoining(false);
      }
      setReady(true);
    }

    init();
  }, [uuid]);

  async function onSubmit(hostKey: string) {
    setJoining(true);
    setError('');
    try {
      const link = await submitJoin(uuid, hostKey);
      globalThis.location.replace(link.url);
    } catch (e) {
      setError(e instanceof JoinPageError ? e.code : 'invalid');
    } finally {
      setJoining(false);
    }
  }

  async function onCopyUrl() {
    try {
      await navigator.clipboard.writeText(participantUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1500);
    } catch {}
  }

  async function onShareUrl() {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: name, url: participantUrl });
    } catch {}
  }

  return {
    ready,
    joining,
    error,
    name,
    participantUrl,
    qrDataUrl,
    copiedUrl,
    canShare,
    onSubmit,
    onCopyUrl,
    onShareUrl,
  };
}
