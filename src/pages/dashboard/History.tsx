import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  History as Clock, 
  Shield, 
  Search, 
  EyeOff, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';

export default function History() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user && userData.user.id !== 'dev-user') {
        const { data } = await supabase
          .from('operations')
          .select('*')
          .eq('user_id', userData.user.id)
          .order('created_at', { ascending: false });
        if (data) setRecords(data);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'protect': return <Shield size={14} style={{ color: 'var(--accent-blue)' }} />;
      case 'verify': return <Search size={14} style={{ color: 'var(--accent-gold)' }} />;
      case 'redact': return <EyeOff size={14} style={{ color: 'var(--error)' }} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Activity History</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            A comprehensive log of all your cryptographic protection, verification, and redaction operations.
          </p>
        </div>
        <button onClick={fetchHistory} className="btn-outline" style={{ height: 36, padding: '0 12px' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="panel" style={{ overflow: 'hidden' }}>
        {loading && records.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
            <div className="spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', marginBottom: 16 }} />
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Syncing with Aegis Cloud...</div>
          </div>
        ) : records.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, textAlign: 'center' }}>
            <Clock size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>No operations found</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 300 }}>
              Once you protect, verify or redact your first image, your activity will be securely logged here.
            </div>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'minmax(120px, 1fr) 120px 100px minmax(180px, 1fr) 60px', 
              padding: '16px 24px', 
              fontSize: 11, 
              fontWeight: 700, 
              color: 'var(--text-muted)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-secondary)'
            }}>
              <div>Watermark Code</div>
              <div>Operation Type</div>
              <div>Status</div>
              <div>Timestamp</div>
              <div style={{ textAlign: 'right' }}>Log</div>
            </div>

            {/* List */}
            <div style={{ maxHeight: 'calc(100vh - 350px)', overflow: 'auto' }}>
              {records.map((r, i) => (
                <div key={i} style={{
                  display: 'grid', 
                  gridTemplateColumns: 'minmax(120px, 1fr) 120px 100px minmax(180px, 1fr) 60px', 
                  padding: '16px 24px', 
                  fontSize: 13, 
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.2s',
                  alignItems: 'center'
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: r.watermark_code ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                    {r.watermark_code || '---'}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {getTypeIcon(r.operation_type)}
                    {r.operation_type}
                  </div>
                  
                  <div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                      background: r.status === 'success' ? 'var(--success-bg)' : 'var(--error-bg)',
                      color: r.status === 'success' ? 'var(--success)' : 'var(--error)',
                      display: 'inline-flex', alignItems: 'center', gap: 4
                    }}>
                      {r.status === 'success' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                      {r.status}
                    </span>
                  </div>
                  
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    <span style={{ fontWeight: 500 }}>{new Date(r.created_at).toLocaleDateString()}</span>
                    <span style={{ opacity: 0.5, marginLeft: 8 }}>{new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <button className="btn-outline" style={{ padding: '6px', minWidth: 'auto', borderRadius: '6px', border: 'none' }} title="View Details">
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <div>Showing {records.length} history records</div>
              <div>End-to-end Encrypted Log</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
