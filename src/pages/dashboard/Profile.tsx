import { useState, useEffect } from 'react';
import { ShieldAlert, Verified, TrendingUp, Image as ImageIcon, Share2, Eraser } from 'lucide-react';
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
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', background: 'var(--bg-card-highest)' }} 
            />
            <div style={{ position: 'absolute', bottom: -8, right: -8, background: 'var(--accent-container)', padding: 6, borderRadius: 'var(--radius-md)', border: '1px solid rgba(113, 217, 180, 0.2)' }}>
              <Verified size={18} color="var(--accent-primary)" fill="rgba(113, 217, 180, 0.2)" />
            </div>
          </div>

          <div>
            <h2 className="text-hero" style={{ textTransform: 'uppercase', fontSize: 24, marginBottom: 8 }}>
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown Operative'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <span style={{ background: 'rgba(113, 217, 180, 0.1)', color: 'var(--accent-primary)', padding: '4px 8px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: 4 }}>
                Shield Verified
              </span>
              <span className="text-label">• Level 7 Clearance</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="text-label">Encrypted ID</span>
              <span style={{ fontSize: 14, fontFamily: 'monospace', color: 'rgba(113, 217, 180, 0.8)' }}>0xV82-KJ99-SENTINEL</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="text-label">Node Location</span>
              <span className="text-value">Zürich Data Center / Cluster B</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            <button className="btn-primary" style={{ width: '100%' }}>Secure Backup Now</button>
            <button className="btn-outline" style={{ width: '100%' }}>Manage Permissions</button>
          </div>

        </div>

        {/* Right Column: Data Clusters & Quick Stats (Bento Grid) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, alignContent: 'start' }}>
          
          {/* Main Metric */}
          <div className="glass-panel" style={{ gridColumn: 'span 3', padding: 32, position: 'relative', overflow: 'hidden' }}>
            <ShieldAlert size={160} color="var(--accent-primary)" style={{ position: 'absolute', top: -20, right: 32, opacity: 0.05 }} />
            <p className="text-label" style={{ color: 'var(--accent-primary)', marginBottom: 8, letterSpacing: '0.2em' }}>Vault Health Score</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
              <span className="font-headline" style={{ fontSize: 64, fontWeight: 800, letterSpacing: '-0.05em' }}>99.8%</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-primary)', fontSize: 14, fontWeight: 700 }}>
                <TrendingUp size={16} /> Optimal
              </span>
            </div>
            <div style={{ marginTop: 24, width: '100%', height: 4, background: 'var(--bg-card-highest)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--accent-primary)', width: '99.8%', boxShadow: '0 0 10px #71d9b4' }} />
            </div>
          </div>

          {/* Stat Trio */}
          <div className="panel-high" style={{ display: 'flex', flexDirection: 'column', padding: 24, borderRadius: 'var(--radius-md)' }}>
            <ImageIcon size={24} color="var(--accent-primary)" style={{ marginBottom: 16 }} />
            <p className="text-label" style={{ marginBottom: 4 }}>Protected Images</p>
            <p className="font-headline" style={{ fontSize: 32, fontWeight: 800 }}>{stats.protected}</p>
          </div>
          <div className="panel-high" style={{ display: 'flex', flexDirection: 'column', padding: 24, borderRadius: 'var(--radius-md)' }}>
            <Share2 size={24} color="var(--accent-primary)" style={{ marginBottom: 16 }} />
            <p className="text-label" style={{ marginBottom: 4 }}>Total Shares</p>
            <p className="font-headline" style={{ fontSize: 32, fontWeight: 800 }}>{stats.shared}</p>
          </div>
          <div className="panel-high" style={{ display: 'flex', flexDirection: 'column', padding: 24, borderRadius: 'var(--radius-md)' }}>
            <Eraser size={24} color="var(--accent-primary)" style={{ marginBottom: 16 }} />
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
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Remote redaction successful</span>
                </div>
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-muted)' }}>02:14:55 UTC</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--error)' }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Unauthorized screenshot blocked</span>
                </div>
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-muted)' }}>Yesterday 22:10:04</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Encrypted backup completed</span>
                </div>
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-muted)' }}>Yesterday 18:45:12</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
