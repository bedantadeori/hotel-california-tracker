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
  const [session, setSession] = useState(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Once progress loads, jump to the first incomplete day
  useEffect(() => {
    if (progressHook.isLoading) return;
    const totalDays = planData.length;
    for (let day = 1; day <= totalDays; day++) {
      if (!progressHook.isDayCompleted(day)) {
        setActiveDay(day);
        return;
      }
    }
    setActiveDay(totalDays);
  }, [progressHook.isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Close sidebar when a day is selected on mobile
  const handleDaySelect = (day) => {
    setActiveDay(day);
    setSidebarOpen(false);
  };

  // Still checking auth
  if (session === undefined) {
    return (
      <div className="splash-screen">
        <div className="splash-inner">
          <div className="splash-icon">🎸</div>
          <h2>Guitar Mastery</h2>
        </div>
      </div>
    );
  }

  if (!session) return <Login />;

  if (progressHook.isLoading) {
    return (
      <div className="splash-screen">
        <div className="splash-inner">
          <div className="splash-icon">⏳</div>
          <h2>Loading Progress...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Mobile top bar */}
      <header className="mobile-topbar">
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="mobile-topbar-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          Guitar Mastery
        </div>
        <div className="mobile-topbar-day">Day {activeDay}</div>
      </header>

      {/* Overlay when sidebar open on mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar${sidebarOpen ? ' sidebar--open' : ''}`}>
        {/* Close button visible on mobile */}
        <button
          className="sidebar-close-btn"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

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
            setActiveDay={handleDaySelect}
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
