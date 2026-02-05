// Simple JSON file-based storage for endpoints and health checks
// In production, replace with a proper database (PostgreSQL, MongoDB, etc.)

import fs from 'fs';
import path from 'path';
import { Endpoint, HealthCheck } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const ENDPOINTS_FILE = path.join(DATA_DIR, 'endpoints.json');
const HEALTH_CHECKS_FILE = path.join(DATA_DIR, 'health-checks.json');

// Ensure data directory exists
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Read JSON file safely
function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    ensureDataDir();
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultValue;
  }
}

// Write JSON file safely
function writeJsonFile<T>(filePath: string, data: T): void {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Endpoint operations
export function getEndpoints(): Endpoint[] {
  return readJsonFile<Endpoint[]>(ENDPOINTS_FILE, []);
}

export function getEndpointById(id: string): Endpoint | undefined {
  const endpoints = getEndpoints();
  return endpoints.find(e => e.id === id);
}

export function saveEndpoint(endpoint: Endpoint): void {
  const endpoints = getEndpoints();
  const index = endpoints.findIndex(e => e.id === endpoint.id);
  
  if (index >= 0) {
    endpoints[index] = endpoint;
  } else {
    endpoints.push(endpoint);
  }
  
  writeJsonFile(ENDPOINTS_FILE, endpoints);
}

export function deleteEndpoint(id: string): boolean {
  const endpoints = getEndpoints();
  const filtered = endpoints.filter(e => e.id !== id);
  
  if (filtered.length === endpoints.length) {
    return false;
  }
  
  writeJsonFile(ENDPOINTS_FILE, filtered);
  
  // Also delete associated health checks
  const healthChecks = getHealthChecks();
  const filteredChecks = healthChecks.filter(hc => hc.endpointId !== id);
  writeJsonFile(HEALTH_CHECKS_FILE, filteredChecks);
  
  return true;
}

// Health check operations
export function getHealthChecks(): HealthCheck[] {
  return readJsonFile<HealthCheck[]>(HEALTH_CHECKS_FILE, []);
}

export function getHealthChecksByEndpointId(endpointId: string): HealthCheck[] {
  const healthChecks = getHealthChecks();
  return healthChecks.filter(hc => hc.endpointId === endpointId);
}

export function getRecentHealthChecks(endpointId: string, hours: number = 24): HealthCheck[] {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const checks = getHealthChecksByEndpointId(endpointId);
  return checks.filter(hc => hc.timestamp >= cutoff).sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export function saveHealthCheck(healthCheck: HealthCheck): void {
  const healthChecks = getHealthChecks();
  healthChecks.push(healthCheck);
  
  // Keep only last 7 days of checks to prevent file from growing too large
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const filtered = healthChecks.filter(hc => hc.timestamp >= cutoff);
  
  writeJsonFile(HEALTH_CHECKS_FILE, filtered);
}

export function getLatestHealthCheck(endpointId: string): HealthCheck | undefined {
  const checks = getHealthChecksByEndpointId(endpointId);
  if (checks.length === 0) return undefined;
  
  return checks.reduce((latest, current) => 
    new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
  );
}

// Stats calculations
export function calculateUptimePercentage(endpointId: string, hours: number): number {
  const checks = getRecentHealthChecks(endpointId, hours);
  if (checks.length === 0) return 100;
  
  const upChecks = checks.filter(c => c.status === 'up').length;
  return Math.round((upChecks / checks.length) * 100 * 100) / 100;
}

export function calculateAverageLatency(endpointId: string, hours: number): number {
  const checks = getRecentHealthChecks(endpointId, hours);
  const validChecks = checks.filter(c => c.latency !== null && c.latency > 0);
  
  if (validChecks.length === 0) return 0;
  
  const total = validChecks.reduce((sum, c) => sum + (c.latency || 0), 0);
  return Math.round(total / validChecks.length);
}
