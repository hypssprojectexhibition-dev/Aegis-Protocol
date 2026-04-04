import { useState, useEffect } from 'react';
import { 
  CheckCircleRounded as Verified, 
  TrendingUpRounded as TrendingUp, 
  ImageRounded as ImageIcon, 
  ShareRounded as Share2, 
  AutoFixHighRounded as Eraser, 
  StorageRounded as Database 
} from '@mui/icons-material';
import { supabase } from '../../lib/supabase';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ protected: 0, shared: 0, redacted: 0 });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user);
    });

    // Fetch counts from operations
    const fetchStats = async () => {
      const { count: protectedCount } = await supabase.from('operations').select('*', { count: 'exact', head: true }).eq('operation_type', 'watermark');
      const { count: shareCount } = await supabase.from('operations').select('*', { count: 'exact', head: true }).eq('operation_type', 'encryption');
      const { count: redactCount } = await supabase.from('operations').select('*', { count: 'exact', head: true }).eq('operation_type', 'redact');
      
      setStats({
        protected: protectedCount || 0,
        shared: (shareCount || 0) * 2, // VC creates 2 shares per encryption
        redacted: redactCount || 0
      });
    };
    fetchStats();
  }, []);
  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 1200, margin: '0 auto' }}>
      
      {/* 2-Column Split matching the mobile asymmetric design */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32 }}>

        {/* Left Column: Identity Card */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div style={{ position: 'relative', width: 140, height: 140 }}>
            <img 
              src={user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=Aegis"} 
              alt="Profile" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-heavy)', background: 'var(--bg-card-highest)' }} 
            />
            <div style={{ position: 'absolute', bottom: -8, right: -8, background: 'var(--accent-container)', padding: 6, borderRadius: 0, border: '1px solid var(--border)' }}>
              <Verified sx={{ fontSize: 18, color: 'var(--accent-primary)' }} />
            </div>
          </div>

          <div>
            <h2 className="text-hero" style={{ textTransform: 'uppercase', fontSize: 24, marginBottom: 8 }}>
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown Operative'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <span className="text-label" style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                {user?.aud === 'authenticated' ? 'Authorized Access' : 'Guest'}
              </span>
              <span className="text-label">• Internal Operative</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="text-label">UID Reference</span>
              <span style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                {user?.id?.substring(0, 18).toUpperCase() || 'OFFLINE'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="text-label">Terminal Node</span>
              <span className="text-value" style={{ fontSize: 13 }}>Local Desktop Instance</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            <button className="btn-primary" style={{ width: '100%' }}>Export Audit Log</button>
            <button className="btn-outline" style={{ width: '100%' }}>Update Profile</button>
          </div>

        </div>

        {/* Right Column: Data Clusters & Quick Stats (Bento Grid) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, alignContent: 'start' }}>
          
          {/* Main Metric */}
          <div className="glass-panel" style={{ gridColumn: 'span 3', padding: 32, position: 'relative', overflow: 'hidden' }}>
            <Database sx={{ fontSize: 160, color: 'var(--accent-primary)', position: 'absolute', top: -20, right: 32, opacity: 0.05 }} />
            <p className="text-label" style={{ color: 'var(--accent-primary)', marginBottom: 8, letterSpacing: '0.2em' }}>System Integrity</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
              <span className="font-headline" style={{ fontSize: 64, fontWeight: 800, letterSpacing: '-0.05em' }}>100%</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-primary)', fontSize: 14, fontWeight: 700 }}>
                <TrendingUp sx={{ fontSize: 16 }} /> Online
              </span>
            </div>
            <div style={{ marginTop: 24, width: '100%', height: 4, background: 'var(--bg-card-highest)', borderRadius: 0, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--accent-primary)', width: '99.8%' }} />
            </div>
          </div>

          {/* Stat Trio */}
          <div className="panel-high" style={{ display: 'flex', flexDirection: 'column', padding: 24, borderRadius: 0 }}>
            <ImageIcon sx={{ fontSize: 24, color: 'var(--accent-primary)', marginBottom: 2 }} />
            <p className="text-label" style={{ marginBottom: 4 }}>Protected Images</p>
            <p className="font-headline" style={{ fontSize: 32, fontWeight: 800 }}>{stats.protected}</p>
          </div>
          <div className="panel-high" style={{ display: 'flex', flexDirection: 'column', padding: 24, borderRadius: 0 }}>
            <Share2 sx={{ fontSize: 24, color: 'var(--accent-primary)', marginBottom: 2 }} />
            <p className="text-label" style={{ marginBottom: 4 }}>Total Shares</p>
            <p className="font-headline" style={{ fontSize: 32, fontWeight: 800 }}>{stats.shared}</p>
          </div>
          <div className="panel-high" style={{ display: 'flex', flexDirection: 'column', padding: 24, borderRadius: 0 }}>
            <Eraser sx={{ fontSize: 24, color: 'var(--accent-primary)', marginBottom: 2 }} />
            <p className="text-label" style={{ marginBottom: 4 }}>Redactions Applied</p>
            <p className="font-headline" style={{ fontSize: 32, fontWeight: 800 }}>{stats.redacted}</p>
          </div>

          {/* Security Log */}
          <div className="glass-panel" style={{ gridColumn: 'span 3', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 className="text-label" style={{ color: 'var(--text-primary)' }}>Recent Security Triggers</h3>
              <span style={{ fontSize: 10, color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline' }}>View Ledger</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>System authenticated successfully</span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>JUST NOW</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Local compute engines initialized</span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>INITIALIZATION</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Database connection established</span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>CONNECTED</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
