import React, { useState, useMemo, useEffect } from 'react';
import planData from './data/plan.json';
import { supabase } from './lib/supabase';
import { useProgress } from './hooks/useProgress';
import ProgressTracker from './components/ProgressTracker';
import DayView from './components/DayView';
import Login from './components/Login';

export default function App() {
  const progressHook = useProgress();
  const [activeDay, setActiveDay] = useState(1);
  const [session, setSession] = useState(undefined); // undefined = checking, null = no session

  // Check auth state on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Group days by week
  const weeks = useMemo(() => {
    const grouped = {};
    planData.forEach(day => {
      if (!grouped[day.week]) grouped[day.week] = [];
      grouped[day.week].push(day);
    });
    return Object.keys(grouped).sort((a, b) => a - b).map(w => ({
      weekNum: parseInt(w),
      days: grouped[w]
    }));
  }, []);

  const activeDayData = useMemo(() => {
    return planData.find(d => d.day === activeDay);
  }, [activeDay]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Still checking auth status
  if (session === undefined) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>🎸</div>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return <Login />;
  }

  // Loading progress data
  if (progressHook.isLoading) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>⏳</div>
          <h2>Loading Progress...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="app-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <div className="sidebar-header-text">
            <h1>Hotel California</h1>
            <p>Guitar Mastery Plan</p>
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
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {session.user?.user_metadata?.avatar_url
                ? <img src={session.user.user_metadata.avatar_url} alt="avatar" />
                : '👤'}
            </div>
            <span className="sidebar-user-name">{session.user?.user_metadata?.user_name || session.user?.email}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
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
