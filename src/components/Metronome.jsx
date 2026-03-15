import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function Metronome() {
  const [bpm, setBpm] = useState(60);
  const [playing, setPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const currentBeatInBarRef = useRef(0);
  const timerIDRef = useRef(null);

  const lookahead = 25.0; // ms
  const scheduleAheadTime = 0.1; // s

  const nextNote = useCallback(() => {
    const secondsPerBeat = 60.0 / bpm;
    nextNoteTimeRef.current += secondsPerBeat;
    currentBeatInBarRef.current = (currentBeatInBarRef.current + 1) % 4; // 4/4 time signature
  }, [bpm]);

  const scheduleNote = useCallback((beatNumber, time) => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    
    // Higher pitch on the downbeat (beat 0)
    osc.frequency.value = beatNumber === 0 ? 1000 : 800;
    
    // Short sharp envelope
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.start(time);
    osc.stop(time + 0.05);
  }, []);

  const scheduler = useCallback(() => {
    while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
      scheduleNote(currentBeatInBarRef.current, nextNoteTimeRef.current);
      nextNote();
    }
    timerIDRef.current = setTimeout(scheduler, lookahead);
  }, [nextNote, scheduleNote]);

  useEffect(() => {
    if (playing) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;
      currentBeatInBarRef.current = 0;
      scheduler();
    } else {
      if (timerIDRef.current) {
        clearTimeout(timerIDRef.current);
        timerIDRef.current = null;
      }
    }
    
    return () => {
      if (timerIDRef.current) {
        clearTimeout(timerIDRef.current);
      }
    };
  }, [playing, scheduler]);

  const handleBpmChange = (e) => {
    setBpm(Number(e.target.value));
  };

  const adjustBpm = (delta) => {
    setBpm(prev => Math.min(240, Math.max(30, prev + delta)));
  };

  return (
    <div className="metronome-container">
      <div className="metronome-header">
        <span className="metronome-title">Metronome</span>
        <div className="bpm-controls">
          <button className="bpm-btn" onClick={() => adjustBpm(-5)}>-</button>
          <input 
            type="number" 
            className="bpm-input" 
            value={bpm} 
            onChange={handleBpmChange}
            min="30" max="240"
          />
          <button className="bpm-btn" onClick={() => adjustBpm(5)}>+</button>
        </div>
      </div>
      
      <button 
        className={`metronome-play-btn ${playing ? 'playing' : ''}`}
        onClick={() => setPlaying(!playing)}
      >
        {playing ? 'Stop' : 'Start'}
      </button>
    </div>
  );
}
