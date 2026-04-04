import { useState } from 'react';
import { useAppStore } from '../lib/store';
import {
  Bell,
  LayoutGrid,
  Share2,
  Settings,
  Camera,
  Eraser,
  User,
} from 'lucide-react';
import logo from '../assets/logo.png';
import CapturePage from './dashboard/Capture';
import SplitPage from './dashboard/Split';
import RedactPage from './dashboard/Redact';
import ProfilePage from './dashboard/Profile';
import SettingsPage from './dashboard/Settings';
import { supabase } from '../lib/supabase';

type Tab = 'capture' | 'share' | 'redact' | 'settings' | 'profile';

const TABS: { id: Tab; icon: any; label: string }[] = [
  { id: 'share', icon: Share2, label: 'Share' },
  { id: 'settings', icon: Settings, label: 'Settings' },
  { id: 'capture', icon: Camera, label: 'Capture' },
  { id: 'redact', icon: Eraser, label: 'Redact' },
  { id: 'profile', icon: User, label: 'Profile' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('capture');
  const { stegaConnected, cryptoConnected, redactionConnected } = useAppStore();

  const handleLogout = async () => {
    localStorage.removeItem('dev_bypass');
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      
      {/* Top Header */}
      <header style={{
        height: 64, flexShrink: 0, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-card)', zIndex: 50, borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <img src={logo} alt="Aegis Logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '-0.02em', fontFamily: 'Manrope, sans-serif' }}>
            Aegis Protocol
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Status Dots cluster */}
          <div style={{ display: 'flex', gap: 12, marginRight: 16 }}>
            {[
              { label: 'STEGA', ok: stegaConnected },
              { label: 'CRYPTO', ok: cryptoConnected },
              { label: 'REDACT', ok: redactionConnected },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className={`status-dot ${s.ok ? 'online' : 'offline'}`} />
                <span className="text-label" style={{ fontSize: 9 }}>{s.label}</span>
              </div>
            ))}
          </div>

          <Bell size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => {}} />
          <LayoutGrid size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={handleLogout} />
        </div>
      </header>

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Desktop Sidebar (Adapted from Mobile Bottom Nav) */}
        <nav style={{
          width: 80, flexShrink: 0, background: 'rgba(17, 20, 19, 0.6)', backdropFilter: 'blur(10px)',
          borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '24px 0', gap: 32, zIndex: 40
        }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            // Special styling for the center 'Capture' button from mobile
            if (tab.id === 'capture') {
              return (
                <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.15s' }}>
                   <div style={{
                     width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-container)',
                     display: 'flex', alignItems: 'center', justifyContent: 'center',
                     boxShadow: '0 0 20px rgba(113, 217, 180, 0.2)', border: '1px solid rgba(113, 217, 180, 0.3)'
                   }}>
                     <Icon size={22} color="var(--accent-primary)" />
                   </div>
                   <span style={{ fontSize: 10, fontFamily: 'Inter', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 8, color: 'var(--accent-primary)' }}>
                     {tab.label}
                   </span>
                </div>
              );
            }

            return (
              <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                <Icon size={22} color={active ? 'var(--accent-primary)' : 'rgba(225, 231, 226, 0.4)'} strokeWidth={active ? 2.5 : 2} style={{ marginBottom: 4 }} />
                <span style={{ 
                  fontSize: 10, fontFamily: 'Inter', fontWeight: active ? 700 : 500, textTransform: 'uppercase', 
                  letterSpacing: '0.1em', color: active ? 'var(--accent-primary)' : 'rgba(225, 231, 226, 0.4)' 
                }}>
                  {tab.label}
                </span>
              </div>
            );
          })}
        </nav>

        {/* Content Area */}
        <main style={{ flex: 1, overflowY: 'auto', position: 'relative', background: 'var(--bg-primary)' }}>
          <div style={{ display: activeTab === 'capture' ? 'block' : 'none', height: '100%' }}>
            <CapturePage />
          </div>
          <div style={{ display: activeTab === 'share' ? 'block' : 'none', height: '100%' }}>
            {/* Share Flow placeholder - VisualCrypto */}
            <SplitPage />
          </div>
          <div style={{ display: activeTab === 'redact' ? 'block' : 'none', height: '100%' }}>
            <RedactPage />
          </div>
          <div style={{ display: activeTab === 'settings' ? 'block' : 'none', height: '100%' }}>
            <SettingsPage />
          </div>
          <div style={{ display: activeTab === 'profile' ? 'block' : 'none', height: '100%' }}>
            <ProfilePage />
          </div>
        </main>
      </div>
    </div>
  );
}
