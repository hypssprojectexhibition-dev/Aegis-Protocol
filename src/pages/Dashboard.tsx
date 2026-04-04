import { useState } from 'react';
import { useAppStore } from '../lib/store';
import { useThemeSystem } from '../lib/theme';
import {
  Stamp,
  Scissors,
  Combine,
  EyeOff,
  History as HistoryIcon,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
} from 'lucide-react';
import WatermarkPage from './dashboard/Watermark';
import SplitPage from './dashboard/Split';
import CombinePage from './dashboard/CombinePage';
import RedactPage from './dashboard/Redact';
import HistoryPage from './dashboard/History';
import logo from '../assets/logo.png';
import { supabase } from '../lib/supabase';

type Tab = 'watermark' | 'split' | 'combine' | 'redact' | 'history';

const TABS: { id: Tab; icon: any; label: string; header: string }[] = [
  { id: 'watermark', icon: Stamp, label: 'Watermark', header: 'StegaStamp — Invisible Watermarking' },
  { id: 'split', icon: Scissors, label: 'Split', header: 'Visual Crypto — Split Image into Shares' },
  { id: 'combine', icon: Combine, label: 'Combine', header: 'Visual Crypto — Reconstruct from Shares' },
  { id: 'redact', icon: EyeOff, label: 'Redact', header: 'RedactionPro — PII Removal' },
  { id: 'history', icon: HistoryIcon, label: 'History', header: 'Audit Trail' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('watermark');
  const { stegaConnected, cryptoConnected, redactionConnected } = useAppStore();
  const { theme, setTheme } = useThemeSystem();

  const handleLogout = async () => {
    localStorage.removeItem('dev_bypass');
    await supabase.auth.signOut();
    window.location.reload();
  };

  const activeConfig = TABS.find(t => t.id === activeTab)!;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 72, background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', flexShrink: 0,
      }}>
        <img src={logo} alt="" style={{ width: 36, height: 36, objectFit: 'contain', marginBottom: 32 }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} title={tab.label}
                style={{
                  width: 48, height: 48, borderRadius: 12, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: active ? 'var(--accent-blue)' : 'transparent',
                  color: active ? 'white' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme"
            style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={handleLogout} title="Logout"
            style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: 'var(--error-bg)', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          height: 52, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
          padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Module
            </span>
            <ChevronRight size={12} style={{ color: 'var(--border)' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              {activeConfig.header}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'STEGA', ok: stegaConnected },
              { label: 'CRYPTO', ok: cryptoConnected },
              { label: 'REDACT', ok: redactionConnected },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div className={`status-dot ${s.ok ? 'online' : 'offline'}`} />
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          <div style={{ display: activeTab === 'watermark' ? 'block' : 'none', height: '100%' }}><WatermarkPage /></div>
          <div style={{ display: activeTab === 'split' ? 'block' : 'none', height: '100%' }}><SplitPage /></div>
          <div style={{ display: activeTab === 'combine' ? 'block' : 'none', height: '100%' }}><CombinePage /></div>
          <div style={{ display: activeTab === 'redact' ? 'block' : 'none', height: '100%' }}><RedactPage /></div>
          <div style={{ display: activeTab === 'history' ? 'block' : 'none', height: '100%' }}><HistoryPage /></div>
        </div>
      </main>
    </div>
  );
}
