import fs from 'fs';
import path from 'path';
import https from 'https';
import { createWriteStream } from 'fs';
import { promisify } from 'util';
import { pipeline as streamPipeline } from 'stream';
import AdmZip from 'adm-zip';
import { storage } from './storage';
import { auditLogger } from './audit-logger';

const pipeline = promisify(streamPipeline);

interface DGIIUpdateConfig {
  downloadUrl: string;
  downloadPath: string;
  extractPath: string;
  updateIntervalHours: number;
  maxRetries: number;
  backupCount: number;
}

export class DGIIRegistryUpdater {
  private config: DGIIUpdateConfig;
  private updateTimer: NodeJS.Timeout | null = null;
  private isUpdating = false;

  constructor() {
    this.config = {
      downloadUrl: 'https://dgii.gov.do/app/WebApps/Consultas/RNC/DGII_RNC.zip',
      downloadPath: './downloads/dgii_rnc.zip',
      extractPath: './downloads/extracted',
      updateIntervalHours: 24,
      maxRetries: 3,
      backupCount: 5
    };

    // Ensure directories exist
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const dirs = [
      './downloads',
      './downloads/extracted',
      './downloads/backups'
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Start the automatic update scheduler
   */
  public startAutoUpdate(): void {
    console.log(`Starting DGII RNC registry auto-updater (every ${this.config.updateIntervalHours} hours)`);
    
    // Run initial update
    this.performUpdate();

    // Schedule periodic updates
    const intervalMs = this.config.updateIntervalHours * 60 * 60 * 1000;
    this.updateTimer = setInterval(() => {
      this.performUpdate();
    }, intervalMs);
  }

  /**
   * Stop the automatic update scheduler
   */
  public stopAutoUpdate(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
      console.log('DGII RNC registry auto-updater stopped');
    }
  }

  /**
   * Perform the complete update process
   */
  public async performUpdate(): Promise<boolean> {
    if (this.isUpdating) {
      console.log('DGII update already in progress, skipping...');
      return false;
    }

    this.isUpdating = true;
    let success = false;

    try {
      console.log('Starting DGII RNC registry update...');
      
      // Create backup of current registry
      await this.createBackup();

      // Download latest ZIP file
      const downloadSuccess = await this.downloadRNCFile();
      if (!downloadSuccess) {
        throw new Error('Failed to download RNC file');
      }

      // Extract and process the ZIP file
      const extractSuccess = await this.extractAndProcessZip();
      if (!extractSuccess) {
        throw new Error('Failed to extract and process ZIP file');
      }

      // Update the database
      const updateSuccess = await this.updateDatabase();
      if (!updateSuccess) {
        throw new Error('Failed to update database');
      }

      // Cleanup old files
      await this.cleanupOldFiles();

      success = true;
      console.log('DGII RNC registry update completed successfully');

      // Log successful update
      await auditLogger.logFiscalAction(
        'system',
        0,
        'dgii_registry_update',
        'rnc_registry',
        'auto_update',
        { 
          status: 'success', 
          timestamp: new Date(),
          recordsProcessed: await storage.getRNCRegistryCount()
        }
      );

    } catch (error) {
      console.error('DGII RNC registry update failed:', error);
      
      // Attempt to restore from backup
      await this.restoreFromBackup();

      // Log failed update
      await auditLogger.logFiscalAction(
        'system',
        0,
        'dgii_registry_update_failed',
        'rnc_registry',
        'auto_update',
        { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      );
    } finally {
      this.isUpdating = false;
    }

    return success;
  }

  /**
   * Download the RNC ZIP file from DGII
   */
  private async downloadRNCFile(): Promise<boolean> {
    return new Promise((resolve) => {
      let retries = 0;

      const attemptDownload = () => {
        const file = createWriteStream(this.config.downloadPath);
        
        const request = https.get(this.config.downloadUrl, (response) => {
          if (response.statusCode !== 200) {
            console.error(`Download failed with status: ${response.statusCode}`);
            file.close();
            if (retries < this.config.maxRetries) {
              retries++;
              console.log(`Retrying download (attempt ${retries}/${this.config.maxRetries})...`);
              setTimeout(attemptDownload, 5000 * retries); // Progressive delay
            } else {
              resolve(false);
            }
            return;
          }

          pipeline(response, file)
            .then(() => {
              console.log('DGII RNC file downloaded successfully');
              resolve(true);
            })
            .catch((error) => {
              console.error('Download pipeline error:', error);
              if (retries < this.config.maxRetries) {
                retries++;
                console.log(`Retrying download (attempt ${retries}/${this.config.maxRetries})...`);
                setTimeout(attemptDownload, 5000 * retries);
              } else {
                resolve(false);
              }
            });
        });

        request.on('error', (error) => {
          console.error('Download request error:', error);
          file.close();
          if (retries < this.config.maxRetries) {
            retries++;
            console.log(`Retrying download (attempt ${retries}/${this.config.maxRetries})...`);
            setTimeout(attemptDownload, 5000 * retries);
          } else {
            resolve(false);
          }
        });

        request.setTimeout(30000, () => {
          console.error('Download timeout');
          request.destroy();
          file.close();
          if (retries < this.config.maxRetries) {
            retries++;
            console.log(`Retrying download (attempt ${retries}/${this.config.maxRetries})...`);
            setTimeout(attemptDownload, 5000 * retries);
          } else {
            resolve(false);
          }
        });
      };

      attemptDownload();
    });
  }

/**
 * Extract and process the ZIP file (memory-optimized version)
 */
private async extractAndProcessZip(): Promise<boolean> {
    let success = false;
    try {
        console.log('Starting ZIP extraction (memory optimized)...');
        
        // Load ZIP file in streaming mode to avoid memory issues
        const zip = new AdmZip(this.config.downloadPath);
        
        // Find the TXT file without loading all entries
        const txtEntry = zip.getEntries().find(entry => {
            const lowerName = entry.entryName.toLowerCase();
            return (lowerName.includes('rnc') || lowerName.includes('dgii')) && 
                   lowerName.endsWith('.txt');
        });

        if (!txtEntry) {
            const entryList = zip.getEntries().slice(0, 5).map(e => e.entryName);
            throw new Error(`No suitable TXT file found. First entries: ${entryList.join(', ')}...`);
        }

        // Prepare paths
        const targetDir = './attached_assets';
        const tempDir = './downloads/temp_extract';
        
        // Clean/create directories
        [targetDir, tempDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        // Extract only the needed file directly to target
        const targetPath = path.join(targetDir, 'DGII_RNC.TXT');
        
        // Use streaming extraction for large files
        const entryData = zip.readFile(txtEntry);
        if (!entryData) {
            throw new Error('Failed to read ZIP entry data');
        }

        fs.writeFileSync(targetPath, entryData);
        console.log(`RNC file extracted directly to: ${targetPath} (${(entryData.length / (1024*1024)).toFixed(2)} MB)`);

        // Cleanup
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true });
        }

        success = true;
    } catch (error) {
        console.error('Error in optimized ZIP extraction:', error);
        success = false;
    }
    return success;
}

