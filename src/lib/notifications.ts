// Email notification service for downtime alerts
// In production, integrate with SendGrid, Mailgun, AWS SES, etc.

import { Endpoint, HealthCheck } from '@/types';

interface NotificationPayload {
  endpoint: Endpoint;
  healthCheck: HealthCheck;
  type: 'down' | 'recovery';
}

// Track last notification times to implement cooldown
const lastNotificationTimes: Map<string, number> = new Map();
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown

/**
 * Check if we should send a notification (respecting cooldown)
 */
function shouldNotify(endpointId: string): boolean {
  const lastTime = lastNotificationTimes.get(endpointId);
  if (!lastTime) return true;
  
  return Date.now() - lastTime >= COOLDOWN_MS;
}

/**
 * Send email notification (mock implementation)
 * Replace with actual email service in production
 */
async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  // Log the notification for development
  console.log('\n📧 EMAIL NOTIFICATION');
  console.log('==========================================');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${body}`);
  console.log('==========================================\n');
  
  // In production, implement actual email sending:
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({ to, from: 'alerts@uptime-pulse.com', subject, text: body });
  
  return true;
}

/**
 * Send downtime notification
 */
export async function sendDowntimeNotification(payload: NotificationPayload): Promise<void> {
  const { endpoint, healthCheck } = payload;
  
  if (!endpoint.notifyOnDown || !endpoint.notifyEmail) {
    return;
  }
  
  if (!shouldNotify(endpoint.id)) {
    console.log(`Skipping notification for ${endpoint.name} - cooldown active`);
    return;
  }
  
  const subject = `🔴 Alert: ${endpoint.name} is DOWN`;
  const body = `
Uptime-Pulse Alert
==================

Endpoint: ${endpoint.name}
URL: ${endpoint.url}
Status: DOWN ❌

Details:
- Time: ${new Date(healthCheck.timestamp).toLocaleString()}
- Status Code: ${healthCheck.statusCode || 'N/A'}
- Error: ${healthCheck.error || 'Connection failed'}
- Latency: ${healthCheck.latency ? `${healthCheck.latency}ms` : 'N/A'}

Please investigate this issue immediately.

---
Uptime-Pulse Monitoring System
`.trim();

  const success = await sendEmail(endpoint.notifyEmail, subject, body);
  
  if (success) {
    lastNotificationTimes.set(endpoint.id, Date.now());
  }
}

/**
 * Send recovery notification
 */
export async function sendRecoveryNotification(payload: NotificationPayload): Promise<void> {
  const { endpoint, healthCheck } = payload;
  
  if (!endpoint.notifyOnDown || !endpoint.notifyEmail) {
    return;
  }

  const subject = `✅ Recovery: ${endpoint.name} is back UP`;
  const body = `
Uptime-Pulse Alert
==================

Endpoint: ${endpoint.name}
URL: ${endpoint.url}
Status: UP ✅

The endpoint has recovered and is responding normally.

Details:
- Time: ${new Date(healthCheck.timestamp).toLocaleString()}
- Status Code: ${healthCheck.statusCode}
- Latency: ${healthCheck.latency}ms

---
Uptime-Pulse Monitoring System
`.trim();

  await sendEmail(endpoint.notifyEmail, subject, body);
}

/**
 * Process notification based on status change
 */
export async function processNotification(
  endpoint: Endpoint,
  currentCheck: HealthCheck,
  previousCheck?: HealthCheck
): Promise<void> {
  const wasUp = !previousCheck || previousCheck.status === 'up';
  
  if (wasUp && currentCheck.status !== 'up') {
    // Just went down
    await sendDowntimeNotification({
      endpoint,
      healthCheck: currentCheck,
      type: 'down',
    });
  } else if (!wasUp && currentCheck.status === 'up') {
    // Just recovered
    await sendRecoveryNotification({
      endpoint,
      healthCheck: currentCheck,
      type: 'recovery',
    });
  }
}
