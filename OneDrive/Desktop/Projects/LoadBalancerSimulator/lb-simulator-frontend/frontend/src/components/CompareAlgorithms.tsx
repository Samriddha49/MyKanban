import { useState } from 'react';
import { ALGORITHMS, Algorithm, SimulationConfig } from '../types';
import { SimulationEngine } from '../simulation/engine';

interface Props {
  baseConfig: SimulationConfig;
}

interface Result {
  algorithm: Algorithm;
  avgResponseMs: number;
  completed: number;
  failed: number;
}

/**
 * Runs two short, headless (non-visual) simulations back to back using the same
 * traffic conditions but different algorithms, then compares average response time.
 * This uses fresh SimulationEngine instances so it never touches the live/visible run.
 */
function runHeadless(algorithm: Algorithm, baseConfig: SimulationConfig, simulatedSeconds = 12): Result {
  const engine = new SimulationEngine({ ...baseConfig, algorithm });
  engine.running = true;
  const steps = (simulatedSeconds * 1000) / 100;
  for (let i = 0; i < steps; i++) {
    engine.tick(100);
  }
  const stats = engine.getStats();
  return { algorithm, avgResponseMs: Math.round(stats.avgResponseMs), completed: stats.completed, failed: stats.failed };
}

export function CompareAlgorithms({ baseConfig }: Props) {
  const [left, setLeft] = useState<Algorithm>('round-robin');
  const [right, setRight] = useState<Algorithm>('least-connections');
  const [results, setResults] = useState<[Result, Result] | null>(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    // Yield to the browser so the button click renders before the (synchronous) crunch.
    await new Promise((r) => setTimeout(r, 30));
    const a = runHeadless(left, baseConfig);
    const b = runHeadless(right, baseConfig);
    setResults([a, b]);
    setRunning(false);
  };

  return (
    <div className="panel">
      <div className="panel-title">Compare Algorithms</div>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 12 }}>
          Runs two isolated 12s simulations at the current traffic settings ({baseConfig.requestsPerSec} req/s, {baseConfig.loadPattern}) and
          compares outcomes. Does not affect the live simulation above.
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
          <AlgoSelect value={left} onChange={setLeft} />
          <span style={{ color: 'var(--text-faint)' }}>vs</span>
          <AlgoSelect value={right} onChange={setRight} />
          <button className="btn primary" onClick={run} disabled={running} style={{ marginLeft: 'auto' }}>
            {running ? 'Running…' : 'Run Comparison'}
          </button>
        </div>

        {results && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {results.map((r) => (
              <div key={r.algorithm} className="panel" style={{ padding: 12 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                  {ALGORITHMS.find((a) => a.value === r.algorithm)?.label}
                </div>
                <MiniStat label="Average Response" value={`${r.avgResponseMs} ms`} />
                <MiniStat label="Completed" value={String(r.completed)} />
                <MiniStat label="Failed / Timed out" value={String(r.failed)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AlgoSelect({ value, onChange }: { value: Algorithm; onChange: (a: Algorithm) => void }) {
  return (
    <select className="btn" value={value} onChange={(e) => onChange(e.target.value as Algorithm)}>
      {ALGORITHMS.map((a) => (
        <option key={a.value} value={a.value}>
          {a.label}
        </option>
      ))}
    </select>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
      <span style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
