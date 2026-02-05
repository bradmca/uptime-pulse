// API routes for individual endpoint operations

import { NextRequest, NextResponse } from 'next/server';
import { getEndpointById, saveEndpoint, deleteEndpoint } from '@/lib/storage';
import { Endpoint, AddEndpointRequest, ApiResponse } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/endpoints/[id] - Get single endpoint
export async function GET(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse<ApiResponse<Endpoint>>> {
  try {
    const { id } = await context.params;
    const endpoint = getEndpointById(id);
    
    if (!endpoint) {
      return NextResponse.json(
        {
          success: false,
          error: 'Endpoint not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: endpoint,
    });
  } catch (error) {
    console.error('Error fetching endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch endpoint',
      },
      { status: 500 }
    );
  }
}

// PUT /api/endpoints/[id] - Update endpoint
export async function PUT(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse<ApiResponse<Endpoint>>> {
  try {
    const { id } = await context.params;
    const body: Partial<AddEndpointRequest> = await request.json();
    
    const endpoint = getEndpointById(id);
    
    if (!endpoint) {
      return NextResponse.json(
        {
          success: false,
          error: 'Endpoint not found',
        },
        { status: 404 }
      );
    }
    
    // Validate URL if provided
    if (body.url) {
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
    }
    
    const updatedEndpoint: Endpoint = {
      ...endpoint,
      name: body.name?.trim() || endpoint.name,
      url: body.url?.trim() || endpoint.url,
      method: body.method || endpoint.method,
      expectedStatusCode: body.expectedStatusCode ?? endpoint.expectedStatusCode,
      timeout: body.timeout ?? endpoint.timeout,
      checkInterval: body.checkInterval ?? endpoint.checkInterval,
      notifyOnDown: body.notifyOnDown ?? endpoint.notifyOnDown,
      notifyEmail: body.notifyEmail !== undefined ? body.notifyEmail : endpoint.notifyEmail,
      updatedAt: new Date().toISOString(),
    };
    
    saveEndpoint(updatedEndpoint);
    
    return NextResponse.json({
      success: true,
      data: updatedEndpoint,
    });
  } catch (error) {
    console.error('Error updating endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update endpoint',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/endpoints/[id] - Delete endpoint
export async function DELETE(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const { id } = await context.params;
    const deleted = deleteEndpoint(id);
    
    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Endpoint not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete endpoint',
      },
      { status: 500 }
    );
  }
}
