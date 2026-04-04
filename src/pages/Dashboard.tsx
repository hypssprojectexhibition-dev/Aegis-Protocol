import { useState } from 'react';
import { useAppStore } from '../lib/store';
import { useThemeSystem } from '../lib/theme';
import { 
  Shield, 
  Search, 
  History as HistoryIcon, 
  LogOut, 
  Sun, 
  Moon, 
  EyeOff,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import ProcessPage from './dashboard/Process';
import VerifyPage from './dashboard/Verify';
import HistoryPage from './dashboard/History';
import RedactPage from './dashboard/Redact';
import logo from '../assets/logo.png';
import { supabase } from '../lib/supabase';

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

  const NavItem = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        title={label}
        style={{
          width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', marginBottom: 12, border: 'none', cursor: 'pointer',
          background: isActive ? 'var(--accent-blue)' : 'transparent',
          color: isActive ? 'white' : 'var(--text-secondary)',
          boxShadow: isActive ? '0 8px 16px -4px rgba(59, 130, 246, 0.4)' : 'none'
        }}
        onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}
      >
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
      </button>
    );
  };

  const getPage = () => {
    switch (activeTab) {
      case 'process': return <ProcessPage />;
      case 'verify': return <VerifyPage />;
      case 'redact': return <RedactPage />;
      case 'history': return <HistoryPage />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Slim Sidebar */}
      <aside style={{
        width: 84, background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', zIndex: 10
      }}>
        <div style={{ marginBottom: 48, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>
          <img src={logo} alt="" style={{ width: 42, height: 42, objectFit: 'contain' }} />
        </div>

        <div style={{ flex: 1 }}>
          <NavItem id="process" icon={Shield} label="Aegis Protect" />
          <NavItem id="verify" icon={Search} label="Aegis Verify" />
          <NavItem id="redact" icon={EyeOff} label="Aegis Redact" />
          <NavItem id="history" icon={HistoryIcon} label="Audit Logs" />
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Theme"
            style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button onClick={handleLogout}
            title="Logout"
            style={{ width: 44, height: 44, borderRadius: 12, border: 'none', background: 'var(--error-bg)', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        {/* Top Header Bar */}
        <header style={{ 
          height: 64, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', 
          padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current Workspace
            </span>
            <ChevronRight size={14} style={{ color: 'var(--border)' }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              {activeTab === 'process' && 'Aegis Protect Engine'}
              {activeTab === 'verify' && 'Integrity Verification Subsystem'}
              {activeTab === 'redact' && 'RedactionPro Deployment'}
              {activeTab === 'history' && 'Immutable Audit Logs'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className={`status-dot ${stegaConnected ? 'online' : 'offline'}`} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>STEGA</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className={`status-dot ${cryptoConnected ? 'online' : 'offline'}`} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>CRYPTO</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className={`status-dot ${redactionConnected ? 'online' : 'offline'}`} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>REDACT</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px', maxWidth: '1800px', margin: '0 auto', width: '100%' }}>
          {getPage()}
        </div>
        
        {/* Footer Guidance */}
        <footer style={{ padding: '12px 32px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12 }}>
            <HelpCircle size={14} />
            Need help? Contextual guidance is available in every module.
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Aegis Protocol Alpha v1.4.0
          </div>
        </footer>
      </main>
    </div>
  );
}
