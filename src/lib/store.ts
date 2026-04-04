import { create } from 'zustand';
import { Theme } from './theme';

interface AppState {
  theme: Theme;
  stegaConnected: boolean;
  cryptoConnected: boolean;
  redactionConnected: boolean;
  setTheme: (theme: Theme) => void;
  setStegaConnected: (connected: boolean) => void;
  setCryptoConnected: (connected: boolean) => void;
  setRedactionConnected: (connected: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: (localStorage.getItem('aegis_theme') as Theme) || 'dark', // default to dark
  stegaConnected: false,
  cryptoConnected: false,
  redactionConnected: false,
  setTheme: (theme) => {
    localStorage.setItem('aegis_theme', theme);
    set({ theme });
  },
  setStegaConnected: (connected) => set({ stegaConnected: connected }),
  setCryptoConnected: (connected) => set({ cryptoConnected: connected }),
  setRedactionConnected: (connected) => set({ redactionConnected: connected }),
}));
