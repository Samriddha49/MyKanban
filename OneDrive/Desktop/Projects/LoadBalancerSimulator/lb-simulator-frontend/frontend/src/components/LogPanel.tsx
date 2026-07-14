import { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../types';

interface Props {
  logs: LogEntry[];
}

const LEVEL_COLOR: Record<LogEntry['level'], string> = {
  info: 'var(--text-dim)',
  warn: 'var(--warning)',
  error: 'var(--critical)',
};

export function LogPanel({ logs }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [replaying, setReplaying] = useState(false);
  const [replayIdx, setReplayIdx] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && !replaying && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll, replaying]);

  useEffect(() => {
    if (!replaying) return;
    const replaySlice = logs.slice(-40);
    if (replayIdx >= replaySlice.length) {
      setReplaying(false);
      return;
    }
    const t = setTimeout(() => setReplayIdx((i) => i + 1), 120);
    return () => clearTimeout(t);
  }, [replaying, replayIdx, logs]);

  const startReplay = () => {
    setReplaying(true);
    setReplayIdx(0);
  };

  const visible = replaying ? logs.slice(-40).slice(0, replayIdx) : logs.slice(-150);

  return (
    <div className="panel">
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Logging Panel</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn" style={{ padding: '3px 9px', fontSize: 10.5 }} onClick={startReplay} disabled={replaying || logs.length === 0}>
            ▶ Replay last 40
          </button>
          <label style={{ fontSize: 10, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
            auto-scroll
          </label>
        </div>
      </div>
      <div ref={scrollRef} className="scrollbar" style={{ height: 220, overflowY: 'auto', padding: '8px 14px', fontSize: 11.5, lineHeight: 1.7 }}>
        {visible.length === 0 && <div style={{ color: 'var(--text-faint)' }}>No activity yet. Press Start to begin the simulation.</div>}
        {visible.map((l) => (
          <div key={l.id} style={{ color: LEVEL_COLOR[l.level], whiteSpace: 'pre-wrap' }}>
            <span style={{ color: 'var(--text-faint)' }}>[{(l.at / 1000).toFixed(1)}s]</span> {l.text}
          </div>
        ))}
        {replaying && <div style={{ color: 'var(--accent)' }}>— replaying —</div>}
      </div>
    </div>
  );
}
