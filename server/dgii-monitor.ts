import { EventEmitter } from 'events';

interface DGIIServerStatus {
  isOnline: boolean;
  lastPing: Date | null;
  responseTime: number | null;
  consecutiveFailures: number;
  lastError: string | null;
}

export class DGIIServerMonitor extends EventEmitter {
  private status: DGIIServerStatus;
  private pingInterval: NodeJS.Timeout | null = null;
  private readonly PING_INTERVAL = 60000; // 1 minute
  private readonly MAX_FAILURES = 3;
  private readonly TIMEOUT = 10000; // 10 seconds

  constructor() {
    super();
    this.status = {
      isOnline: false,
      lastPing: null,
      responseTime: null,
      consecutiveFailures: 0,
      lastError: null
    };
  }

  public startMonitoring(): void {
    console.log('[DGII Monitor] Starting DGII server monitoring...');
    
    // Initial ping
    this.performPing();
    
    // Set up periodic pings
    this.pingInterval = setInterval(() => {
      this.performPing();
    }, this.PING_INTERVAL);
  }

  public stopMonitoring(): void {
    console.log('[DGII Monitor] Stopping DGII server monitoring...');
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private async performPing(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test DGII server connectivity
      const response = await this.pingDGIIServer();
      const responseTime = Date.now() - startTime;
      
      const wasOffline = !this.status.isOnline;
      
      this.status = {
        isOnline: true,
        lastPing: new Date(),
        responseTime,
        consecutiveFailures: 0,
        lastError: null
      };

      if (wasOffline) {
        console.log('[DGII Monitor] DGII server is back online');
        this.emit('server_online', this.status);
      }

    } catch (error) {
      this.status.consecutiveFailures++;
      this.status.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.status.lastPing = new Date();
      this.status.responseTime = Date.now() - startTime;

      if (this.status.consecutiveFailures >= this.MAX_FAILURES && this.status.isOnline) {
        this.status.isOnline = false;
        console.log(`[DGII Monitor] DGII server is offline after ${this.MAX_FAILURES} consecutive failures`);
        this.emit('server_offline', this.status);
      }

      console.log(`[DGII Monitor] Ping failed (${this.status.consecutiveFailures}/${this.MAX_FAILURES}): ${this.status.lastError}`);
    }
  }

  private async pingDGIIServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error('Request timeout'));
      }, this.TIMEOUT);

      // Try to access DGII's main website or a known endpoint
      fetch('https://dgii.gov.do', {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Four-One-Solutions-Monitor/1.0'
        }
      })
      .then(response => {
        clearTimeout(timeoutId);
        if (response.ok || response.status === 404) {
          // 404 is acceptable as it means the server is responding
          resolve();
        } else {
          reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
        }
      })
      .catch(error => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          reject(new Error('Request timeout'));
        } else {
          reject(error);
        }
      });
    });
  }

  public getStatus(): DGIIServerStatus {
    return { ...this.status };
  }

  public async testConnection(): Promise<DGIIServerStatus> {
    await this.performPing();
    return this.getStatus();
  }
}

// Global instance
export const dgiiMonitor = new DGIIServerMonitor();