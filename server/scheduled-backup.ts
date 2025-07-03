import { backupService } from './backup-service';
import { storage } from './storage';

export class ScheduledBackupService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    console.log('[Backup Scheduler] Initializing automatic backup system...');
    
    try {
      // Get backup configuration
      const backupConfig = await this.getBackupConfiguration();
      
      if (backupConfig.auto_enabled) {
        await this.startAutomaticBackups(backupConfig.frequency_hours);
        console.log(`[Backup Scheduler] Automatic backups enabled - every ${backupConfig.frequency_hours} hours`);
      } else {
        console.log('[Backup Scheduler] Automatic backups disabled');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('[Backup Scheduler] Failed to initialize:', error);
    }
  }

  async startAutomaticBackups(frequencyHours: number = 24) {
    // Clear existing interval if any
    this.stopAutomaticBackups();

    const intervalMs = frequencyHours * 60 * 60 * 1000; // Convert hours to milliseconds
    
    // Create first backup immediately
    setTimeout(async () => {
      await this.performScheduledBackup();
    }, 5000); // Wait 5 seconds after startup

    // Schedule recurring backups
    const interval = setInterval(async () => {
      await this.performScheduledBackup();
    }, intervalMs);

    this.intervals.set('full_backup', interval);
    
    console.log(`[Backup Scheduler] Scheduled full backups every ${frequencyHours} hours`);

    // Also schedule incremental backups every 6 hours if full backups are less frequent
    if (frequencyHours > 6) {
      const incrementalInterval = setInterval(async () => {
        await this.performScheduledIncrementalBackup();
      }, 6 * 60 * 60 * 1000); // Every 6 hours

      this.intervals.set('incremental_backup', incrementalInterval);
      console.log('[Backup Scheduler] Scheduled incremental backups every 6 hours');
    }
  }

  stopAutomaticBackups() {
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`[Backup Scheduler] Stopped ${name} schedule`);
    }
    this.intervals.clear();
  }

  async performScheduledBackup(): Promise<void> {
    try {
      console.log('[Backup Scheduler] Starting scheduled full backup...');
      
      const systemUserId = 'system-scheduler';
      const description = `Scheduled automatic backup - ${new Date().toISOString()}`;
      
      const backup = await backupService.createFullBackup(systemUserId, description);
      
      console.log(`[Backup Scheduler] Full backup completed: ${backup.name} (${this.formatFileSize(backup.size)})`);
      
      // Clean up old backups (keep last 10 full backups)
      await this.cleanupOldBackups();
      
    } catch (error) {
      console.error('[Backup Scheduler] Failed to create scheduled backup:', error);
    }
  }

  async performScheduledIncrementalBackup(): Promise<void> {
    try {
      console.log('[Backup Scheduler] Starting scheduled incremental backup...');
      
      const systemUserId = 'system-scheduler';
      const since = new Date(Date.now() - 6 * 60 * 60 * 1000); // Last 6 hours
      
      const backup = await backupService.createIncrementalBackup(systemUserId, since);
      
      console.log(`[Backup Scheduler] Incremental backup completed: ${backup.name} (${this.formatFileSize(backup.size)})`);
      
    } catch (error) {
      console.error('[Backup Scheduler] Failed to create incremental backup:', error);
    }
  }

  async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await backupService.listBackups();
      const fullBackups = backups.filter(b => b.type === 'full').sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      // Keep last 10 full backups, delete older ones
      const maxFullBackups = 10;
      if (fullBackups.length > maxFullBackups) {
        const backupsToDelete = fullBackups.slice(maxFullBackups);
        
        for (const backup of backupsToDelete) {
          try {
            await backupService.deleteBackup(backup.id, 'system-cleanup');
            console.log(`[Backup Scheduler] Cleaned up old backup: ${backup.name}`);
          } catch (error) {
            console.error(`[Backup Scheduler] Failed to delete backup ${backup.name}:`, error);
          }
        }
      }

      // Clean up incremental backups older than 7 days
      const incrementalBackups = backups.filter(b => b.type === 'incremental');
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      for (const backup of incrementalBackups) {
        if (backup.createdAt < sevenDaysAgo) {
          try {
            await backupService.deleteBackup(backup.id, 'system-cleanup');
            console.log(`[Backup Scheduler] Cleaned up old incremental backup: ${backup.name}`);
          } catch (error) {
            console.error(`[Backup Scheduler] Failed to delete incremental backup ${backup.name}:`, error);
          }
        }
      }
      
    } catch (error) {
      console.error('[Backup Scheduler] Failed to cleanup old backups:', error);
    }
  }

  async updateBackupSchedule(frequencyHours: number, enabled: boolean): Promise<void> {
    try {
      // Update configuration
      await storage.upsertSystemConfig({
        key: 'backup.frequency_hours',
        value: frequencyHours.toString(),
        type: 'number',
        description: 'Frecuencia de respaldo en horas',
        category: 'backup',
        isEditable: true,
        updatedAt: new Date()
      });

      await storage.upsertSystemConfig({
        key: 'backup.auto_enabled',
        value: enabled.toString(),
        type: 'boolean',
        description: 'Respaldos automáticos habilitados',
        category: 'backup',
        isEditable: true,
        updatedAt: new Date()
      });

      // Restart backup schedule with new frequency
      if (enabled) {
        await this.startAutomaticBackups(frequencyHours);
        console.log(`[Backup Scheduler] Updated backup schedule: every ${frequencyHours} hours`);
      } else {
        this.stopAutomaticBackups();
        console.log('[Backup Scheduler] Automatic backups disabled');
      }

    } catch (error) {
      console.error('[Backup Scheduler] Failed to update backup schedule:', error);
      throw error;
    }
  }

  async getBackupStatus(): Promise<{
    isEnabled: boolean;
    frequencyHours: number;
    lastBackup?: Date;
    nextBackup?: Date;
    totalBackups: number;
  }> {
    try {
      const config = await this.getBackupConfiguration();
      const backups = await backupService.listBackups();
      const fullBackups = backups.filter(b => b.type === 'full');
      
      let nextBackup: Date | undefined;
      if (config.auto_enabled && fullBackups.length > 0) {
        const lastBackup = fullBackups[0].createdAt;
        nextBackup = new Date(lastBackup.getTime() + (config.frequency_hours * 60 * 60 * 1000));
      }

      return {
        isEnabled: config.auto_enabled,
        frequencyHours: config.frequency_hours,
        lastBackup: fullBackups.length > 0 ? fullBackups[0].createdAt : undefined,
        nextBackup,
        totalBackups: backups.length
      };
    } catch (error) {
      console.error('[Backup Scheduler] Failed to get backup status:', error);
      return {
        isEnabled: false,
        frequencyHours: 24,
        totalBackups: 0
      };
    }
  }

  private async getBackupConfiguration(): Promise<{
    auto_enabled: boolean;
    frequency_hours: number;
  }> {
    try {
      const configs = await storage.getSystemConfig();
      
      return {
        auto_enabled: configs && configs['backup.auto_enabled']?.value === 'true' || true,
        frequency_hours: configs && configs['backup.frequency_hours'] ? parseInt(configs['backup.frequency_hours'].value) : 24
      };
    } catch (error) {
      console.error('[Backup Scheduler] Failed to get backup configuration:', error);
      return {
        auto_enabled: true,
        frequency_hours: 24
      };
    }
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  destroy() {
    this.stopAutomaticBackups();
    this.isInitialized = false;
    console.log('[Backup Scheduler] Service destroyed');
  }
}

export const scheduledBackupService = new ScheduledBackupService();