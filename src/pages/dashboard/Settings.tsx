import { useState, useEffect } from 'react';
import { 
  SettingsRounded as Settings, 
  AccountCircleRounded as User, 
  NotificationsRounded as Bell, 
  PaletteRounded as Palette, 
  StorageRounded as Database, 
  VpnKeyRounded as KeyRound, 
  LogoutRounded as LogOut 
} from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';

export default function SettingsPage() {
  const { theme, setTheme } = useAppStore();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 1200, margin: '0 auto' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32 }}>
        
        {/* Left Column: Branding Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div className="panel" style={{ padding: 40, position: 'relative', borderRadius: 0 }}>
            <Settings sx={{ fontSize: 120, color: 'var(--text-primary)', position: 'absolute', top: -10, right: -10, opacity: 0.05 }} />
            <h2 className="font-headline" style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1.1, marginBottom: 8 }}>
              Terminal<br/><span style={{ color: 'var(--accent-primary)' }}>Config</span>
            </h2>
            <p className="text-label" style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: 12, color: 'var(--text-muted)', marginBottom: 32, maxWidth: 220 }}>
              Administrative interface for local node and security parameters.
            </p>

            <div className="panel-highest" style={{ display: 'flex', alignItems: 'center', gap: 16, borderRadius: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: 0, background: 'var(--accent-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User sx={{ fontSize: 24, color: 'var(--accent-primary)' }} />
              </div>
              <div>
                <p className="font-headline" style={{ fontSize: 14, fontWeight: 700 }}>
                  {user?.user_metadata?.full_name || 'Operative'}
                </p>
                <p className="text-label" style={{ color: 'var(--accent-primary)' }}>
                  {user?.aud === 'authenticated' ? 'Authorized Access' : 'Guest Mode'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Tonal Shift */}
          <div className="panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <p className="text-label" style={{ marginBottom: 4 }}>Node Status</p>
              <p className="font-headline" style={{ fontSize: 24, fontWeight: 800 }}>ACTIVE</p>
            </div>
            <div>
              <p className="text-label" style={{ marginBottom: 4 }}>Encryption</p>
              <p className="font-headline" style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-primary)' }}>AES-GCM</p>
            </div>
          </div>

        </div>

        {/* Right Column: Settings Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignContent: 'start' }}>
          
          <div className="panel hover-target" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 160, cursor: 'pointer', borderRadius: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Bell sx={{ fontSize: 24, color: 'var(--accent-primary)' }} />
              <div style={{ background: 'var(--accent-container)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: 0, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
                Active
              </div>
            </div>
            <div>
              <h3 className="font-headline" style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Notifications</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Manage push alerts and system critical warnings.</p>
            </div>
          </div>

          <div className="panel hover-target" onClick={toggleTheme} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 160, cursor: 'pointer', borderRadius: 0 }}>
            <Palette sx={{ fontSize: 24, color: 'var(--accent-primary)' }} />
            <div>
              <h3 className="font-headline" style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Theme</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Using {theme === 'dark' ? 'Aegis Dark' : 'Aegis Light'} interface.</p>
            </div>
          </div>

          <div className="panel hover-target" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 24, cursor: 'default', borderRadius: 0 }}>
            <div style={{ width: 48, height: 48, borderRadius: 0, background: 'var(--bg-card-high)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database sx={{ fontSize: 24, color: 'var(--accent-primary)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 className="font-headline" style={{ fontSize: 18, fontWeight: 800 }}>Vault Allocation</h3>
              <div style={{ marginTop: 8, width: '100%', height: 4, background: 'var(--bg-card-highest)', borderRadius: 0, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--accent-primary)', width: '38%' }} />
              </div>
              <p className="text-label" style={{ marginTop: 8 }}>38.2 GB / 500 GB Committed</p>
            </div>
          </div>

          <div className="glass-panel hover-target" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, cursor: 'pointer', borderRadius: 0 }}>
            <KeyRound sx={{ fontSize: 24, color: 'var(--accent-primary)' }} />
            <div>
              <h3 className="font-headline" style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Security PIN</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Change your 6-digit administrative PIN.</p>
            </div>
          </div>

          <div className="glass-panel hover-target" onClick={handleLogout} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, cursor: 'pointer', border: '1px solid #ef4444', borderRadius: 0 }}>
            <LogOut sx={{ fontSize: 24, color: '#ef4444' }} />
            <div>
              <h3 className="font-headline" style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: '#ef4444' }}>Sign Out</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Terminate session and lock the vault.</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
