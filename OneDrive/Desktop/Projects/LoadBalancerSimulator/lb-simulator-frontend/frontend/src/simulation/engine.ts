import {
  Algorithm,
  AnalyticsSnapshot,
  LogEntry,
  Priority,
  Region,
  RequestModel,
  RequestStage,
  ServerModel,
  ServerStatus,
  SimulationConfig,
} from '../types';

const REGIONS: Region[] = ['asia', 'europe', 'america'];
const REGION_BASE_LATENCY: Record<Region, number> = { asia: 20, europe: 60, america: 150 };

const CLIENT_POOL = Array.from({ length: 14 }, (_, i) => `client-${i + 1}`);
const VIP_CLIENTS = new Set(['client-1', 'client-4']);

let requestIdSeq = 1;
let logIdSeq = 1;
let serverIdSeq = 1;

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function makeServer(name: string, region: Region, processingMs = 100, capacity = 100): ServerModel {
  return {
    id: `srv-${serverIdSeq++}`,
    name,
    region,
    status: 'healthy',
    cpu: 5,
    memory: 10,
    queue: [],
    capacity,
    processingMs,
    weight: 1,
    latencyMs: REGION_BASE_LATENCY[region],
    totalCompleted: 0,
    totalFailed: 0,
    consecutiveFailures: 0,
    circuitOpenedAt: null,
  };
}

export function defaultConfig(): SimulationConfig {
  return {
    requestsPerSec: 15,
    loadPattern: 'constant',
    algorithm: 'round-robin',
    autoScaling: false,
    stickySessions: false,
    retryEnabled: true,
    rateLimitPerSec: 0,
    requestTimeoutMs: 5000,
    circuitBreakerThreshold: 4,
    circuitBreakerCooldownMs: 6000,
  };
}

export interface EngineSnapshot {
  now: number;
  servers: ServerModel[];
  logs: LogEntry[];
  requestsInFlight: RequestModel[];
  completedRecent: RequestModel[];
  analyticsHistory: AnalyticsSnapshot[];
  totals: {
    generated: number;
    completed: number;
    failed: number;
    retried: number;
  };
  rrPointer: number;
}

/**
 * SimulationEngine owns all mutable simulation state and advances it via tick(dtMs).
 * It is intentionally framework-agnostic (no React) so it can be unit tested or reused.
 */
export class SimulationEngine {
  now = 0;
  servers: ServerModel[] = [];
  logs: LogEntry[] = [];
  requestsInFlight: RequestModel[] = [];
  completedRecent: RequestModel[] = [];
  analyticsHistory: AnalyticsSnapshot[] = [];
  config: SimulationConfig;
  running = false;

  private genAccumulator = 0;
  private rrPointer = 0;
  private wrrCounter = 0;
  private stickyMap = new Map<string, string>();
  private clientRateWindow = new Map<string, { windowStart: number; count: number }>();
  private lastAnalyticsAt = 0;
  private lastAutoScaleAt = 0;
  private burstUntil = 0;
  private burstCooldownUntil = 0;
  private allRequestsCompleted: { responseMs: number; at: number }[] = [];

  constructor(config?: SimulationConfig) {
    this.config = config ?? defaultConfig();
    this.servers = [
      makeServer('Server A', 'asia', 80, 120),
      makeServer('Server B', 'europe', 150, 100),
      makeServer('Server C', 'america', 110, 100),
    ];
  }

  log(text: string, level: LogEntry['level'] = 'info') {
    this.logs.push({ id: logIdSeq++, at: Math.round(this.now), text, level });
    if (this.logs.length > 300) this.logs.splice(0, this.logs.length - 300);
  }

  reset() {
    this.now = 0;
    this.logs = [];
    this.requestsInFlight = [];
    this.completedRecent = [];
    this.analyticsHistory = [];
    this.allRequestsCompleted = [];
    this.genAccumulator = 0;
    this.rrPointer = 0;
    this.wrrCounter = 0;
    this.stickyMap.clear();
    this.clientRateWindow.clear();
    this.servers = [
      makeServer('Server A', 'asia', 80, 120),
      makeServer('Server B', 'europe', 150, 100),
      makeServer('Server C', 'america', 110, 100),
    ];
    this.log('Simulation reset.');
  }

