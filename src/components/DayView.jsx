import React from 'react';

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default function DayView({ dayData, progressHook }) {
  if (!dayData) {
    return (
      <div className="empty-state">
        <div className="icon">🎸</div>
        <h2>Ready to Master the Fretboard?</h2>
        <p>Select a day from the progressive tracker on the left to begin your practice journey.</p>
      </div>
    );
  }

  const { completedTasks, toggleTask, getDayProgress, isDayUnlocked } = progressHook;
  const dayId = dayData.day;
  const isUnlocked = isDayUnlocked(dayId);
  const tasksCompleted = completedTasks[dayId] || [];
  const percentComplete = getDayProgress(dayId);

  // Parse markdown-style links out of descriptions
  const parseDescription = (text) => {
    // Basic regex to replace [text](url) with <a href="url" target="_blank">text</a>
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer">
          {match[1]}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="day-view" key={dayId}>
      <div className="day-header">
        <div className="day-subtitle">Week {dayData.week} • Day {dayData.day}</div>
        <h2 className="day-title">{dayData.title}</h2>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${percentComplete}%` }}></div>
        </div>
      </div>

      <div className="task-list">
        {!isUnlocked && (
          <div className="task-item" style={{opacity: 0.6, pointerEvents: 'none'}}>
            <div className="task-content" style={{textAlign: 'center', color: 'var(--text-secondary)'}}>
              <strong>Day Locked</strong>
              <p>Complete the tasks in Day {dayId - 1} to unlock today's practice.</p>
            </div>
          </div>
        )}

        {isUnlocked && dayData.tasks.map((task, index) => {
          const isChecked = tasksCompleted.includes(index);
          return (
            <div key={index} className={`task-item ${isChecked ? 'completed' : ''}`}>
              <div className="checkbox-wrapper">
                <div 
                  className={`custom-checkbox ${isChecked ? 'checked' : ''}`}
                  onClick={() => toggleTask(dayId, index)}
                >
                  {isChecked && <CheckIcon />}
                </div>
              </div>
              <div className="task-content">
                <div className="task-category">{task.category}</div>
                <div className="task-description">
                  {parseDescription(task.content)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
