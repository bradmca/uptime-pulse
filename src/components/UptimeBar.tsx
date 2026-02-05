'use client';

import { HourlyStats } from '@/types';
import styles from './UptimeBar.module.css';

interface UptimeBarProps {
  stats: HourlyStats[];
}

export default function UptimeBar({ stats }: UptimeBarProps) {
  return (
    <div className={styles.container}>
      <div className={styles.barContainer}>
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`${styles.segment} ${styles[stat.status]}`}
            title={`${new Date(stat.hour).toLocaleString()} - ${stat.status.replace('-', ' ').toUpperCase()}\nAvg Latency: ${stat.avgLatency}ms`}
          />
        ))}
      </div>
      <div className={styles.legend}>
        <span>24h ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
