import { ServerModel } from '../types';
import { STATUS_LABEL } from './statusLabel';

interface Props {
  servers: ServerModel[];
  onUpdate: (id: string, patch: { processingMs?: number; capacity?: number; weight?: number }) => void;
}

function heatColor(cpu: number): string {
  if (cpu < 40) return 'var(--healthy)';
  if (cpu < 65) return '#9fd14a';
  if (cpu < 80) return 'var(--warning)';
  return 'var(--critical)';
}

export function ServerGrid({ servers, onUpdate }: Props) {
  return (
    <div className="panel">
      <div className="panel-title">Servers &amp; Heat Map</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 14,
          padding: 16,
        }}
      >
        {servers.map((s) => (
          <div
            key={s.id}
            className="panel"
            style={{ padding: 14, borderColor: s.status === 'unhealthy' ? 'var(--critical)' : 'var(--border)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>{s.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase' }}>{s.region}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
              <span className={`status-dot ${s.status}`} /> {STATUS_LABEL[s.status]}
            </div>

            <Metric label="CPU" value={s.cpu} color={heatColor(s.cpu)} />
            <Metric label="Memory" value={s.memory} color={heatColor(s.memory)} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 8 }}>
              <span style={{ color: 'var(--text-dim)' }}>Queue</span>
              <span>{s.queue.length}</span>
            </div>
            <QueueBar length={s.queue.length} capacity={s.capacity} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-faint)', marginTop: 6 }}>
              <span>✓ {s.totalCompleted}</span>
              <span>✕ {s.totalFailed}</span>
              <span>{s.latencyMs}ms lat</span>
            </div>

            <div style={{ height: 1, background: 'var(--border-soft)', margin: '10px 0' }} />

            <SliderRow
              label="Processing"
              unit="ms/req"
              value={s.processingMs}
              min={20}
              max={400}
              step={10}
              onChange={(v) => onUpdate(s.id, { processingMs: v })}
            />
            <SliderRow
              label="Capacity"
              unit="req/s"
              value={s.capacity}
              min={20}
              max={300}
              step={10}
              onChange={(v) => onUpdate(s.id, { capacity: v })}
            />
            <SliderRow label="Weight" unit="x" value={s.weight} min={1} max={10} step={1} onChange={(v) => onUpdate(s.id, { weight: v })} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)' }}>
        <span>{label}</span>
        <span>{value.toFixed(0)}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--panel)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
        <div style={{ width: `${Math.min(100, value)}%`, height: '100%', background: color, transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );
}

function QueueBar({ length, capacity }: { length: number; capacity: number }) {
  const pct = Math.min(100, (length / Math.max(1, capacity / 5)) * 100);
  return (
    <div style={{ height: 6, background: 'var(--panel)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border-soft)', marginTop: 3 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: heatColor(pct), transition: 'width 0.3s ease' }} />
    </div>
  );
}

function SliderRow({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-dim)' }}>
        <span>{label}</span>
        <span>
          {value}
          {unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%' }} />
    </label>
  );
}