  addServer(region: Region = REGIONS[Math.floor(Math.random() * REGIONS.length)]) {
    const s = makeServer(`Server ${this.servers.length + 1}`, region, 90 + Math.round(Math.random() * 80), 100);
    this.servers.push(s);
    this.log(`${s.name} added (${region}). Rebalancing traffic.`);
    return s;
  }

  removeServer(id: string) {
    const idx = this.servers.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const [removed] = this.servers.splice(idx, 1);
    // Fail/reroute anything left in its queue.
    for (const r of removed.queue) {
      this.failOrRetry(r, 'Server removed while request was in flight');
    }
    this.log(`${removed.name} removed.`, 'warn');
  }

  killServer(id: string) {
    const s = this.servers.find((s) => s.id === id);
    if (!s) return;
    s.status = 'unhealthy';
    const inQueue = [...s.queue];
    s.queue = [];
    for (const r of inQueue) {
      this.failOrRetry(r, `${s.name} killed mid-flight`);
    }
    this.log(`${s.name} killed. Requests rerouting; queue migrated.`, 'error');
  }

  recoverServer(id: string) {
    const s = this.servers.find((s) => s.id === id);
    if (!s) return;
    s.status = 'recovering';
    s.consecutiveFailures = 0;
    s.circuitOpenedAt = null;
    this.log(`${s.name} recovering...`);
    setTimeoutSim(this, 1200, () => {
      if (s.status === 'recovering') {
        s.status = 'healthy';
        this.log(`${s.name} is healthy again.`);
      }
    });
  }

  setAlgorithm(algo: Algorithm) {
    this.config.algorithm = algo;
    this.log(`Algorithm switched to "${algo}".`);
  }

  updateConfig(patch: Partial<SimulationConfig>) {
    this.config = { ...this.config, ...patch };
  }

  updateServer(id: string, patch: Partial<Pick<ServerModel, 'processingMs' | 'capacity' | 'weight' | 'latencyMs'>>) {
    const s = this.servers.find((s) => s.id === id);
    if (!s) return;
    Object.assign(s, patch);
  }

  private candidateServers(): ServerModel[] {
    return this.servers.filter((s) => s.status === 'healthy' || s.status === 'recovering' || s.status === 'circuit-half-open');
  }

  private pickServer(req: RequestModel): ServerModel | null {
    let pool = this.candidateServers();
    if (pool.length === 0) return null;

    // Sticky sessions take priority if enabled and the sticky target is still viable.
    if (this.config.stickySessions) {
      const sticky = this.stickyMap.get(req.clientId);
      if (sticky) {
        const target = pool.find((s) => s.id === sticky);
        if (target) return target;
      }
    }

    // Simple geographic preference: prefer same-region servers when available.
    const sameRegion = pool.filter((s) => s.region === req.region);
    if (sameRegion.length > 0) pool = sameRegion;

    let chosen: ServerModel;
    switch (this.config.algorithm) {
      case 'round-robin': {
        this.rrPointer = this.rrPointer % pool.length;
        chosen = pool[this.rrPointer];
        this.rrPointer++;
        break;
      }
      case 'random': {
        chosen = pool[Math.floor(Math.random() * pool.length)];
        break;
      }
      case 'least-connections': {
        chosen = pool.reduce((a, b) => (b.queue.length < a.queue.length ? b : a));
        break;
      }
      case 'least-response-time': {
        chosen = pool.reduce((a, b) => {
          const aScore = a.processingMs + a.latencyMs + a.queue.length * a.processingMs;
          const bScore = b.processingMs + b.latencyMs + b.queue.length * b.processingMs;
          return bScore < aScore ? b : a;
        });
        break;
      }
      case 'ip-hash': {
        const idx = hashString(req.clientId) % pool.length;
        chosen = pool[idx];
        break;
      }
      case 'weighted-round-robin': {
        const totalWeight = pool.reduce((sum, s) => sum + s.weight, 0);
        this.wrrCounter = (this.wrrCounter + 1) % Math.max(1, totalWeight);
        let acc = 0;
        chosen = pool[0];
        for (const s of pool) {
          acc += s.weight;
          if (this.wrrCounter < acc) {
            chosen = s;
            break;
          }
        }
        break;
      }
      case 'weighted-least-connections': {
        chosen = pool.reduce((a, b) => {
          const aScore = a.queue.length / Math.max(1, a.weight);
          const bScore = b.queue.length / Math.max(1, b.weight);
          return bScore < aScore ? b : a;
        });
        break;
      }
      default:
        chosen = pool[0];
    }

    if (this.config.stickySessions) this.stickyMap.set(req.clientId, chosen.id);
    return chosen;
  }

