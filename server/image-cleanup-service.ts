import fs from 'fs/promises';
import path from 'path';

export class ImageCleanupService {
  private static uploadsDir = path.join(process.cwd(), 'uploads', 'products');

  /**
   * Delete a file from the filesystem safely
   */
  static async deleteImageFile(imageUrl: string): Promise<boolean> {
    try {
      // Extract filename from URL (e.g., "/uploads/products/laptop-123.png" -> "laptop-123.png")
      const filename = imageUrl.split('/').pop();
      
      if (!filename || !filename.includes('.')) {
        console.log('Invalid filename format:', filename);
        return false;
      }

      const filePath = path.join(this.uploadsDir, filename);
      
      // Check if file exists before attempting deletion
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        console.log(`✓ Deleted old image: ${filename}`);
        return true;
      } catch (error) {
        // File doesn't exist or can't be accessed
        console.log(`Image file not found or already deleted: ${filename}`);
        return false;
      }
    } catch (error) {
      console.error('Error deleting image file:', error);
      return false;
    }
  }

  /**
   * Clean up old images that are no longer referenced
   */
  static async cleanupOrphanedImages(): Promise<{ deleted: number; errors: number }> {
    try {
      const files = await fs.readdir(this.uploadsDir);
      let deleted = 0;
      let errors = 0;

      // Get file stats to check age (older than 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      for (const file of files) {
        try {
          const filePath = path.join(this.uploadsDir, file);
          const stats = await fs.stat(filePath);
          
          // Delete files older than 7 days (could be expanded to check database references)
          if (stats.mtime < oneWeekAgo) {
            await fs.unlink(filePath);
            deleted++;
            console.log(`✓ Cleaned up old image: ${file}`);
          }
        } catch (error) {
          errors++;
          console.error(`Error processing file ${file}:`, error);
        }
      }

      return { deleted, errors };
    } catch (error) {
      console.error('Error during image cleanup:', error);
      return { deleted: 0, errors: 1 };
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    totalFiles: number;
    totalSizeBytes: number;
    totalSizeMB: number;
  }> {
    try {
      const files = await fs.readdir(this.uploadsDir);
      let totalSizeBytes = 0;

      for (const file of files) {
        try {
          const filePath = path.join(this.uploadsDir, file);
          const stats = await fs.stat(filePath);
          totalSizeBytes += stats.size;
        } catch (error) {
          // Skip files that can't be accessed
        }
      }

      return {
        totalFiles: files.length,
        totalSizeBytes,
        totalSizeMB: Math.round((totalSizeBytes / (1024 * 1024)) * 100) / 100
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { totalFiles: 0, totalSizeBytes: 0, totalSizeMB: 0 };
    }
  }

  /**
   * Force garbage collection to free memory
   */
  static forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
      console.log('✓ Memory garbage collection performed');
    } else {
      console.log('Garbage collection not available (run with --expose-gc)');
    }
  }
}