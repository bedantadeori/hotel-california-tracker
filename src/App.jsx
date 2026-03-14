import React, { useState, useMemo, useEffect } from 'react';
import planData from './data/plan.json';
import { useProgress } from './hooks/useProgress';
import ProgressTracker from './components/ProgressTracker';
import DayView from './components/DayView';

export default function App() {
  const progressHook = useProgress();
  const [activeDay, setActiveDay] = useState(1);

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

  if (progressHook.isLoading) {
    return (
      <div className="app-container" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{textAlign: 'center', color: 'var(--text-secondary)'}}>
           <div style={{marginBottom: '1rem', fontSize: '2rem'}}>⏳</div>
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
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
               <path d="M9 18V5l12-2v13"></path>
               <circle cx="6" cy="18" r="3"></circle>
               <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <h1>Hotel California</h1>
          <p>Mastery Plan</p>
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
