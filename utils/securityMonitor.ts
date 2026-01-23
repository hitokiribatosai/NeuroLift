import { authService } from './authService';

export interface SecurityEvent {
  type: 'auth_attempt' | 'auth_success' | 'auth_failure' | 'data_access' | 'suspicious_activity';
  userId?: string;
  details: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent: string;
}

export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 1000;

  private constructor() {
    // Load events from localStorage on initialization
    this.loadEvents();
  }

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  // Log security event
  logEvent(type: SecurityEvent['type'], details: Record<string, any> = {}): void {
    const event: SecurityEvent = {
      type,
      userId: authService.getCurrentUser()?.uid,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    this.events.unshift(event);

    // Keep only the most recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(0, this.MAX_EVENTS);
    }

    // Save to localStorage
    this.saveEvents();

    // In production, also send to monitoring service
    this.reportToMonitoring(event);
  }

  // Get recent security events
  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events.slice(0, limit);
  }

  // Check for suspicious patterns
  detectSuspiciousActivity(): string[] {
    const alerts: string[] = [];
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    // Check for rapid auth failures
    const recentFailures = this.events.filter(event =>
      event.type === 'auth_failure' &&
      new Date(event.timestamp).getTime() > oneHourAgo
    );

    if (recentFailures.length >= 5) {
      alerts.push('Multiple authentication failures detected');
    }

    // Check for unusual login times
    const recentLogins = this.events.filter(event =>
      event.type === 'auth_success' &&
      new Date(event.timestamp).getTime() > oneHourAgo
    );

    if (recentLogins.length > 3) {
      alerts.push('Multiple logins from different locations detected');
    }

    return alerts;
  }

  // Clear old events
  clearOldEvents(daysOld: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    this.events = this.events.filter(event =>
      new Date(event.timestamp) > cutoffDate
    );

    this.saveEvents();
  }

  // Export security report
  exportSecurityReport(): string {
    const report = {
      generatedAt: new Date().toISOString(),
      totalEvents: this.events.length,
      eventsByType: this.groupEventsByType(),
      suspiciousActivity: this.detectSuspiciousActivity(),
      recentEvents: this.getRecentEvents(20)
    };

    return JSON.stringify(report, null, 2);
  }

  private groupEventsByType(): Record<string, number> {
    return this.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private loadEvents(): void {
    try {
      const stored = localStorage.getItem('neuroLift_security_events');
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load security events:', error);
      this.events = [];
    }
  }

  private saveEvents(): void {
    try {
      localStorage.setItem('neuroLift_security_events', JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to save security events:', error);
    }
  }

  private reportToMonitoring(event: SecurityEvent): void {
    // In production, send to monitoring service like Sentry, DataDog, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: send to monitoring service
      // monitoringService.captureEvent('security_event', event);

      // For now, just log critical events
      if (event.type === 'auth_failure' || event.type === 'suspicious_activity') {
        console.warn('Security Event:', event);
      }
    }
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance();