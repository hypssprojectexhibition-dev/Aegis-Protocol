import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import { Session } from '@supabase/supabase-js';
import { useThemeSystem } from './lib/theme';
import './index.css';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useThemeSystem(); // Initialize theme

  useEffect(() => {
    const isDev = localStorage.getItem('dev_bypass') === 'true';
    if (isDev) {
      setSession({
        access_token: 'dev', refresh_token: 'dev', expires_in: 999,
        token_type: 'bearer',
        user: { id: 'dev-user', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' }
      } as Session);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="spin" style={{ width: 24, height: 24, border: '2px solid var(--ring)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }} />
      </div>
    );
  }

  if (!session) return <Auth />;
  return <Dashboard />;
}