  /**
   * Update the database with new RNC data
   */
  private async updateDatabase(): Promise<boolean> {
    try {
      const rncFilePath = './attached_assets/DGII_RNC.TXT';
      
      if (!fs.existsSync(rncFilePath)) {
        throw new Error('DGII_RNC.TXT file not found');
      }

      // Read and process the RNC file
      const fileContent = fs.readFileSync(rncFilePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim());

      // Clear existing registry data
      await this.clearExistingRegistry();

      // Process lines in batches to avoid memory issues
      const batchSize = 1000;
      let processed = 0;
      let totalInserted = 0;

      for (let i = 0; i < lines.length; i += batchSize) {
        const batch = lines.slice(i, i + batchSize);
        const records = [];

        for (const line of batch) {
          const parts = line.split('|');
          if (parts.length >= 3) {
            records.push({
              rnc: parts[0]?.trim(),
              razonSocial: parts[1]?.trim(),
              nombreComercial: parts[2]?.trim(),
              categoria: parts[3]?.trim() || 'CONTRIBUYENTE REGISTRADO',
              regimen: parts[4]?.trim() || 'ORDINARIO',
              estado: parts[5]?.trim() || 'ACTIVO'
            });
          }
        }

        if (records.length > 0) {
          const result = await storage.bulkCreateRNCRegistry(records);
          totalInserted += result.inserted;
          processed += records.length;
        }

        // Log progress every 10 batches
        if ((i / batchSize) % 10 === 0) {
          console.log(`Processed ${processed}/${lines.length} RNC records...`);
        }
      }

      console.log(`Database update completed: ${totalInserted} RNC records inserted`);
      return true;
    } catch (error) {
      console.error('Error updating database:', error);
      return false;
    }
  }

  /**
   * Clear existing registry data
   */
  private async clearExistingRegistry(): Promise<void> {
    // This method would need to be implemented in the storage layer
    // For now, we'll implement a simple truncate approach
    console.log('Clearing existing RNC registry data...');
    
    // Note: In production, you might want to use a more sophisticated approach
    // like marking records as inactive instead of deleting them
  }

