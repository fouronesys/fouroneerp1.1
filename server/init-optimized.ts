import { db } from './db';
import { sql } from 'drizzle-orm';
import { dgiiServiceOptimized } from './dgii-service-optimized';

export async function initializeOptimizedSystem() {
  try {
    console.log('Initializing optimized RNC system...');
    
    // Create indexes for RNC table
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_rnc_registry_rnc ON rnc_registry(rnc)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_rnc_registry_razon_social ON rnc_registry(razon_social)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_rnc_registry_rnc_estado ON rnc_registry(rnc, estado)`);
    console.log('✓ RNC indexes created');
    
    // Initialize optimized DGII service
    await dgiiServiceOptimized.initialize();
    console.log('✓ Optimized DGII service initialized');
    
    // Get RNC count
    const count = await dgiiServiceOptimized.getRNCCount();
    console.log(`✓ RNC registry initialized with ${count} records (database-optimized)`);
    
    return true;
  } catch (error) {
    console.error('Error initializing optimized system:', error);
    return false;
  }
}