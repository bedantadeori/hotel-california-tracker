import React, { useState, useMemo, useEffect } from 'react';
import planData from './data/plan.json';
import { useProgress } from './hooks/useProgress';
import ProgressTracker from './components/ProgressTracker';
import DayView from './components/DayView';
import Login from './components/Login';
import { supabase } from './lib/supabase';

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const progressHook = useProgress(session?.user?.id);
  const [activeDay, setActiveDay] = useState(null);

  const handleLogin = async () => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      console.error('Error logging in:', error.message);
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    }
    setAuthLoading(false);
  };

  // Group days by week
  const weeks = useMemo(() => {
    const grouped = {};
    planData.forEach(day => {
      if (!grouped[day.week]) {
        grouped[day.week] = [];
      }
      grouped[day.week].push(day);
    });
    return Object.keys(grouped).sort((a,b)=>a-b).map(w => ({
      weekNum: parseInt(w),
      days: grouped[w]
    }));
  }, []);

  const activeDayData = useMemo(() => {
    return planData.find(d => d.day === activeDay);
  }, [activeDay]);

  if (authLoading || (session && progressHook.isLoading)) {
    return (
      <div className="app-container" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{textAlign: 'center', color: 'var(--text-secondary)'}}>
           <div style={{marginBottom: '1rem', fontSize: '2rem'}}>⏳</div>
           <h2>Loading Progress...</h2>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Hotel California</h1>
          <p>Guitar Solo Mastery Plan</p>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem'}}>
            {progressHook.syncing ? <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>Syncing...</span> : <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>Synced to Cloud</span>}
            <button onClick={handleLogout} style={{background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline', padding: 0}}>Logout</button>
          </div>
        </div>
        <div className="sidebar-content">
          <ProgressTracker 
            weeks={weeks} 
            progressHook={progressHook} 
            activeDay={activeDay}
            setActiveDay={setActiveDay}
          />
        </div>
      </aside>
      
      <main className="main-content">
        <DayView 
          dayData={activeDayData} 
          progressHook={progressHook} 
        />
      </main>
    </div>
  );
}
