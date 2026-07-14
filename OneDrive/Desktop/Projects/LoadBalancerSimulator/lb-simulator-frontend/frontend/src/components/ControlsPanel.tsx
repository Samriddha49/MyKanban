import { ALGORITHMS, Algorithm, LoadPattern, SimulationConfig } from '../types';

interface Props {
  running: boolean;
  config: SimulationConfig;
  serverCount: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onAlgorithmChange: (a: Algorithm) => void;
  onConfigChange: (patch: Partial<SimulationConfig>) => void;
  onAddServer: () => void;
}

export function ControlsPanel({
  running,
  config,
  serverCount,
  onStart,
  onPause,
  onReset,
  onAlgorithmChange,
  onConfigChange,
  onAddServer,
}: Props) {
  return (
    <div className="panel">
      <div className="panel-title">Controls</div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn primary" onClick={onStart} disabled={running}>
            ▶ Start
          </button>
          <button className="btn" onClick={onPause} disabled={!running}>
            ⏸ Pause
          </button>
          <button className="btn" onClick={onReset}>
            ↺ Reset
          </button>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            REQUESTS/SEC <span style={{ color: 'var(--accent)' }}>{config.requestsPerSec}</span>
          </span>
          <input
            type="range"
            min={1}
            max={80}
            value={config.requestsPerSec}
            onChange={(e) => onConfigChange({ requestsPerSec: Number(e.target.value) })}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>LOAD PATTERN</span>
          <select
            value={config.loadPattern}
            onChange={(e) => onConfigChange({ loadPattern: e.target.value as LoadPattern })}
            className="btn"
          >
            <option value="constant">Constant Load</option>
            <option value="burst">Burst Mode</option>
            <option value="random">Random Load</option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>ALGORITHM</span>
          <select value={config.algorithm} onChange={(e) => onAlgorithmChange(e.target.value as Algorithm)} className="btn">
            {ALGORITHMS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <div style={{ height: 1, background: 'var(--border-soft)' }} />

        <ToggleRow
          label="Auto Scaling"
          hint="Adds a server when avg CPU > 80%"
          value={config.autoScaling}
          onChange={(v) => onConfigChange({ autoScaling: v })}
        />
        <ToggleRow
          label="Sticky Sessions"
          hint="Pin each client to one server"
          value={config.stickySessions}
          onChange={(v) => onConfigChange({ stickySessions: v })}
        />
        <ToggleRow
          label="Retry on Failure"
          hint="Requeue failed requests (max 3x)"
          value={config.retryEnabled}
          onChange={(v) => onConfigChange({ retryEnabled: v })}
        />

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            RATE LIMIT / CLIENT <span style={{ color: 'var(--accent)' }}>{config.rateLimitPerSec || 'off'}</span>
          </span>
          <input
            type="range"
            min={0}
            max={20}
            value={config.rateLimitPerSec}
            onChange={(e) => onConfigChange({ rateLimitPerSec: Number(e.target.value) })}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            REQUEST TIMEOUT <span style={{ color: 'var(--accent)' }}>{(config.requestTimeoutMs / 1000).toFixed(1)}s</span>
          </span>
          <input
            type="range"
            min={1000}
            max={10000}
            step={500}
            value={config.requestTimeoutMs}
            onChange={(e) => onConfigChange({ requestTimeoutMs: Number(e.target.value) })}
          />
        </label>

        <div style={{ height: 1, background: 'var(--border-soft)' }} />

        <button className="btn" onClick={onAddServer} disabled={serverCount >= 8}>
          + Add Server {serverCount >= 8 ? '(max 8)' : ''}
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
      <span>
        <div style={{ fontSize: 13 }}>{label}</div>
        <div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{hint}</div>
      </span>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} style={{ width: 16, height: 16 }} />
    </label>
  );
}
