import { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { WifiRounded as Wifi, SettingsInputComponentRounded as LinkIcon, PowerSettingsNewRounded as Power, LanguageRounded as Globe } from '@mui/icons-material';

export default function ServerConnect() {
  const { serverIp, setServerIp, stegaConnected, cryptoConnected, redactionConnected } = useAppStore();
  const [ipInput, setIpInput] = useState(serverIp);
  const [isEditing, setIsEditing] = useState(!serverIp);

  const handleSave = () => {
    setServerIp(ipInput.trim());
    setIsEditing(false);
  };

  const isAllConnected = stegaConnected && cryptoConnected && redactionConnected;
  const connectionMode = serverIp ? 'Remote Tactical Link' : 'Local Host System';

  return (
    <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, borderRadius: 0, position: 'relative', overflow: 'hidden' }}>
      {/* Background graphic */}
      <Globe sx={{ position: 'absolute', top: -20, right: -20, fontSize: 160, opacity: 0.03, color: 'var(--text-primary)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
        <div>
          <h3 className="font-headline" style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <LinkIcon sx={{ fontSize: 20, color: 'var(--accent-primary)' }} />
            Apparatus Override
          </h3>
          <p className="text-label" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Configuring connection: {connectionMode}
          </p>
        </div>
        
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', 
          background: isAllConnected ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
          border: `1px solid ${isAllConnected ? 'var(--success)' : 'var(--error)'}`,
          borderRadius: 0 
        }}>
          <Wifi sx={{ fontSize: 14, color: isAllConnected ? 'var(--success)' : 'var(--error)' }} />
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: isAllConnected ? 'var(--success)' : 'var(--error)' }}>
            {isAllConnected ? 'LINK SECURE' : 'LINK OFFLINE'}
          </span>
        </div>
      </div>

      <div style={{ zIndex: 1, background: 'var(--bg-card-highest)', padding: 16, borderLeft: '2px solid var(--accent-primary)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isEditing ? (
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
              Neural Processor IP Address
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                type="text" 
                className="input-field"
                value={ipInput} 
                onChange={(e) => setIpInput(e.target.value)} 
                placeholder="e.g. 192.168.1.100 (Leave blank for Local)" 
                style={{ flex: 1, fontFamily: 'monospace' }} 
              />
              <button className="btn-primary" onClick={handleSave} style={{ padding: '0 24px', borderRadius: 0 }}>
                BIND
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn-outline" onClick={() => { setIpInput('https://hypsss-aegis-link.hf.space'); }} style={{ flex: 1, fontSize: 10, padding: 6 }}>
                USE CLOUD
              </button>
              <button className="btn-outline" onClick={() => { setIpInput(''); }} style={{ flex: 1, fontSize: 10, padding: 6 }}>
                USE LOCAL
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
              On Android: Enter your PC's IP (likely <strong>10.130.151.166</strong>) to connect.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                Active Host Address
              </p>
              <p style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                {serverIp || '127.0.0.1 (Local)'}
              </p>
            </div>
            <button className="btn-outline" onClick={() => setIsEditing(true)} style={{ borderRadius: 0, padding: '6px 16px', fontSize: 10 }}>
              RECONFIGURE
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, zIndex: 1 }}>
        {[
          { name: 'STEGA', ok: stegaConnected, port: 8000 },
          { name: 'CRYPTO', ok: cryptoConnected, port: 5000 },
          { name: 'REDACT', ok: redactionConnected, port: 8001 },
        ].map(svc => (
           <div key={svc.name} style={{ 
             padding: 12, border: '1px solid var(--border)', background: 'var(--bg-card-highest)',
             display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
           }}>
             <Power sx={{ fontSize: 20, color: svc.ok ? 'var(--success)' : 'var(--text-muted)' }} />
             <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-primary)' }}>{svc.name}</div>
               <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'monospace' }}>:{svc.port}</div>
             </div>
           </div>
        ))}
      </div>
    </div>
  );
}
