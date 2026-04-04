import { create } from 'zustand';
import { Theme } from './theme';

interface AppState {
  theme: Theme;
  serverIp: string; // '' means localhost (desktop mode), otherwise IP for remote (mobile mode)
  stegaConnected: boolean;
  cryptoConnected: boolean;
  redactionConnected: boolean;
  mobileNavOpen: boolean;
  setTheme: (theme: Theme) => void;
  setServerIp: (ip: string) => void;
  setStegaConnected: (connected: boolean) => void;
  setCryptoConnected: (connected: boolean) => void;
  setRedactionConnected: (connected: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
}

/**
 * Hardcoded default: The Aegis Unified Cloud Hub.
 */
const DEFAULT_CLOUD_URL = 'https://hypsss-aegis-link.hf.space';

const initialIp = localStorage.getItem('aegis_server_ip') || DEFAULT_CLOUD_URL;

export const useAppStore = create<AppState>((set) => ({
  theme: (localStorage.getItem('aegis_theme') as Theme) || 'dark', // default to dark
  serverIp: initialIp,
  stegaConnected: false,
  cryptoConnected: false,
  redactionConnected: false,
  mobileNavOpen: false,
  setTheme: (theme) => {
    localStorage.setItem('aegis_theme', theme);
    set({ theme });
  },
  setServerIp: (ip) => {
    localStorage.setItem('aegis_server_ip', ip);
    set({ serverIp: ip });
  },
  setStegaConnected: (connected) => set({ stegaConnected: connected }),
  setCryptoConnected: (connected) => set({ cryptoConnected: connected }),
  setRedactionConnected: (connected) => set({ redactionConnected: connected }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}));
