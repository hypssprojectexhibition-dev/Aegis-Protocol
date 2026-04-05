import { useAppStore } from './store';
import { fetch } from '@tauri-apps/plugin-http';

/**
 * Returns true when the configured server is the HF cloud hub.
 */
function isCloudMode(): boolean {
  const ip = useAppStore.getState().serverIp || '';
  return ip.includes('.hf.space');
}

function getHostIp(): string {
   const ip = useAppStore.getState().serverIp;
   if (!ip || ip.trim() === '') return 'https://hypsss-aegis-link.hf.space';
   let host = ip.replace(/\/+$/, '');
   if (!host.startsWith('http')) host = `https://${host.replace(/^http:\/\//, '')}`;
   return host;
}

export function getStegaApi(): string {
  const host = getHostIp();
  return isCloudMode() ? `${host}/stega` : (host.includes('hf.space') ? `${host}/stega` : `${host}:8000`);
}
export function getCryptoApi(): string {
  const host = getHostIp();
  return isCloudMode() ? `${host}/crypto` : (host.includes('hf.space') ? `${host}/crypto` : `${host}:5000`);
}
export function getRedactApi(): string {
  const host = getHostIp();
  return isCloudMode() ? `${host}/redact` : (host.includes('hf.space') ? `${host}/redact` : `${host}:8001`);
}

// Legacy exports for components (backwards compatibility)
export const STEGA_API = 'https://hypsss-aegis-link.hf.space/stega';
export const CRYPTO_API = 'https://hypsss-aegis-link.hf.space/crypto';
export const REDACT_API = 'https://hypsss-aegis-link.hf.space/redact';

export function startBackendPolling() {
  const checkStatus = async () => {
    const store = useAppStore.getState();

    let stegaOk = false;
    let cryptoOk = false;
    let redactOk = false;

    // ── Cloud fast-path: single /health call returns all engine statuses ──────
    if (isCloudMode() || getHostIp().includes('hf.space')) {
      try {
        const cloud = getHostIp();
        const res = await fetch(`${cloud}/health`, { method: 'GET' }).catch(() => null);
        if (res?.ok) {
          const data = await res.json().catch(() => null);
          if (data) {
            stegaOk  = data.stega  === 'ok';
            redactOk = data.redact === 'ok';
            cryptoOk = data.crypto === 'ok';
            store.setStegaConnected(stegaOk);
            store.setCryptoConnected(cryptoOk);
            store.setRedactionConnected(redactOk);
            return;
          }
        }
      } catch (e) {}
    }

    // ── Local (or cloud fallback): individual per-service health checks ────────
    try {
      const res = await fetch(`${getStegaApi()}/health`, { method: 'GET' }).catch(() => null);
      if (res?.ok) stegaOk = true;
    } catch (e) {}

    try {
      const res = await fetch(`${getCryptoApi()}/health`, { method: 'GET' }).catch(() => null);
      if (res?.ok) cryptoOk = true;
    } catch (e) {}

    try {
      const res = await fetch(`${getRedactApi()}/health`, { method: 'GET' }).catch(() => null);
      if (res?.ok) redactOk = true;
    } catch (e) {}

    store.setStegaConnected(stegaOk);
    store.setCryptoConnected(cryptoOk);
    store.setRedactionConnected(redactOk);
  };

  checkStatus();
  setInterval(checkStatus, 5000);
}

export async function encodeStega(file: File, secret: string, alpha: number = 1.0) {
  const fd = new FormData();
  fd.append('image', file);
  fd.append('secret_text', secret);
  fd.append('alpha', alpha.toString());
  
  const res = await fetch(`${getStegaApi()}/api/encode`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return await res.json();
}
