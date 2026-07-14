import { useState } from 'react';
import { useSimulation } from './simulation/useSimulation';
import { ControlsPanel } from './components/ControlsPanel';
import { ArchitectureView } from './components/ArchitectureView';
import { ServerGrid } from './components/ServerGrid';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { LogPanel } from './components/LogPanel';
import { RequestTimelineModal } from './components/RequestTimelineModal';
import { CompareAlgorithms } from './components/CompareAlgorithms';
import { ALGORITHMS, RequestModel } from './types';

export default function App() {
  const sim = useSimulation();
  const [selectedRequest, setSelectedRequest] = useState<RequestModel | null>(null);

  const algoLabel = ALGORITHMS.find((a) => a.value === sim.config.algorithm)?.label ?? sim.config.algorithm;

  return (
    <div className="app-shell">
      <header style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="eyebrow">Distributed Systems / Interview Prep</div>
          <h1 className="display" style={{ fontSize: 30, margin: '4px 0 6px' }}>
            Load Balancer Simulator
          </h1>
          <div style={{ color: 'var(--text-dim)', fontSize: 13, maxWidth: 560 }}>
            Watch requests get generated, routed, queued, and processed across a fleet of simulated servers —
            switch algorithms, kill a server, or trigger auto scaling and see the traffic map react in real time.
          </div>
        </div>
        <div
          className="panel"
          style={{ padding: '10px 16px', display: 'flex', gap: 18, fontSize: 11, alignItems: 'center' }}
        >
          <span style={{ color: 'var(--text-faint)' }}>SIM CLOCK</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--accent)' }}>
            {(sim.snapshot.now / 1000).toFixed(1)}s
          </span>
          <span style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <span
            style={{
              color: sim.running ? 'var(--healthy)' : 'var(--text-faint)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className={`status-dot ${sim.running ? 'healthy' : 'unhealthy'}`} />
            {sim.running ? 'RUNNING' : 'PAUSED'}
          </span>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>
        <ControlsPanel
          running={sim.running}
          config={sim.config}
          serverCount={sim.snapshot.servers.length}
          onStart={sim.start}
          onPause={sim.pause}
          onReset={sim.reset}
          onAlgorithmChange={sim.setAlgorithm}
          onConfigChange={sim.updateConfig}
          onAddServer={() => sim.addServer()}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ArchitectureView
            servers={sim.snapshot.servers}
            requestsInFlight={sim.snapshot.requestsInFlight}
            onSelectRequest={setSelectedRequest}
            onKill={sim.killServer}
            onRecover={sim.recoverServer}
            onRemove={sim.removeServer}
          />

          <AnalyticsDashboard
            history={sim.snapshot.analyticsHistory}
            servers={sim.snapshot.servers}
            totals={sim.snapshot.totals}
            algorithm={algoLabel}
          />

          <ServerGrid servers={sim.snapshot.servers} onUpdate={sim.updateServer} />

          <LogPanel logs={sim.snapshot.logs} />

          <CompareAlgorithms baseConfig={sim.config} />
        </div>
      </div>

      <RequestTimelineModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />

      <footer style={{ marginTop: 32, fontSize: 10.5, color: 'var(--text-faint)', textAlign: 'center' }}>
        Client-side simulation — no backend required to run this demo. See README.md for the optional Spring Boot REST layer.
      </footer>
    </div>
  );
}
