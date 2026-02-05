// Health checking logic for pinging endpoints

import { Endpoint, HealthCheck } from '@/types';

export interface CheckResult {
  status: 'up' | 'down' | 'degraded';
  statusCode: number | null;
  latency: number | null;
  error?: string;
}

/**
 * Perform a health check on an endpoint
 */
export async function checkEndpoint(endpoint: Endpoint): Promise<CheckResult> {
  const startTime = performance.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);
    
    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Uptime-Pulse/1.0',
        'Accept': '*/*',
      },
      // Don't follow redirects for HEAD requests
      redirect: endpoint.method === 'HEAD' ? 'manual' : 'follow',
    });
    
    clearTimeout(timeoutId);
    
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);
    
    const statusCode = response.status;
    
    // Check if status code matches expected
    const isExpectedStatus = statusCode === endpoint.expectedStatusCode || 
      (endpoint.expectedStatusCode === 200 && statusCode >= 200 && statusCode < 300);
    
    // Determine status based on response
    let status: 'up' | 'down' | 'degraded' = 'up';
    
    if (!isExpectedStatus) {
      status = 'down';
    } else if (latency > 2000) {
      // Latency over 2 seconds is considered degraded
      status = 'degraded';
    }
    
    return {
      status,
      statusCode,
      latency,
      error: !isExpectedStatus ? `Unexpected status code: ${statusCode}` : undefined,
    };
  } catch (error) {
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);
    
    let errorMessage = 'Unknown error';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = `Timeout after ${endpoint.timeout}ms`;
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      status: 'down',
      statusCode: null,
      latency,
      error: errorMessage,
    };
  }
}

/**
 * Create a HealthCheck record from a CheckResult
 */
export function createHealthCheckRecord(
  endpointId: string,
  result: CheckResult
): HealthCheck {
  return {
    id: `hc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    endpointId,
    timestamp: new Date().toISOString(),
    status: result.status,
    statusCode: result.statusCode,
    latency: result.latency,
    error: result.error,
  };
}

/**
 * Run health checks on multiple endpoints
 */
export async function checkMultipleEndpoints(
  endpoints: Endpoint[]
): Promise<Map<string, CheckResult>> {
  const results = new Map<string, CheckResult>();
  
  // Run checks in parallel with a concurrency limit
  const CONCURRENCY = 5;
  
  for (let i = 0; i < endpoints.length; i += CONCURRENCY) {
    const batch = endpoints.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (endpoint) => {
        const result = await checkEndpoint(endpoint);
        return { id: endpoint.id, result };
      })
    );
    
    batchResults.forEach(({ id, result }) => {
      results.set(id, result);
    });
  }
  
  return results;
}
