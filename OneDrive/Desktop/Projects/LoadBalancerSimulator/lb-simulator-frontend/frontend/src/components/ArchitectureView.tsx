import { RequestModel, ServerModel } from '../types';
import { STATUS_LABEL } from './statusLabel';

interface Props {
  servers: ServerModel[];
  requestsInFlight: RequestModel[];
  onSelectRequest: (r: RequestModel) => void;
  onKill: (id: string) => void;
  onRecover: (id: string) => void;
  onRemove: (id: string) => void;
}

/**
 * The signature visual: a live packet-flow map. Requests are rendered as small
 * dots that travel Generator -> Load Balancer -> Server, colored by priority
 * and pulsing while actively processing. Positions are recomputed on every
 * simulation tick and CSS transitions interpolate the motion between ticks.
 */
export function ArchitectureView({ servers, requestsInFlight, onSelectRequest, onKill, onRecover, onRemove }: Props) {
  const genPos = { x: 50, y: 8 };
  const lbPos = { x: 50, y: 42 };
  const serverPositions = servers.map((_, i) => ({
    x: servers.length === 1 ? 50 : (100 / (servers.length + 1)) * (i + 1),
    y: 86,
  }));

  const dots: { key: string; x: number; y: number; color: string; pulsing: boolean; req: RequestModel }[] = [];

  for (const req of requestsInFlight) {
    const pos = req.stage === 'retrying' ? lbPos : genPos;
    dots.push({ key: `if-${req.id}`, x: pos.x, y: pos.y, color: req.priority === 'high' ? 'var(--vip)' : 'var(--accent)', pulsing: false, req });
  }

  servers.forEach((server, i) => {
    server.queue.forEach((req) => {
      const pos = req.stage === 'processing' ? serverPositions[i] : lbPos;
      dots.push({
        key: `sv-${req.id}`,
        x: pos.x,
        y: pos.y,
        color: req.priority === 'high' ? 'var(--vip)' : 'var(--accent)',
        pulsing: req.stage === 'processing',
        req,
      });
    });
  });

  return (
    <div className="panel" style={{ position: 'relative' }}>
      <div className="panel-title">Live Traffic Map</div>
      <div style={{ position: 'relative', height: 360, padding: '18px 24px' }}>
        {/* connector lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <line
            x1={`${genPos.x}%`}
            y1={`${genPos.y + 4}%`}
            x2={`${lbPos.x}%`}
            y2={`${lbPos.y - 6}%`}
            stroke="var(--border)"
            strokeWidth={2}
            strokeDasharray="4 5"
          />
          {serverPositions.map((p, i) => (
            <line
              key={i}
              x1={`${lbPos.x}%`}
              y1={`${lbPos.y + 6}%`}
              x2={`${p.x}%`}
              y2={`${p.y - 8}%`}
              stroke="var(--border)"
              strokeWidth={2}
              strokeDasharray="4 5"
            />
          ))}
        </svg>

        {/* generator node */}
        <NodeBox x={genPos.x} y={genPos.y} label="Request Generator" sub={`${requestsInFlight.length} pending`} />

        {/* load balancer node */}
        <NodeBox x={lbPos.x} y={lbPos.y} label="Load Balancer" sub="routing" accent />

        {/* server nodes */}
        {servers.map((s, i) => (
          <ServerNode
            key={s.id}
            x={serverPositions[i].x}
            y={serverPositions[i].y}
            server={s}
            onKill={() => onKill(s.id)}
            onRecover={() => onRecover(s.id)}
            onRemove={() => onRemove(s.id)}
          />
        ))}

        {/* animated packets */}
        {dots.slice(0, 60).map((d) => (
          <div
            key={d.key}
            onClick={() => onSelectRequest(d.req)}
            title={`Request #${d.req.id} — click for timeline`}
            style={{
              position: 'absolute',
              left: `${d.x}%`,
              top: `${d.y}%`,
              transform: 'translate(-50%, -50%)',
              width: d.pulsing ? 9 : 7,
              height: d.pulsing ? 9 : 7,
              borderRadius: '50%',
              background: d.color,
              boxShadow: `0 0 ${d.pulsing ? 10 : 5}px ${d.color}`,
              transition: 'left 0.45s ease, top 0.45s ease',
              cursor: 'pointer',
              zIndex: 5,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function NodeBox({ x, y, label, sub, accent }: { x: number; y: number; label: string; sub: string; accent?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        background: accent ? 'var(--accent-soft)' : 'var(--panel-2)',
        border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 8,
        padding: '8px 14px',
        textAlign: 'center',
        zIndex: 2,
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ fontSize: 11.5, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{sub}</div>
    </div>
  );
}

function ServerNode({
  x,
  y,
  server,
  onKill,
  onRecover,
  onRemove,
}: {
  x: number;
  y: number;
  server: ServerModel;
  onKill: () => void;
  onRecover: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        background: 'var(--panel-2)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '8px 12px',
        textAlign: 'center',
        minWidth: 92,
        zIndex: 2,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, fontFamily: 'var(--font-display)' }}>
        <span className={`status-dot ${server.status}`} />
        {server.name}
      </div>
      <div style={{ fontSize: 9.5, color: 'var(--text-faint)', marginTop: 2 }}>{STATUS_LABEL[server.status]}</div>
      <div style={{ fontSize: 9.5, color: 'var(--text-dim)' }}>queue {server.queue.length}</div>
      <div style={{ display: 'flex', gap: 4, marginTop: 6, justifyContent: 'center' }}>
        {server.status !== 'unhealthy' ? (
          <button className="btn danger" style={{ padding: '2px 6px', fontSize: 9.5 }} onClick={onKill}>
            kill
          </button>
        ) : (
          <button className="btn" style={{ padding: '2px 6px', fontSize: 9.5 }} onClick={onRecover}>
            recover
          </button>
        )}
        <button className="btn" style={{ padding: '2px 6px', fontSize: 9.5 }} onClick={onRemove}>
          remove
        </button>
      </div>
    </div>
  );
}