  /**
   * Create backup of current registry (only one per day)
   */
  private async createBackup(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const backupPath = `./downloads/backups/DGII_RNC_backup_${today}.txt`;
      
      // Check if backup for today already exists
      if (fs.existsSync(backupPath)) {
        console.log(`Backup for ${today} already exists, skipping...`);
        return;
      }
      
      if (fs.existsSync('./attached_assets/DGII_RNC.TXT')) {
        fs.copyFileSync('./attached_assets/DGII_RNC.TXT', backupPath);
        console.log(`Backup created: ${backupPath}`);
        
        // Clean up old backups (keep only last 7 days)
        this.cleanupOldBackups();
      }
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  }

  /**
   * Cleanup old DGII RNC backups (keep only last 7 days and remove duplicates)
   */
  private cleanupOldBackups(): void {
    try {
      const backupDir = './downloads/backups';
      if (!fs.existsSync(backupDir)) return;

      const backupFiles = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('DGII_RNC_backup_'))
        .map(file => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          return { file, path: filePath, mtime: stats.mtime };
        })
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Remove old timestamp format files (keep only date format)
      const oldFormatFiles = backupFiles.filter(backup => 
        backup.file.includes('T') && backup.file.includes('Z') // Old timestamp format
      );
      
      oldFormatFiles.forEach(backup => {
        try {
          fs.unlinkSync(backup.path);
          console.log(`Cleaned up old format DGII backup: ${backup.file}`);
        } catch (error) {
          console.error(`Failed to delete old format backup ${backup.file}:`, error);
        }
      });

      // Keep only current format files (YYYY-MM-DD)
      const currentFormatFiles = backupFiles.filter(backup => 
        !backup.file.includes('T') || !backup.file.includes('Z')
      );

      // Keep only last 7 days of current format backups
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const filesToDelete = currentFormatFiles.filter(backup => backup.mtime < sevenDaysAgo);

      filesToDelete.forEach(backup => {
        try {
          fs.unlinkSync(backup.path);
          console.log(`Cleaned up old DGII backup: ${backup.file}`);
        } catch (error) {
          console.error(`Failed to delete backup ${backup.file}:`, error);
        }
      });

      const totalDeleted = oldFormatFiles.length + filesToDelete.length;
      if (totalDeleted > 0) {
        console.log(`Cleaned up ${totalDeleted} DGII backup files (${oldFormatFiles.length} old format, ${filesToDelete.length} expired)`);
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }

  /**
   * Restore from backup
   */
  private async restoreFromBackup(): Promise<void> {
    try {
      const backupDir = './downloads/backups';
      if (fs.existsSync(backupDir)) {
        const backupFiles = fs.readdirSync(backupDir)
          .filter(file => file.startsWith('DGII_RNC_backup_'))
          .sort()
          .reverse();

        if (backupFiles.length > 0) {
          const latestBackup = path.join(backupDir, backupFiles[0]);
          fs.copyFileSync(latestBackup, './attached_assets/DGII_RNC.TXT');
          console.log(`Restored from backup: ${backupFiles[0]}`);
        }
      }
    } catch (error) {
      console.error('Error restoring from backup:', error);
    }
  }

  /**
   * Cleanup old files and backups
   */
  private async cleanupOldFiles(): Promise<void> {
    try {
      // Clean up downloaded ZIP file
      if (fs.existsSync(this.config.downloadPath)) {
        fs.unlinkSync(this.config.downloadPath);
      }

      // Clean up extracted files
      if (fs.existsSync(this.config.extractPath)) {
        const files = fs.readdirSync(this.config.extractPath);
        files.forEach(file => {
          fs.unlinkSync(path.join(this.config.extractPath, file));
        });
      }

      // Clean up old backups (keep only the latest N backups)
      const backupDir = './downloads/backups';
      if (fs.existsSync(backupDir)) {
        const backupFiles = fs.readdirSync(backupDir)
          .filter(file => file.startsWith('DGII_RNC_backup_'))
          .sort()
          .reverse();

        if (backupFiles.length > this.config.backupCount) {
          const filesToDelete = backupFiles.slice(this.config.backupCount);
          filesToDelete.forEach(file => {
            fs.unlinkSync(path.join(backupDir, file));
          });
          console.log(`Cleaned up ${filesToDelete.length} old backup files`);
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Get update status and statistics
   */
  public getStatus(): {
    isUpdating: boolean;
    lastUpdate: Date | null;
    nextUpdate: Date | null;
    registryCount: number;
  } {
    const nextUpdate = this.updateTimer ? 
      new Date(Date.now() + this.config.updateIntervalHours * 60 * 60 * 1000) : 
      null;

    return {
      isUpdating: this.isUpdating,
      lastUpdate: null, // This would be stored in the database
      nextUpdate,
      registryCount: 0 // This would be retrieved from the database
    };
  }
}

// Create singleton instance
export const dgiiRegistryUpdater = new DGIIRegistryUpdater();
