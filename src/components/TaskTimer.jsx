import React, { useState, useEffect, useRef, useCallback } from 'react';

// Parse duration strings like "10 min", "5-10 min", "45 sec" into total seconds
function parseDurationToSeconds(duration) {
  if (!duration) return null;
  const lower = duration.toLowerCase();
  const rangeMatch = lower.match(/(\d+)\s*[-–]\s*\d+\s*min/);
  if (rangeMatch) return parseInt(rangeMatch[1]) * 60;
  const minMatch = lower.match(/(\d+)\s*min/);
  if (minMatch) return parseInt(minMatch[1]) * 60;
  const secMatch = lower.match(/(\d+)\s*sec/);
  if (secMatch) return parseInt(secMatch[1]);
  return null;
}

// 4-note chime via Web Audio API
function playAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.22);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.22);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + i * 0.22 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.22 + 0.6);
      osc.start(ctx.currentTime + i * 0.22);
      osc.stop(ctx.currentTime + i * 0.22 + 0.65);
    });
    setTimeout(() => ctx.close(), 2000);
  } catch (e) {
    console.warn('Web Audio not available', e);
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// TimerPanel: the expanded countdown card rendered below the task description
export function TimerPanel({ duration, onClose }) {
  const totalSeconds = parseDurationToSeconds(duration);
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(true); // auto-start when opened
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearTimer();
            setRunning(false);
            setDone(true);
            playAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [running, clearTimer]);

  const handleReset = () => {
    clearTimer();
    onClose(); // close the panel from parent
  };

  if (!totalSeconds) return null;

  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`timer-panel ${done ? 'timer-done' : ''}`}>
      <div className="timer-ring-container">
        <svg className="timer-ring" width="128" height="128" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx="64" cy="64" r={radius} fill="none"
            stroke={done ? '#8db587' : 'var(--accent-color)'}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.8s linear' }}
          />
        </svg>
        <div className="timer-display">
          {done
            ? <span className="timer-done-icon">✓</span>
            : <span className="timer-digits">{formatTime(timeLeft)}</span>
          }
        </div>
      </div>

      {done && <p className="timer-complete-msg">Time's up! Great work.</p>}

      <div className="timer-controls">
        {!done && (
          running
            ? <button className="timer-btn timer-pause-btn" onClick={() => setRunning(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                </svg>
                Pause
              </button>
            : <button className="timer-btn timer-resume-btn" onClick={() => setRunning(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
                Resume
              </button>
        )}
        <button className="timer-btn timer-reset-btn" onClick={handleReset}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.9L1 10" />
          </svg>
          {done ? 'Close' : 'Stop'}
        </button>
      </div>
    </div>
  );
}