  private rateLimited(clientId: string): boolean {
    if (!this.config.rateLimitPerSec || this.config.rateLimitPerSec <= 0) return false;
    const w = this.clientRateWindow.get(clientId);
    if (!w || this.now - w.windowStart > 1000) {
      this.clientRateWindow.set(clientId, { windowStart: this.now, count: 1 });
      return false;
    }
    w.count++;
    return w.count > this.config.rateLimitPerSec;
  }

  private failOrRetry(req: RequestModel, reason: string) {
    if (this.config.retryEnabled && req.retries < 3) {
      req.retries++;
      req.stage = 'retrying';
      req.assignedServerId = null;
      req.history.push({ stage: 'retrying', at: this.now });
      this.log(`Request #${req.id} retrying (attempt ${req.retries}) — ${reason}`, 'warn');
      this.requestsInFlight.push(req);
    } else {
      req.stage = 'failed';
      req.completionTime = this.now;
      req.history.push({ stage: 'failed', at: this.now });
      this.log(`Request #${req.id} failed permanently — ${reason}`, 'error');
      this.completedRecent.push(req);
    }
  }

  private spawnRequest() {
    const clientId = CLIENT_POOL[Math.floor(Math.random() * CLIENT_POOL.length)];
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const priority: Priority = VIP_CLIENTS.has(clientId) ? 'high' : 'low';

    if (this.rateLimited(clientId)) {
      this.log(`Request from ${clientId} rejected — 429 Too Many Requests`, 'warn');
      return;
    }

    const req: RequestModel = {
      id: requestIdSeq++,
      clientId,
      region,
      arrivalTime: this.now,
      priority,
      assignedServerId: null,
      stage: 'generated',
      remainingMs: 0,
      totalProcessingMs: 0,
      completionTime: null,
      retries: 0,
      history: [{ stage: 'generated', at: this.now }],
    };
    this.requestsInFlight.push(req);
  }

  private assignPending() {
    // High priority first.
    this.requestsInFlight.sort((a, b) => {
      if (a.priority === b.priority) return a.arrivalTime - b.arrivalTime;
      return a.priority === 'high' ? -1 : 1;
    });

    const stillPending: RequestModel[] = [];
    for (const req of this.requestsInFlight) {
      if (req.stage !== 'generated' && req.stage !== 'retrying') {
        stillPending.push(req);
        continue;
      }
      const server = this.pickServer(req);
      if (!server) {
        stillPending.push(req); // no healthy servers available yet
        continue;
      }
      req.assignedServerId = server.id;
      req.stage = 'queued';
      req.history.push({ stage: 'queued', at: this.now, serverId: server.id });
      server.queue.push(req);
      this.log(`Request #${req.id} → ${server.name}${req.priority === 'high' ? ' (VIP)' : ''}`);
    }
    this.requestsInFlight = stillPending;
  }

