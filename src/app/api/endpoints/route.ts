// API routes for managing endpoints

import { NextRequest, NextResponse } from 'next/server';
import { getEndpoints, saveEndpoint, getLatestHealthCheck, calculateUptimePercentage, calculateAverageLatency, getRecentHealthChecks } from '@/lib/storage';
import { Endpoint, EndpointWithStats, HourlyStats, AddEndpointRequest, ApiResponse } from '@/types';

// GET /api/endpoints - List all endpoints with their stats
export async function GET(): Promise<NextResponse<ApiResponse<EndpointWithStats[]>>> {
  try {
    const endpoints = getEndpoints();
    
    const endpointsWithStats: EndpointWithStats[] = endpoints.map((endpoint) => {
      const lastCheck = getLatestHealthCheck(endpoint.id);
      const recentChecks = getRecentHealthChecks(endpoint.id, 24);
      
      // Calculate hourly stats for the bar chart
      const hourlyStats: HourlyStats[] = [];
      const now = new Date();
      
      for (let i = 23; i >= 0; i--) {
        const hourStart = new Date(now);
        hourStart.setHours(now.getHours() - i, 0, 0, 0);
        const hourEnd = new Date(hourStart);
        hourEnd.setHours(hourStart.getHours() + 1);
        
        const hourChecks = recentChecks.filter((check) => {
          const checkTime = new Date(check.timestamp);
          return checkTime >= hourStart && checkTime < hourEnd;
        });
        
        const upCount = hourChecks.filter((c) => c.status === 'up').length;
        const downCount = hourChecks.filter((c) => c.status === 'down').length;
        const latencies = hourChecks
          .filter((c) => c.latency !== null)
          .map((c) => c.latency as number);
        const avgLatency = latencies.length > 0
          ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
          : 0;
        
        let status: 'up' | 'down' | 'degraded' | 'no-data' = 'no-data';
        if (hourChecks.length > 0) {
          if (downCount > 0) {
            status = 'down';
          } else if (avgLatency > 2000) {
            status = 'degraded';
          } else {
            status = 'up';
          }
        }
        
        hourlyStats.push({
          hour: hourStart.toISOString(),
          upCount,
          downCount,
          avgLatency,
          status,
        });
      }
      
      return {
        ...endpoint,
        currentStatus: lastCheck?.status || 'unknown',
        lastCheck,
        stats: {
          endpointId: endpoint.id,
          last24Hours: calculateUptimePercentage(endpoint.id, 24),
          last7Days: calculateUptimePercentage(endpoint.id, 24 * 7),
          last30Days: calculateUptimePercentage(endpoint.id, 24 * 30),
          avgLatency24h: calculateAverageLatency(endpoint.id, 24),
          totalChecks24h: recentChecks.length,
          successfulChecks24h: recentChecks.filter((c) => c.status === 'up').length,
        },
        hourlyStats,
      };
    });
    
    return NextResponse.json({
      success: true,
      data: endpointsWithStats,
    });
  } catch (error: unknown) {
    console.error('Error fetching endpoints:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch endpoints',
      },
      { status: 500 }
    );
  }
}

// POST /api/endpoints - Add a new endpoint
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Endpoint>>> {
  try {
    const body: AddEndpointRequest = await request.json();
    
    // Validate required fields
    if (!body.name || !body.url) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and URL are required',
        },
        { status: 400 }
      );
    }
    
    // Validate URL format
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid URL format',
        },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString();
    const endpoint: Endpoint = {
      id: `ep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: body.name.trim(),
      url: body.url.trim(),
      method: body.method || 'GET',
      expectedStatusCode: body.expectedStatusCode || 200,
      timeout: body.timeout || 10000,
      checkInterval: body.checkInterval || 5,
      createdAt: now,
      updatedAt: now,
      notifyOnDown: body.notifyOnDown ?? true,
      notifyEmail: body.notifyEmail,
    };
    
    saveEndpoint(endpoint);
    
    return NextResponse.json({
      success: true,
      data: endpoint,
    });
  } catch (error: unknown) {
    console.error('Error adding endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add endpoint',
      },
      { status: 500 }
    );
  }
}
