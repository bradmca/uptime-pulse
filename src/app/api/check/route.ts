// API route for triggering health checks
// This can be called by GitHub Actions, cron jobs, or manually

import { NextRequest, NextResponse } from 'next/server';
import { getEndpoints, saveHealthCheck, getLatestHealthCheck, getEndpointById } from '@/lib/storage';
import { checkEndpoint, createHealthCheckRecord } from '@/lib/health-checker';
import { processNotification } from '@/lib/notifications';
import { HealthCheck, ApiResponse } from '@/types';

interface CheckResponse {
  checked: number;
  results: {
    endpointId: string;
    name: string;
    status: 'up' | 'down' | 'degraded';
    latency: number | null;
    error?: string;
  }[];
}

// GET /api/check - Run health checks on all endpoints
export async function GET(): Promise<NextResponse<ApiResponse<CheckResponse>>> {
  try {
    const endpoints = getEndpoints();
    const results: CheckResponse['results'] = [];
    
    for (const endpoint of endpoints) {
      const previousCheck = getLatestHealthCheck(endpoint.id);
      const result = await checkEndpoint(endpoint);
      const healthCheck = createHealthCheckRecord(endpoint.id, result);
      
      saveHealthCheck(healthCheck);
      
      // Process notifications based on status change
      await processNotification(endpoint, healthCheck, previousCheck);
      
      results.push({
        endpointId: endpoint.id,
        name: endpoint.name,
        status: result.status,
        latency: result.latency,
        error: result.error,
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        checked: results.length,
        results,
      },
    });
  } catch (error: unknown) {
    console.error('Error running health checks:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run health checks',
      },
      { status: 500 }
    );
  }
}

// POST /api/check - Run health check on a specific endpoint
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<HealthCheck>>> {
  try {
    const body = await request.json();
    const { endpointId } = body;
    
    if (!endpointId) {
      return NextResponse.json(
        {
          success: false,
          error: 'endpointId is required',
        },
        { status: 400 }
      );
    }
    
    const endpoint = getEndpointById(endpointId);
    
    if (!endpoint) {
      return NextResponse.json(
        {
          success: false,
          error: 'Endpoint not found',
        },
        { status: 404 }
      );
    }
    
    const previousCheck = getLatestHealthCheck(endpoint.id);
    const result = await checkEndpoint(endpoint);
    const healthCheck = createHealthCheckRecord(endpoint.id, result);
    
    saveHealthCheck(healthCheck);
    
    // Process notifications
    await processNotification(endpoint, healthCheck, previousCheck);
    
    return NextResponse.json({
      success: true,
      data: healthCheck,
    });
  } catch (error: unknown) {
    console.error('Error running health check:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run health check',
      },
      { status: 500 }
    );
  }
}
