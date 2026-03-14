import React from 'react';

export default function ProgressTracker({ weeks, progressHook, activeDay, setActiveDay }) {
  const { isDayCompleted, isDayUnlocked, completedDays } = progressHook;

  // Calculate Overall Progress
  const totalDays = weeks.reduce((sum, week) => sum + week.days.length, 0);
  const completedCount = completedDays.length;
  const overallProgress = Math.round((completedCount / totalDays) * 100) || 0;

  return (
    <div className="tracker-wrapper">
      <div className="global-progress-card">
        <div className="global-progress-header">
          <span>Overall Mastery</span>
          <span className="global-progress-percent">{overallProgress}%</span>
        </div>
        <div className="progress-bar-bg small">
          <div className="progress-bar-fill" style={{ width: `${overallProgress}%` }}></div>
        </div>
        <div className="global-progress-subtext">
          {completedCount} of {totalDays} practice days completed
        </div>
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
              if (isCurrent && unlocked) className += ' current';

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
