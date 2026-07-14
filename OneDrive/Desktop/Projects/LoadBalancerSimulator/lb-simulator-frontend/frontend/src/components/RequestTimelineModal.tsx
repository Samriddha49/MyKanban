import { RequestModel } from '../types';

interface Props {
  request: RequestModel | null;
  onClose: () => void;
}

const STAGE_ORDER = ['generated', 'queued', 'assigned', 'processing', 'completed', 'failed', 'timeout', 'retrying'];

export function RequestTimelineModal({ request, onClose }: Props) {
  if (!request) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4,6,9,0.6)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel"
        style={{ width: 380, maxHeight: '70vh', overflowY: 'auto' }}
      >
        <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Request #{request.id}</span>
          <button className="btn" style={{ padding: '2px 8px' }} onClick={onClose}>
            ✕
          </button>
        </div>
        <div style={{ padding: 16, fontSize: 12.5 }}>
          <Row label="Client" value={request.clientId} />
          <Row label="Region" value={request.region} />
          <Row label="Priority" value={request.priority === 'high' ? 'High (VIP)' : 'Low'} />
          <Row label="Retries" value={String(request.retries)} />
          <Row label="Final Stage" value={request.stage} />

          <div style={{ height: 1, background: 'var(--border-soft)', margin: '12px 0' }} />
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>LIFECYCLE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {request.history.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: STAGE_ORDER.includes(h.stage) ? 'var(--accent)' : 'var(--text-faint)',
                    flexShrink: 0,
                  }}
                />
                <span style={{ textTransform: 'capitalize' }}>{h.stage}</span>
                <span style={{ color: 'var(--text-faint)', marginLeft: 'auto' }}>{(h.at / 1000).toFixed(2)}s</span>
                {h.serverId && <span style={{ color: 'var(--text-faint)' }}>{h.serverId}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
      <span style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