  private processServers(dtMs: number) {
    for (const server of this.servers) {
      if (server.status === 'unhealthy') continue;

      // Concurrency: how many requests this server can actively process at once.
      const concurrency = Math.max(1, Math.round(server.capacity / 20));
      const active = server.queue.slice(0, concurrency);

      for (const req of active) {
        if (req.stage === 'queued') {
          req.stage = 'processing';
          req.totalProcessingMs = server.processingMs * (0.8 + Math.random() * 0.4);
          req.remainingMs = req.totalProcessingMs;
          req.history.push({ stage: 'processing', at: this.now, serverId: server.id });
        }

        // Timeout check (based on total time since arrival).
        if (this.now - req.arrivalTime > this.config.requestTimeoutMs) {
          server.queue = server.queue.filter((r) => r.id !== req.id);
          req.stage = 'timeout';
          req.history.push({ stage: 'timeout', at: this.now, serverId: server.id });
          this.log(`Request #${req.id} timed out on ${server.name}`, 'error');
          server.totalFailed++;
          this.bumpCircuitFailure(server);
          this.completedRecent.push(req);
          continue;
        }

        req.remainingMs -= dtMs;

        // Small chance of a transient failure while processing (feeds circuit breaker).
        const transientFailChance = server.status === 'circuit-half-open' ? 0.15 : 0.01;
        if (req.remainingMs <= 0) {
          if (Math.random() < transientFailChance) {
            server.queue = server.queue.filter((r) => r.id !== req.id);
            server.totalFailed++;
            this.bumpCircuitFailure(server);
            this.failOrRetry(req, `transient failure on ${server.name}`);
            continue;
          }
          server.queue = server.queue.filter((r) => r.id !== req.id);
          req.stage = 'completed';
          req.completionTime = this.now;
          req.history.push({ stage: 'completed', at: this.now, serverId: server.id });
          server.totalCompleted++;
          server.consecutiveFailures = 0;
          if (server.status === 'circuit-half-open') {
            server.status = 'healthy';
            this.log(`${server.name} circuit closed — recovered.`);
          }
          this.allRequestsCompleted.push({ responseMs: this.now - req.arrivalTime, at: this.now });
          this.completedRecent.push(req);
        }
      }

      // Simulated CPU/memory based on load relative to capacity.
      const loadRatio = Math.min(1.4, server.queue.length / Math.max(1, server.capacity / 10));
      const targetCpu = Math.min(100, loadRatio * 85 + Math.random() * 8);
      server.cpu = server.cpu + (targetCpu - server.cpu) * 0.2;
      server.memory = Math.min(100, server.memory + (Math.min(100, loadRatio * 70) - server.memory) * 0.1);

      // Circuit breaker cooldown -> half-open trial.
      if (server.status === 'circuit-open' && server.circuitOpenedAt !== null) {
        if (this.now - server.circuitOpenedAt > this.config.circuitBreakerCooldownMs) {
          server.status = 'circuit-half-open';
          this.log(`${server.name} circuit half-open — testing traffic.`);
        }
      }
    }

    // Trim completedRecent to keep memory bounded.
    if (this.completedRecent.length > 100) {
      this.completedRecent.splice(0, this.completedRecent.length - 100);
    }
  }

  private bumpCircuitFailure(server: ServerModel) {
    server.consecutiveFailures++;
    if (server.consecutiveFailures >= this.config.circuitBreakerThreshold && server.status !== 'circuit-open') {
      server.status = 'circuit-open';
      server.circuitOpenedAt = this.now;
      this.log(`${server.name} circuit breaker OPEN — traffic paused.`, 'error');
    }
  }

  private autoScale() {
    if (!this.config.autoScaling) return;
    if (this.now - this.lastAutoScaleAt < 4000) return;
    const healthy = this.servers.filter((s) => s.status === 'healthy');
    if (healthy.length === 0) return;
    const avgCpu = healthy.reduce((sum, s) => sum + s.cpu, 0) / healthy.length;
    if (avgCpu > 80 && this.servers.length < 8) {
      this.addServer();
      this.log(`Auto Scaling: average CPU ${avgCpu.toFixed(0)}% > 80% — new server created.`, 'warn');
      this.lastAutoScaleAt = this.now;
    }
  }

