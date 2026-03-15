import React from 'react';
import Metronome from './Metronome';

export default function ProgressTracker({ weeks, progressHook, activeDay, setActiveDay }) {
  const { isDayCompleted, isDayUnlocked, completedDays } = progressHook;

  // Calculate Overall Progress
  const totalDays = weeks.reduce((sum, week) => sum + week.days.length, 0);
  const completedCount = completedDays.length;
  const overallProgress = Math.round((completedCount / totalDays) * 100) || 0;

  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (overallProgress / 100) * circumference;

  return (
    <div className="tracker-wrapper">
      <div className="tracker-header-row">
        
        {/* 1. Overall Mastery Donut */}
        <div className="compact-mastery-card" title={`${completedCount} of ${totalDays} days completed`}>
          <div className="mastery-donut-container">
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
              <circle 
                cx="20" cy="20" r={radius} fill="none" 
                stroke="var(--accent-color)" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={dashOffset}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div className="mastery-donut-text">{overallProgress}<span>%</span></div>
          </div>
          <span className="mastery-label">Mastery</span>
        </div>

        {/* 2. Jump to Today */}
        <button 
          className="compact-jump-btn" 
          onClick={() => {
            const firstIncomplete = weeks.flatMap(w => w.days).find(d => !isDayCompleted(d.day));
            if (firstIncomplete) setActiveDay(firstIncomplete.day);
          }}
          title="Go to current practice day"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          Today
        </button>

        {/* 3. Metronome */}
        <Metronome />
      </div>

      {weeks.map(week => (
        <div key={week.weekNum} className="week-container">
          <div className="week-title">Phase {Math.ceil(week.weekNum / 3)} • Week {week.weekNum}</div>
          <div className="days-grid">
            {week.days.map(day => {
              const dayId = day.day;
              const completed = isDayCompleted(dayId);
              const unlocked = isDayUnlocked(dayId);
              const isCurrent = activeDay === dayId;

              let className = 'day-bubble';
              if (!unlocked) className += ' locked';
              else if (completed) className += ' completed';
              if (isCurrent) className += ' current';

              return (
                <div 
                  key={dayId} 
                  className={className} 
                  onClick={() => setActiveDay(dayId)}
                  title={day.title}
                >
                  {completed ? '✓' : dayId}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
