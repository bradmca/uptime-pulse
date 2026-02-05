'use client';

import { useState } from 'react';
import styles from './AddEndpointModal.module.css';
import { AddEndpointRequest, Endpoint } from '@/types';

interface AddEndpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddEndpointRequest) => Promise<void>;
}

export default function AddEndpointModal({ isOpen, onClose, onSubmit }: AddEndpointModalProps) {
  const [formData, setFormData] = useState<AddEndpointRequest>({
    name: '',
    url: '',
    method: 'GET',
    expectedStatusCode: 200,
    checkInterval: 5,
    notifyOnDown: true,
    notifyEmail: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit(formData);
      onClose();
      setFormData({
        name: '',
        url: '',
        method: 'GET',
        expectedStatusCode: 200,
        checkInterval: 5,
        notifyOnDown: true,
        notifyEmail: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add endpoint');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Add New Endpoint</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Production API"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className={styles.field}>
            <label>URL</label>
            <input
              type="url"
              className="input"
              placeholder="https://api.example.com/health"
              required
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />
          </div>
          
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Method</label>
              <select
                className="input"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value as Endpoint['method'] })}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="HEAD">HEAD</option>
              </select>
            </div>
            
            <div className={styles.field}>
              <label>Expected Status</label>
              <input
                type="number"
                className="input"
                value={formData.expectedStatusCode}
                onChange={(e) => setFormData({ ...formData, expectedStatusCode: parseInt(e.target.value) })}
              />
            </div>
          </div>
          
          <div className={styles.field}>
            <label>Check Interval (minutes)</label>
            <input
              type="number"
              className="input"
              min="1"
              max="60"
              value={formData.checkInterval}
              onChange={(e) => setFormData({ ...formData, checkInterval: parseInt(e.target.value) })}
            />
          </div>
          
          <div className={styles.field}>
            <label>Notification Email</label>
            <input
              type="email"
              className="input"
              placeholder="devops@example.com"
              value={formData.notifyEmail}
              onChange={(e) => setFormData({ ...formData, notifyEmail: e.target.value })}
            />
          </div>
          
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.footer}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Endpoint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
