import { useState } from 'react';
import SplitPage from './Split';
import CombinePage from './CombinePage';
import { LayersRounded as Layers, MergeRounded as Merge } from '@mui/icons-material';

export default function CryptoPage() {
  const [mode, setMode] = useState<'split' | 'combine'>('split');
  const isMobile = window.innerWidth <= 768;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      
      {/* Sub-Navigation Switcher */}
      <div style={{ 
        padding: isMobile ? '12px 16px' : '20px 32px', 
        background: 'var(--bg-card)', 
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        zIndex: 50
      }}>
        <div style={{ 
          display: 'flex', 
          background: 'var(--bg-card-highest)', 
          padding: 4, 
          borderRadius: 0,
          border: '1px solid var(--border)',
          width: isMobile ? '100%' : 'auto'
        }}>
          <button 
            onClick={() => setMode('split')}
            style={{ 
              flex: 1,
              padding: '8px 24px', 
              background: mode === 'split' ? 'var(--accent-primary)' : 'transparent',
              color: mode === 'split' ? 'var(--bg-primary)' : 'var(--text-muted)',
              border: 'none',
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
          >
            <Layers sx={{ fontSize: 16 }} />
            Partition
          </button>
          <button 
            onClick={() => setMode('combine')}
            style={{ 
              flex: 1,
              padding: '8px 24px', 
              background: mode === 'combine' ? 'var(--accent-gold)' : 'transparent',
              color: mode === 'combine' ? 'var(--bg-primary)' : 'var(--text-muted)',
              border: 'none',
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
          >
            <Merge sx={{ fontSize: 16 }} />
            Reconstruct
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {mode === 'split' ? <SplitPage /> : <CombinePage />}
      </div>
    </div>
  );
}