  private recordAnalytics() {
    if (this.now - this.lastAnalyticsAt < 1000) return;
    this.lastAnalyticsAt = this.now;
    const recentWindow = this.allRequestsCompleted.filter((r) => this.now - r.at < 5000);
    const avgResponseMs = recentWindow.length ? recentWindow.reduce((s, r) => s + r.responseMs, 0) / recentWindow.length : 0;
    const queueLength = this.servers.reduce((s, srv) => s + srv.queue.length, 0);
    const healthy = this.servers.filter((s) => s.status === 'healthy' || s.status === 'circuit-half-open');
    const avgCpu = healthy.length ? healthy.reduce((s, srv) => s + srv.cpu, 0) / healthy.length : 0;
    const failedRecent = this.completedRecent.filter((r) => (r.stage === 'failed' || r.stage === 'timeout') && this.now - (r.completionTime ?? 0) < 5000).length;

    this.analyticsHistory.push({
      t: Math.round(this.now / 1000),
      requestsPerSec: this.config.requestsPerSec,
      avgResponseMs: Math.round(avgResponseMs),
      throughput: recentWindow.length,
      queueLength,
      activeServers: healthy.length,
      avgCpu: Math.round(avgCpu),
      failedRequests: failedRecent,
    });
    if (this.analyticsHistory.length > 60) this.analyticsHistory.splice(0, this.analyticsHistory.length - 60);
  }

  private effectiveRps(): number {
    const base = this.config.requestsPerSec;
    if (this.config.loadPattern === 'constant') return base;
    if (this.config.loadPattern === 'random') return base * (0.4 + Math.random() * 1.3);
    // burst pattern: alternate quiet periods with 3x spikes
    if (this.now > this.burstCooldownUntil) {
      this.burstUntil = this.now + 1500;
      this.burstCooldownUntil = this.now + 1500 + 2500 + Math.random() * 2000;
    }
    return this.now < this.burstUntil ? base * 3 : base * 0.3;
  }

  tick(dtMs: number) {
    if (!this.running) return;
    this.now += dtMs;

    const rps = this.effectiveRps();
    this.genAccumulator += (rps * dtMs) / 1000;
    while (this.genAccumulator >= 1) {
      this.spawnRequest();
      this.genAccumulator -= 1;
    }

    this.assignPending();
    this.processServers(dtMs);
    this.autoScale();
    this.recordAnalytics();
  }

  /** Aggregate stats over the whole run so far — used by the algorithm comparison tool. */
  getStats() {
    const completed = this.allRequestsCompleted.length;
    const avgResponseMs = completed ? this.allRequestsCompleted.reduce((s, r) => s + r.responseMs, 0) / completed : 0;
    const failed = this.completedRecent.filter((r) => r.stage === 'failed' || r.stage === 'timeout').length;
    return { completed, avgResponseMs, failed };
  }

  snapshot(): EngineSnapshot {
    return {
      now: this.now,
      servers: this.servers,
      logs: this.logs,
      requestsInFlight: this.requestsInFlight,
      completedRecent: this.completedRecent,
      analyticsHistory: this.analyticsHistory,
      totals: {
        generated: requestIdSeq - 1,
        completed: this.allRequestsCompleted.length,
        failed: this.completedRecent.filter((r) => r.stage === 'failed' || r.stage === 'timeout').length,
        retried: this.completedRecent.filter((r) => r.retries > 0).length,
      },
      rrPointer: this.rrPointer,
    };
  }
}

// Minimal simulated-timer helper so recovery delays respect the sim clock
// rather than wall-clock time (keeps behavior consistent if the tab is throttled).
function setTimeoutSim(engine: SimulationEngine, delayMs: number, cb: () => void) {
  const target = engine.now + delayMs;
  const check = () => {
    if (engine.now >= target) {
      cb();
    } else {
      requestAnimationFrame(check);
    }
  };
  requestAnimationFrame(check);
}
