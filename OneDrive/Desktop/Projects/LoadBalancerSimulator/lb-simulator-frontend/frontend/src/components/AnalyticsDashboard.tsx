import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AnalyticsSnapshot, ServerModel } from '../types';

interface Props {
  history: AnalyticsSnapshot[];
  servers: ServerModel[];
  totals: { generated: number; completed: number; failed: number; retried: number };
  algorithm: string;
}

const tooltipStyle = {
  background: 'var(--panel-2)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: 11,
  color: 'var(--text)',
};

export function AnalyticsDashboard({ history, servers, totals, algorithm }: Props) {
  const last = history[history.length - 1];
  const totalQueue = servers.reduce((s, srv) => s + srv.queue.length, 0);
  const activeServers = servers.filter((s) => s.status === 'healthy' || s.status === 'circuit-half-open').length;

  return (
    <div className="panel">
      <div className="panel-title">Analytics Dashboard</div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 18 }}>
          <Stat label="Requests/sec" value={last?.requestsPerSec ?? 0} />
          <Stat label="Total Requests" value={totals.generated} />
          <Stat label="Failed" value={totals.failed} color="var(--critical)" />
          <Stat label="Retried" value={totals.retried} color="var(--warning)" />
          <Stat label="Avg Response" value={`${last?.avgResponseMs ?? 0}ms`} />
          <Stat label="Throughput (5s)" value={last?.throughput ?? 0} />
          <Stat label="Queue Length" value={totalQueue} />
          <Stat label="Active Servers" value={`${activeServers}/${servers.length}`} />
          <Stat label="Algorithm" value={algorithm} small />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ChartBlock title="Avg Response Time (ms)">
            <LineChart data={history}>
              <CartesianGrid stroke="var(--border-soft)" vertical={false} />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} width={32} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="avgResponseMs" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartBlock>

          <ChartBlock title="Queue Length & CPU %">
            <LineChart data={history}>
              <CartesianGrid stroke="var(--border-soft)" vertical={false} />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} width={32} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="queueLength" stroke="var(--vip)" strokeWidth={2} dot={false} isAnimationActive={false} name="Queue" />
              <Line type="monotone" dataKey="avgCpu" stroke="var(--warning)" strokeWidth={2} dot={false} isAnimationActive={false} name="Avg CPU" />
            </LineChart>
          </ChartBlock>
        </div>
      </div>
    </div>
  );
}

function ChartBlock({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>{title}</div>
      <ResponsiveContainer width="100%" height={160}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function Stat({ label, value, color, small }: { label: string; value: string | number; color?: string; small?: boolean }) {
  return (
    <div className="panel" style={{ padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: small ? 13 : 20, fontFamily: 'var(--font-display)', fontWeight: 600, color: color ?? 'var(--text)', marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}
