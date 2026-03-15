import React from 'react';
import TaskTimer from './TaskTimer';

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

  // Parse markdown-style links out of descriptions and embed media
  const parseDescription = (text) => {
    // Strip trailing pipe symbols left over from the source markdown
    text = text.replace(/\s*\|\s*$/, '').trim();
    // Basic regex to replace [text](url) with <a href="url" target="_blank">text</a>
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      const linkText = match[1];
      const url = match[2];
      
      // Check if it's an image
      const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
      
      // Check if it's a YouTube video
      let youtubeMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/);
      
      if (isImage) {
        parts.push(
          <div key={match.index} className="media-embed image-embed">
            <img src={url} alt={linkText} />
            {linkText.toLowerCase() !== 'image' && <span className="media-caption">{linkText}</span>}
          </div>
        );
      } else if (youtubeMatch) {
         // Extract video ID (rudimentary way, works for standard watch?v= and youtu.be/)
         let videoId = youtubeMatch[1].split('&')[0]; 
         parts.push(
           <div key={match.index} className="media-embed video-embed">
             <iframe 
               width="100%" 
               height="315" 
               src={`https://www.youtube.com/embed/${videoId}`} 
               title={linkText} 
               frameBorder="0" 
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
               allowFullScreen>
             </iframe>
           </div>
         );
      } else {
        parts.push(
          <a key={match.index} href={url} target="_blank" rel="noopener noreferrer">
            {linkText}
          </a>
        );
      }
      
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Categorize content
  const motivation = dayData.tasks.find(t => t.category === 'Daily Motivation');
  const resources = dayData.tasks.filter(t => t.category === 'Resource');
  const actionableTasks = dayData.tasks.filter(t => t.category !== 'Daily Motivation' && t.category !== 'Resource');

  return (
    <div className="day-view" key={dayId}>
      {motivation && (
        <div className="daily-motivation-cover">
          <div className="motivation-content">
            {parseDescription(motivation.content)}
          </div>
        </div>
      )}

      <div className="day-header">
        <div className="day-subtitle">Week {dayData.week} • Day {dayData.day}</div>
        <h2 className="day-title">{dayData.title}</h2>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${percentComplete}%` }}></div>
        </div>
      </div>

      <div className="task-list">
        {!isUnlocked && (
          <div className="locked-banner" style={{marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)'}}>
            <strong>🔒 Day Locked</strong>
            <p style={{margin: '0.5rem 0 0 0', fontSize: '0.9rem'}}>Complete all tasks in Day {dayId - 1} to unlock today's practice.</p>
          </div>
        )}

        {actionableTasks.map((task, index) => {
          // We need to find the original index in `dayData.tasks` so that the database toggle matches the exact array item.
          const originalIndex = dayData.tasks.findIndex(t => t === task);
          const isChecked = tasksCompleted.includes(originalIndex);
          
          return (
            <div key={originalIndex} className={`task-item ${isChecked ? 'completed' : ''}`} style={!isUnlocked ? { opacity: 0.7 } : {}}>
              <div className="checkbox-wrapper">
                <div 
                  className={`custom-checkbox ${isChecked ? 'checked' : ''} ${!isUnlocked ? 'disabled' : ''}`}
                  onClick={() => {
                    if (isUnlocked) toggleTask(dayId, originalIndex);
                  }}
                  style={!isUnlocked ? { cursor: 'not-allowed', borderColor: 'var(--border-color)', backgroundColor: 'transparent' } : {}}
                >
                  {isChecked && <CheckIcon />}
                </div>
              </div>
              <div className="task-content">
                <div className="task-category-row">
                  <div className="task-category">{task.category}</div>
                  {task.duration && <div className="task-duration">⏳ {task.duration}</div>}
                  {task.duration && isUnlocked && <TaskTimer duration={task.duration} key={`${dayId}-${originalIndex}`} />}
                </div>
                <div className="task-description">
                  {parseDescription(task.content)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {resources.length > 0 && (
        <div className="resources-section">
          <h3 className="resources-title">Resources & Context</h3>
          <div className="resources-list">
            {resources.map((resource, i) => (
              <div key={`res-${i}`} className="resource-item">
                <div className="resource-description">
                  {parseDescription(resource.content)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
