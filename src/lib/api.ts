import { useAppStore } from './store';

export const STEGA_API = 'http://127.0.0.1:8000';
export const CRYPTO_API = 'http://127.0.0.1:5000';
export const REDACT_API = 'http://127.0.0.1:8001';

export function startBackendPolling() {
  const checkStatus = async () => {
    try {
      // StegaStamp has a root static file mount, a GET / should return 200
      const stegaRes = await fetch(`${STEGA_API}/`, { method: 'GET' }).catch(() => null);
      useAppStore.getState().setStegaConnected(stegaRes?.ok || false);
    } catch {
      useAppStore.getState().setStegaConnected(false);
    }

    try {
      // VisualCrypto has a GET / API for algorithm list
      const cryptoRes = await fetch(`${CRYPTO_API}/api/algorithm_list`, { method: 'GET' }).catch(() => null);
      useAppStore.getState().setCryptoConnected(cryptoRes?.ok || false);
    } catch {
      useAppStore.getState().setCryptoConnected(false);
    }

    try {
      // RedactionPro has a GET / API root
      const redactRes = await fetch(`${REDACT_API}/`, { method: 'GET' }).catch(() => null);
      useAppStore.getState().setRedactionConnected(redactRes?.ok || false);
    } catch {
      useAppStore.getState().setRedactionConnected(false);
    }
  };

  // Check immediately, then every 3 seconds
  checkStatus();
  setInterval(checkStatus, 3000);
}

export async function encodeStega(file: File, secret: string, alpha: number = 1.0) {
  const fd = new FormData();
  fd.append('image', file);
  fd.append('secret_text', secret);
  fd.append('alpha', alpha.toString());
  
  const res = await fetch(`${STEGA_API}/api/encode`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return await res.json();
}
