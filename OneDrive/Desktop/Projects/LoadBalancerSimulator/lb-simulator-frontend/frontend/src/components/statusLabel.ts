import { ServerStatus } from '../types';

export const STATUS_LABEL: Record<ServerStatus, string> = {
  healthy: 'Healthy',
  unhealthy: 'Unhealthy',
  recovering: 'Recovering',
  'circuit-open': 'Circuit Open',
  'circuit-half-open': 'Circuit Half-Open',
};
