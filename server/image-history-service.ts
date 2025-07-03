import { db } from './db';
import { sql } from 'drizzle-orm';

export interface ImageGenerationRecord {
  id?: number;
  productId: number;
  productName: string;
  imageUrl: string;
  source: 'gemini' | 'unsplash' | 'google' | 'manual';
  prompt?: string;
  generatedAt: Date;
  userId: string;
  companyId: number;
  success: boolean;
  errorMessage?: string;
}

export class ImageHistoryService {
  private static async ensureTable() {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS image_generation_history (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        image_url TEXT,
        source VARCHAR(50) NOT NULL,
        prompt TEXT,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id VARCHAR(255) NOT NULL,
        company_id INTEGER NOT NULL,
        success BOOLEAN DEFAULT true,
        error_message TEXT
      )
    `);

    // Create indexes for faster queries
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_image_history_product_id ON image_generation_history(product_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_image_history_company_id ON image_generation_history(company_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_image_history_generated_at ON image_generation_history(generated_at);
    `);
  }

  static async recordGeneration(record: ImageGenerationRecord): Promise<void> {
    try {
      await this.ensureTable();
      
      // Prepare values with proper null handling
      const values = {
        productId: record.productId,
        productName: record.productName,
        imageUrl: record.imageUrl,
        source: record.source,
        prompt: record.prompt || null,
        generatedAt: record.generatedAt,
        userId: record.userId,
        companyId: record.companyId,
        success: record.success,
        errorMessage: record.errorMessage || null
      };
      
      await db.execute(sql`
        INSERT INTO image_generation_history (
          product_id, product_name, image_url, source, prompt,
          generated_at, user_id, company_id, success, error_message
        ) VALUES (
          ${values.productId}, ${values.productName}, ${values.imageUrl},
          ${values.source}, ${values.prompt}, ${values.generatedAt},
          ${values.userId}, ${values.companyId}, ${values.success},
          ${values.errorMessage}
        )
      `);
    } catch (error) {
      console.error('Error recording image generation:', error);
      // Log the error but don't throw to prevent blocking image generation
    }
  }

  static async getHistory(companyId: number, limit: number = 50): Promise<ImageGenerationRecord[]> {
    await this.ensureTable();
    
    const result = await db.execute(sql`
      SELECT 
        id, product_id, product_name, image_url, source, prompt,
        generated_at, user_id, company_id, success, error_message
      FROM image_generation_history
      WHERE company_id = ${companyId}
      ORDER BY generated_at DESC
      LIMIT ${limit}
    `);

    return result.rows.map(row => ({
      id: row.id as number,
      productId: row.product_id as number,
      productName: row.product_name as string,
      imageUrl: row.image_url as string,
      source: row.source as 'gemini' | 'unsplash' | 'google' | 'manual',
      prompt: row.prompt as string,
      generatedAt: new Date(row.generated_at as string),
      userId: row.user_id as string,
      companyId: row.company_id as number,
      success: row.success as boolean,
      errorMessage: row.error_message as string
    }));
  }

  static async getProductHistory(productId: number, companyId: number): Promise<ImageGenerationRecord[]> {
    await this.ensureTable();
    
    const result = await db.execute(sql`
      SELECT 
        id, product_id, product_name, image_url, source, prompt,
        generated_at, user_id, company_id, success, error_message
      FROM image_generation_history
      WHERE product_id = ${productId} AND company_id = ${companyId}
      ORDER BY generated_at DESC
    `);

    return result.rows.map(row => ({
      id: row.id as number,
      productId: row.product_id as number,
      productName: row.product_name as string,
      imageUrl: row.image_url as string,
      source: row.source as 'gemini' | 'unsplash' | 'google' | 'manual',
      prompt: row.prompt as string,
      generatedAt: new Date(row.generated_at as string),
      userId: row.user_id as string,
      companyId: row.company_id as number,
      success: row.success as boolean,
      errorMessage: row.error_message as string
    }));
  }

  static async getStatistics(companyId: number): Promise<{
    totalGenerated: number;
    successfulGenerations: number;
    failedGenerations: number;
    geminiCount: number;
    unsplashCount: number;
    googleCount: number;
    manualCount: number;
    lastGeneratedAt?: Date;
  }> {
    await this.ensureTable();
    
    const stats = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN source = 'gemini' THEN 1 ELSE 0 END) as gemini_count,
        SUM(CASE WHEN source = 'unsplash' THEN 1 ELSE 0 END) as unsplash_count,
        SUM(CASE WHEN source = 'google' THEN 1 ELSE 0 END) as google_count,
        SUM(CASE WHEN source = 'manual' THEN 1 ELSE 0 END) as manual_count,
        MAX(generated_at) as last_generated
      FROM image_generation_history
      WHERE company_id = ${companyId}
    `);

    const row = stats.rows[0];
    return {
      totalGenerated: Number(row.total) || 0,
      successfulGenerations: Number(row.successful) || 0,
      failedGenerations: Number(row.failed) || 0,
      geminiCount: Number(row.gemini_count) || 0,
      unsplashCount: Number(row.unsplash_count) || 0,
      googleCount: Number(row.google_count) || 0,
      manualCount: Number(row.manual_count) || 0,
      lastGeneratedAt: row.last_generated ? new Date(row.last_generated as string) : undefined
    };
  }

  static async cleanup(companyId: number, daysToKeep: number = 30): Promise<number> {
    await this.ensureTable();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await db.execute(sql`
      DELETE FROM image_generation_history
      WHERE company_id = ${companyId} 
      AND generated_at < ${cutoffDate}
      RETURNING id
    `);

    return result.rows.length;
  }
}

export const imageHistoryService = new ImageHistoryService();