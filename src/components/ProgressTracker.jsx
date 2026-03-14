import React from 'react';

export default function ProgressTracker({ weeks, progressHook, activeDay, setActiveDay }) {
  const { isDayCompleted, isDayUnlocked } = progressHook;

  return (
    <div className="tracker-wrapper">
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
