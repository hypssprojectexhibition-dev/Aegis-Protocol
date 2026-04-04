import { useAppStore } from './store';
import { fetch } from '@tauri-apps/plugin-http';

/**
 * Build dynamic API base URLs for the Unified Hub.
 */
function getUnifiedHost(): string {
  let ip = useAppStore.getState().serverIp || '127.0.0.1';
  // Strip trailing slashes and prefix with https if missing
  ip = ip.replace(/\/+$/, '');
  if (!ip.startsWith('http') && !ip.startsWith('127.0.0')) {
    ip = `https://${ip}`;
  }
  return ip;
}

export function getStegaApi(): string {
  const host = getUnifiedHost();
  return host.includes('.hf.space') ? `${host}/stega` : `http://${host}:8000`;
}
export function getCryptoApi(): string {
  const host = getUnifiedHost();
  return host.includes('.hf.space') ? `${host}/crypto` : `http://${host}:5000`;
}
export function getRedactApi(): string {
  const host = getUnifiedHost();
  return host.includes('.hf.space') ? `${host}/redact` : `http://${host}:8001`;
}

// Legacy exports for components (backwards compatibility)
export const STEGA_API = 'http://127.0.0.1:8000';
export const CRYPTO_API = 'http://127.0.0.1:5000';
export const REDACT_API = 'http://127.0.0.1:8001';

export function startBackendPolling() {
  const checkStatus = async () => {
    const store = useAppStore.getState();
    const host = getUnifiedHost();

    let stegaOk = false;
    let cryptoOk = false;
    let redactOk = false;

    // ── Fast path: try the unified /health endpoint (single round-trip) ──────
    try {
      const res = await fetch(`${host}/health`, { method: 'GET' }).catch(() => null);
      if (res?.ok) {
        const data = await res.json().catch(() => null);
        if (data) {
          stegaOk  = data.stega  === 'ok';
          redactOk = data.redact === 'ok';
          cryptoOk = data.crypto === 'ok';
          store.setStegaConnected(stegaOk);
          store.setCryptoConnected(cryptoOk);
          store.setRedactionConnected(redactOk);
          return; // done – no need for individual checks
        }
      }
    } catch (e) {}

    // ── Fallback: individual per-service health checks ────────────────────────
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
  setInterval(checkStatus, 5000); // 5 s is gentler on the HF free-tier
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
