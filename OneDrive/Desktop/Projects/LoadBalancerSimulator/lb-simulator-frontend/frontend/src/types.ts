export type Algorithm =
  | 'round-robin'
  | 'least-connections'
  | 'least-response-time'
  | 'random'
  | 'weighted-round-robin'
  | 'ip-hash'
  | 'weighted-least-connections';

export const ALGORITHMS: { value: Algorithm; label: string }[] = [
  { value: 'round-robin', label: 'Round Robin' },
  { value: 'least-connections', label: 'Least Connections' },
  { value: 'least-response-time', label: 'Least Response Time' },
  { value: 'random', label: 'Random' },
  { value: 'weighted-round-robin', label: 'Weighted Round Robin' },
  { value: 'ip-hash', label: 'IP Hash' },
  { value: 'weighted-least-connections', label: 'Weighted Least Connections' },
];

export type ServerStatus = 'healthy' | 'unhealthy' | 'recovering' | 'circuit-open' | 'circuit-half-open';

export type Region = 'asia' | 'europe' | 'america';

export interface ServerModel {
  id: string;
  name: string;
  region: Region;
  status: ServerStatus;
  cpu: number; // 0-100 simulated
  memory: number; // 0-100 simulated
  queue: RequestModel[];
  capacity: number; // req/sec the server can sustain before its queue grows unbounded
  processingMs: number; // baseline ms/request
  weight: number; // for weighted algorithms
  latencyMs: number; // simulated network latency to this server's region
  totalCompleted: number;
  totalFailed: number;
  consecutiveFailures: number;
  circuitOpenedAt: number | null;
  currentClientId?: string; // for sticky session display
}

export type RequestStage = 'generated' | 'queued' | 'assigned' | 'processing' | 'completed' | 'failed' | 'timeout' | 'retrying';

export type Priority = 'high' | 'low';

export interface RequestModel {
  id: number;
  clientId: string;
  region: Region;
  arrivalTime: number; // ms timestamp (sim clock)
  priority: Priority;
  assignedServerId: string | null;
  stage: RequestStage;
  remainingMs: number; // time left to finish processing
  totalProcessingMs: number;
  completionTime: number | null;
  retries: number;
  history: { stage: RequestStage; at: number; serverId?: string }[];
}

export interface LogEntry {
  id: number;
  at: number;
  text: string;
  level: 'info' | 'warn' | 'error';
}

export type LoadPattern = 'constant' | 'burst' | 'random';

export interface SimulationConfig {
  requestsPerSec: number;
  loadPattern: LoadPattern;
  algorithm: Algorithm;
  autoScaling: boolean;
  stickySessions: boolean;
  retryEnabled: boolean;
  rateLimitPerSec: number; // per-client rate limit; 0 = disabled
  requestTimeoutMs: number;
  circuitBreakerThreshold: number; // consecutive failures before opening circuit
  circuitBreakerCooldownMs: number;
}

export interface AnalyticsSnapshot {
  t: number;
  requestsPerSec: number;
  avgResponseMs: number;
  throughput: number;
  queueLength: number;
  activeServers: number;
  avgCpu: number;
  failedRequests: number;
}
