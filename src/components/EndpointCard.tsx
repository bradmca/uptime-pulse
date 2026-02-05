'use client';

import { EndpointWithStats } from '@/types';
import UptimeBar from './UptimeBar';
import styles from './EndpointCard.module.css';

interface EndpointCardProps {
  endpoint: EndpointWithStats;
  onDelete: (id: string) => void;
  onRefresh: (id: string) => void;
  isRefreshing: boolean;
}

export default function EndpointCard({ endpoint, onDelete, onRefresh, isRefreshing }: EndpointCardProps) {
  
  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.header}>
        <div className={styles.mainInfo}>
          <div className={`${styles.statusIndicator} ${styles[endpoint.currentStatus]}`}></div>
          <div className={styles.titleGroup}>
            <h3 className={styles.name}>{endpoint.name}</h3>
            <a href={endpoint.url} target="_blank" rel="noopener noreferrer" className={styles.url}>
              {endpoint.url}
            </a>
          </div>
        </div>
        
        <div className={styles.actions}>
          <button 
            className={styles.iconBtn} 
            onClick={() => onRefresh(endpoint.id)}
            disabled={isRefreshing}
            title="Refresh"
          >
            <svg className={isRefreshing ? styles.spinning : ''} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
            </svg>
          </button>
          <button 
            className={`${styles.iconBtn} ${styles.deleteBtn}`} 
            onClick={() => onDelete(endpoint.id)}
            title="Delete"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
              <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Uptime (24h)</span>
          <span className={`${styles.statValue} ${endpoint.stats && endpoint.stats.last24Hours < 98 ? styles.warning : styles.success}`}>
            {endpoint.stats ? `${endpoint.stats.last24Hours}%` : '--'}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Avg Latency</span>
          <span className={styles.statValue}>
            {endpoint.stats ? `${endpoint.stats.avgLatency24h}ms` : '--'}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Last Check</span>
          <span className={styles.statValue}>
            {endpoint.lastCheck ? new Date(endpoint.lastCheck.timestamp).toLocaleTimeString() : 'Never'}
          </span>
        </div>
      </div>
      
      <div className={styles.uptimeBarWrapper}>
        <UptimeBar stats={endpoint.hourlyStats || []} />
      </div>
      
      {endpoint.lastCheck?.error && (
        <div className={styles.errorBanner}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
          </svg>
          <span>{endpoint.lastCheck.error}</span>
        </div>
      )}
    </div>
  );
}
