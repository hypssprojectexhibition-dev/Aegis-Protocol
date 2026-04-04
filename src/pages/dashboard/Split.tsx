import { useState } from 'react';
import { CRYPTO_API } from '../../lib/api';
import { Database, HardDrive, Network, ShieldCheck, Download, AlertCircle } from 'lucide-react';

export default function SplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [shares, setShares] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); setShares([]); setError(''); }
  };

  const split = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('image1', file);
      fd.append('operation', 'encryption');
      fd.append('algorithm', 'vc_grayscale_halftone');
      const res = await fetch(`${CRYPTO_API}/process`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      if (data.status !== 'success') throw new Error(data.message || 'Splitting failed');
      setShares(data.shares);
    } catch (e: any) {
      setError(e.message || 'Splitting failed');
    } finally { setLoading(false); }
  };

  const dl = (src: string, name: string) => { const a = document.createElement('a'); a.href = src; a.download = name; a.click(); };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      
      {/* Left Column: Media Preview */}
      <section style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, borderRight: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="text-label" style={{ color: 'var(--accent-primary)' }}>Visual Crypto Studio</span>
          <h2 className="text-hero" style={{ fontSize: 32, letterSpacing: '-0.05em' }}>Split into Shares</h2>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--error-bg)', border: '1px solid var(--error)', fontSize: 13, color: 'var(--error)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Bento Image Box */}
        <label style={{ 
          flex: 1, position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          background: 'var(--bg-card-highest)', border: '1px solid var(--border)', display: 'block', cursor: 'pointer' 
        }}>
          {!preview && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
               <Database size={64} style={{ marginBottom: 16 }} />
               <p className="font-headline" style={{ fontSize: 18, fontWeight: 800 }}>Select Source to Split</p>
            </div>
          )}
          {preview && (
            <>
              <img src={preview} alt="Source" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'grayscale(0.8) brightness(0.7)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, transparent 40%)' }} />
              <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <p className="text-label" style={{ color: 'rgba(113, 217, 180, 0.8)', fontFamily: 'monospace' }}>HASH: 0X8F2...E4A</p>
                  <p className="font-headline" style={{ fontSize: 24, fontWeight: 800 }}>{file?.name}</p>
                </div>
                <div style={{ background: 'rgba(113, 217, 180, 0.1)', backdropFilter: 'blur(10px)', padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(113, 217, 180, 0.2)' }}>
                  <span className="text-label" style={{ color: 'var(--accent-primary)' }}>Verified</span>
                </div>
              </div>
            </>
          )}
          <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        </label>

      </section>

      {/* Right Column: Process & Controls */}
      <section style={{ width: 450, padding: 32, display: 'flex', flexDirection: 'column', gap: 32, flexShrink: 0, background: 'var(--bg-primary)' }}>
        
        {/* Fragmenting Progress Section */}
        <div className="panel" style={{ padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ShieldCheck size={20} color="var(--accent-primary)" />
              <span className="font-headline text-label" style={{ fontWeight: 800 }}>Splitting Nodes</span>
            </div>
            <span className="font-headline" style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-primary)' }}>{loading ? '84%' : (shares.length ? '100%' : '0%')}</span>
          </div>
          
          <div style={{ width: '100%', height: 6, background: 'var(--bg-card-highest)', borderRadius: 3, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--accent-primary)', width: loading ? '84%' : (shares.length ? '100%' : '0%'), boxShadow: '0 0 12px rgba(113,217,180,0.5)', transition: 'width 1s' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            <span>{loading ? 'Fragmenting...' : (shares.length ? 'Fragmented' : 'Awaiting Input')}</span>
            <span>{shares.length ? '2/2 SHARDS' : '0/2 SHARDS'}</span>
          </div>
        </div>

        {/* Distributed Mesh Destinations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span className="text-label">Secure Targets</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
             <div className="hover-target" style={{ aspectRatio: '1/1', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}>
               <HardDrive size={24} color="var(--text-muted)" />
               <p className="text-label" style={{ fontSize: 11 }}>On-Prem Vault</p>
             </div>
             <div className="hover-target" style={{ aspectRatio: '1/1', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}>
               <Network size={24} color="var(--text-muted)" />
               <p className="text-label" style={{ fontSize: 11 }}>Distributed Mesh</p>
             </div>
          </div>
        </div>

        {/* Preview Generated Shares if any */}
        {shares.length > 0 && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            <span className="text-label">Encrypted Outputs</span>
            <div style={{ display: 'flex', gap: 16, height: 100 }}>
              {shares.map((s, i) => (
                <div key={i} onClick={() => dl(s, `share_${i+1}.png`)} className="hover-target" style={{ flex: 1, background: 'var(--bg-card-highest)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
                  <img src={s} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0'}>
                    <Download color="var(--accent-primary)" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Final Action */}
        <button className="btn-outline" onClick={split} disabled={!file || loading} style={{ width: '100%', height: 64 }}>
           Initiate Secure Handshake
        </button>

      </section>

    </div>
  );
}
