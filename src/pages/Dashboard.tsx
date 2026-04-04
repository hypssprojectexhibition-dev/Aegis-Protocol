import { useState } from 'react';
import { useAppStore } from '../lib/store';
import {
  NotificationsRounded as Bell,
  DashboardRounded as LayoutGrid,
  ShareRounded,
  SettingsRounded as Settings,
  PhotoCameraRounded as Camera,
  AutoFixHighRounded as Eraser,
  AccountCircleRounded as User,
  MergeRounded as Combine,
  FingerprintRounded as Fingerprint,
} from '@mui/icons-material';
import logo from '../assets/logo.png';
import CapturePage from './dashboard/Capture';
import SplitPage from './dashboard/Split';
import CombinePage from './dashboard/CombinePage';
import RedactPage from './dashboard/Redact';
import ProfilePage from './dashboard/Profile';
import SettingsPage from './dashboard/Settings';
import WatermarkPage from './dashboard/Watermark';
import { supabase } from '../lib/supabase';
import WindowControls from '../components/WindowControls';

type Tab = 'capture' | 'share' | 'combine' | 'watermark' | 'redact' | 'settings' | 'profile';

const TABS: { id: Tab; icon: any; label: string }[] = [
  { id: 'share',     icon: ShareRounded, label: 'Split' },
  { id: 'combine',   icon: Combine,      label: 'Combine' },
  { id: 'capture',   icon: Camera,       label: 'Capture' },
  { id: 'watermark', icon: Fingerprint,  label: 'Stega' },
  { id: 'redact',    icon: Eraser,       label: 'Redact' },
  { id: 'settings',  icon: Settings,     label: 'Settings' },
  { id: 'profile',   icon: User,         label: 'Profile' },
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
      <header 
        style={{
          height: 64, flexShrink: 0, padding: '0 0 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-card)', zIndex: 100, borderBottom: '1px solid var(--border)',
          userSelect: 'none'
        }}
      >
        <div 
          data-tauri-drag-region 
          style={{ 
            position: 'absolute', top: 0, left: 0, right: 0, height: 64, 
            zIndex: 0, pointerEvents: 'none' 
          }} 
        />
        <div data-tauri-drag-region style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'default', zIndex: 10, position: 'relative' }}>
          <img src={logo} alt="Aegis Logo" style={{ width: 28, height: 28, objectFit: 'contain', pointerEvents: 'none' }} />
          <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '-0.02em', pointerEvents: 'none' }}>
            Aegis Protocol
          </h1>
        </div>
        
        <div data-tauri-drag-region style={{ flex: 1, height: '100%', position: 'relative', zIndex: 5 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 10, pointerEvents: 'auto' }}>
          {/* Status Dots cluster */}
          <div style={{ display: 'flex', gap: 12, marginRight: 16 }}>
            {[
              { label: 'STEGA', ok: stegaConnected },
              { label: 'CRYPTO', ok: cryptoConnected },
              { label: 'REDACT', ok: redactionConnected },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className={`status-dot ${s.ok ? 'online' : 'offline'}`} />
                <span className="text-label" style={{ fontSize: 9, color: 'var(--text-primary)', opacity: 0.8, fontWeight: 700 }}>{s.label}</span>
              </div>
            ))}
          </div>

          <Bell sx={{ fontSize: 20, color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => {}} />
          <LayoutGrid sx={{ fontSize: 20, color: 'var(--text-muted)', cursor: 'pointer' }} onClick={handleLogout} />
          
          <div style={{ 
            display: 'flex', alignItems: 'center', height: '100%', 
            position: 'relative', zIndex: 1000, pointerEvents: 'auto',
            marginLeft: 'auto'
          }}>
            <WindowControls />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Sidebar Nav */}
        <nav style={{
          width: 80, flexShrink: 0, background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '16px 0', gap: 24, zIndex: 999, position: 'relative', pointerEvents: 'auto',
          overflowY: 'auto',
        }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            
            const handleTabClick = () => {
              console.log(`Navigation: Switching to ${tab.id}`);
              setActiveTab(tab.id);
            };

            // Special styling for the center 'Capture' button from mobile
            if (tab.id === 'capture') {
              return (
                <div key={tab.id} onClick={handleTabClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.15s', pointerEvents: 'auto' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-container)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: '1px solid var(--border)'
                    }}>
                      <Icon sx={{ fontSize: 24, color: 'var(--accent-primary)' }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 8, color: 'var(--accent-primary)' }}>
                      {tab.label}
                    </span>
                 </div>
               );
             }

             // Special gold accent for combine tab
             if (tab.id === 'combine') {
               return (
                 <div key={tab.id} onClick={handleTabClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: active ? 1 : 0.5, pointerEvents: 'auto', transition: 'opacity 0.15s' }}>
                   <Icon sx={{ fontSize: 24, color: active ? 'var(--accent-gold)' : 'var(--text-muted)' }} />
                   <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: active ? 'var(--accent-gold)' : 'var(--text-muted)', marginTop: 4 }}>
                     {tab.label}
                   </span>
                 </div>
               );
             }

             // Special blue accent for watermark (stega) tab
             if (tab.id === 'watermark') {
               return (
                 <div key={tab.id} onClick={handleTabClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: active ? 1 : 0.5, pointerEvents: 'auto', transition: 'opacity 0.15s' }}>
                   <Icon sx={{ fontSize: 24, color: active ? 'var(--accent-blue)' : 'var(--text-muted)' }} />
                   <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: active ? 'var(--accent-blue)' : 'var(--text-muted)', marginTop: 4 }}>
                     {tab.label}
                   </span>
                 </div>
               );
             }
 
             return (
               <div key={tab.id} onClick={handleTabClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: active ? 1 : 0.4, pointerEvents: 'auto' }}>
                 <Icon sx={{ fontSize: 24, color: active ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                 <span style={{ 
                   fontSize: 10, fontWeight: active ? 700 : 500, textTransform: 'uppercase', 
                   letterSpacing: '0.1em', color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                   marginTop: 4,
                 }}>
                   {tab.label}
                 </span>
               </div>
            );
          })}
        </nav>

        {/* Content Area */}
        <main style={{ flex: 1, overflowY: 'auto', position: 'relative', background: 'var(--bg-primary)', zIndex: 10, pointerEvents: 'auto' }}>
          <div style={{ display: activeTab === 'capture' ? 'block' : 'none', height: '100%' }}>
            <CapturePage />
          </div>
          <div style={{ display: activeTab === 'share' ? 'block' : 'none', height: '100%' }}>
            <SplitPage />
          </div>
          <div style={{ display: activeTab === 'combine' ? 'block' : 'none', height: '100%' }}>
            <CombinePage />
          </div>
          <div style={{ display: activeTab === 'watermark' ? 'block' : 'none', padding: 32 }}>
            <WatermarkPage />
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
