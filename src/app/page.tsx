'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import EndpointCard from '@/components/EndpointCard';
import AddEndpointModal from '@/components/AddEndpointModal';
import { Endpoint, EndpointWithStats, DashboardStats, AddEndpointRequest, ApiResponse } from '@/types';
import styles from './page.module.css';

export default function Home() {
  const [endpoints, setEndpoints] = useState<EndpointWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());

  const fetchEndpoints = useCallback(async () => {
    try {
      const response = await fetch('/api/endpoints');
      const data: ApiResponse<EndpointWithStats[]> = await response.json();
      if (data.success && data.data) {
        setEndpoints(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch endpoints:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEndpoints();
    // Refresh every minute
    const interval = setInterval(fetchEndpoints, 60000);
    return () => clearInterval(interval);
  }, [fetchEndpoints]);

  const handleRunChecks = async () => {
    setIsChecking(true);
    try {
      await fetch('/api/check');
      await fetchEndpoints();
    } catch (error) {
      console.error('Failed to run checks:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleAddEndpoint = async (newEndpoint: AddEndpointRequest) => {
    const response = await fetch('/api/endpoints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEndpoint),
    });
    
    const data: ApiResponse<Endpoint> = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to add endpoint');
    }
    
    await fetchEndpoints();
    // Trigger initial check for the new endpoint
    if (data.data?.id) {
      handleRefresh(data.data.id);
    }
  };

  const handleDeleteEndpoint = async (id: string) => {
    if (!confirm('Are you sure you want to delete this endpoint?')) return;
    
    try {
      await fetch(`/api/endpoints/${id}`, { method: 'DELETE' });
      setEndpoints(endpoints.filter(e => e.id !== id));
    } catch (error) {
      console.error('Failed to delete endpoint:', error);
    }
  };

  const handleRefresh = async (id: string) => {
    setRefreshingIds(prev => new Set(prev).add(id));
    try {
      await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointId: id }),
      });
      await fetchEndpoints();
    } catch (error) {
      console.error(`Failed to refresh endpoint ${id}:`, error);
    } finally {
      setRefreshingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Calculate dashboard stats
  const stats: DashboardStats = {
    totalEndpoints: endpoints.length,
    endpointsUp: endpoints.filter(e => e.currentStatus === 'up').length,
    endpointsDown: endpoints.filter(e => e.currentStatus === 'down' || e.currentStatus === 'degraded').length,
    avgUptime24h: endpoints.length > 0
      ? endpoints.reduce((acc, e) => acc + (e.stats?.last24Hours || 0), 0) / endpoints.length
      : 100,
    avgLatency24h: endpoints.length > 0
      ? endpoints.reduce((acc, e) => acc + (e.stats?.avgLatency24h || 0), 0) / endpoints.length
      : 0,
    totalChecksToday: endpoints.reduce((acc, e) => acc + (e.stats?.totalChecks24h || 0), 0),
  };

  return (
    <main className={styles.main}>
      <Header 
        onAddEndpoint={() => setIsModalOpen(true)}
        onRunChecks={handleRunChecks}
        isChecking={isChecking}
      />
      
      <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-2xl)' }}>
        <section className={styles.statsGrid}>
          <StatCard 
            title="Availability"
            value={`${stats.avgUptime24h.toFixed(1)}%`}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
          />
          <StatCard 
            title="Endpoints"
            value={`${stats.endpointsUp}/${stats.totalEndpoints}`}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
          />
          <StatCard 
            title="Avg Latency"
            value={`${Math.round(stats.avgLatency24h)}ms`}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          />
          <StatCard 
            title="Total Checks"
            value={stats.totalChecksToday}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
          />
        </section>

        <section className={styles.endpointSection}>
          <div className={styles.sectionHeader}>
            <h2>Monitored Endpoints</h2>
            {isLoading && <span className="animate-pulse">Loading endpoints...</span>}
          </div>

          <div className="grid grid-2">
            {endpoints.map(endpoint => (
              <EndpointCard 
                key={endpoint.id}
                endpoint={endpoint}
                onDelete={handleDeleteEndpoint}
                onRefresh={handleRefresh}
                isRefreshing={refreshingIds.has(endpoint.id)}
              />
            ))}
            
            {endpoints.length === 0 && !isLoading && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <h3>No endpoints monitored</h3>
                <p>Add your first URL to start monitoring its uptime and latency.</p>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                  Add Endpoint
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <AddEndpointModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddEndpoint}
      />
    </main>
  );
}
