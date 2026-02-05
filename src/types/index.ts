// Uptime-Pulse Type Definitions

export interface Endpoint {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'HEAD';
  expectedStatusCode: number;
  timeout: number; // in milliseconds
  checkInterval: number; // in minutes
  createdAt: string;
  updatedAt: string;
  notifyOnDown: boolean;
  notifyEmail?: string;
}

export interface HealthCheck {
  id: string;
  endpointId: string;
  timestamp: string;
  status: 'up' | 'down' | 'degraded';
  statusCode: number | null;
  latency: number | null; // in milliseconds
  error?: string;
}

export interface UptimeStats {
  endpointId: string;
  last24Hours: number; // percentage
  last7Days: number; // percentage
  last30Days: number; // percentage
  avgLatency24h: number; // milliseconds
  totalChecks24h: number;
  successfulChecks24h: number;
}

export interface HourlyStats {
  hour: string; // ISO string
  upCount: number;
  downCount: number;
  avgLatency: number;
  status: 'up' | 'down' | 'degraded' | 'no-data';
}

export interface EndpointWithStats extends Endpoint {
  currentStatus: 'up' | 'down' | 'degraded' | 'unknown';
  lastCheck?: HealthCheck;
  stats?: UptimeStats;
  hourlyStats?: HourlyStats[];
}

export interface NotificationSettings {
  email: string;
  webhookUrl?: string;
  notifyOnDown: boolean;
  notifyOnRecovery: boolean;
  cooldownMinutes: number; // prevent spam
}

export interface DashboardStats {
  totalEndpoints: number;
  endpointsUp: number;
  endpointsDown: number;
  avgUptime24h: number;
  avgLatency24h: number;
  totalChecksToday: number;
}

export interface AddEndpointRequest {
  name: string;
  url: string;
  method?: 'GET' | 'POST' | 'HEAD';
  expectedStatusCode?: number;
  timeout?: number;
  checkInterval?: number;
  notifyOnDown?: boolean;
  notifyEmail?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
