import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { useThemeSystem } from '../lib/theme';
import { 
  Shield, 
  Search, 
  ClipboardList, 
  LogOut, 
  Sun, 
  Moon, 
  EyeOff 
} from 'lucide-react';
import ProcessPage from './dashboard/Process';
import VerifyPage from './dashboard/Verify';
import HistoryPage from './dashboard/History';
import RedactPage from './dashboard/Redact';
import logo from '../assets/logo.png';

type Tab = 'process' | 'verify' | 'redact' | 'history';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('process');
  const { stegaConnected, cryptoConnected, redactionConnected } = useAppStore();
  const { theme, setTheme } = useThemeSystem();

  const handleLogout = async () => {
    localStorage.removeItem('dev_bypass');
    await supabase.auth.signOut();
    window.location.reload();
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'process', label: 'Protect', icon: <Shield size={18} /> },
    { id: 'verify', label: 'Verify', icon: <Search size={18} /> },
    { id: 'redact', label: 'Redact', icon: <EyeOff size={18} /> },
    { id: 'history', label: 'History', icon: <ClipboardList size={18} /> },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Sidebar - Made draggable on the top area for Tauri */}
      <div 
        style={{ 
          width: 240, 
          borderRight: '1px solid var(--border)', 
          display: 'flex', 
          flexDirection: 'column', 
          background: 'var(--bg-secondary)',
          zIndex: 10
        }}
      >
        {/* Brand */}
        <div 
          data-tauri-drag-region 
          style={{ 
            padding: '24px 20px', 
            borderBottom: '1px solid var(--border)', 
            cursor: 'default' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'none' }}>
            <img src={logo} alt="Aegis" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Aegis</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent-blue)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Protocol</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '20px 12px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', marginBottom: 6, borderRadius: 8, border: 'none',
                background: activeTab === tab.id ? 'var(--bg-hover)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                fontSize: 14, fontWeight: activeTab === tab.id ? 600 : 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Status + Tools */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <span className={`status-dot ${stegaConnected ? 'online' : 'offline'}`} />
              StegaStamp Engine
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <span className={`status-dot ${cryptoConnected ? 'online' : 'offline'}`} />
              VisualCrypto Engine
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <span className={`status-dot ${redactionConnected ? 'online' : 'offline'}`} />
              RedactionPro Engine
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="btn-outline"
              style={{ flex: 1, padding: '8px', fontSize: 12 }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button 
              onClick={handleLogout}
              className="btn-outline"
              style={{ flex: 1, padding: '8px', fontSize: 12 }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '100%', overflow: 'auto', padding: '40px 48px' }} className="fade-in">
          {activeTab === 'process' && <ProcessPage />}
          {activeTab === 'verify' && <VerifyPage />}
          {activeTab === 'redact' && <RedactPage />}
          {activeTab === 'history' && <HistoryPage />}
        </div>
      </div>
    </div>
  );
}
