// Memory optimization configuration for handling large datasets
export const memoryConfig = {
  // Limit RNC registry operations
  rncBatchSize: 1000,
  rncCacheSize: 10000,
  rncSearchTimeout: 5000,
  
  // General memory settings
  maxArraySize: 100000,
  gcInterval: 60000, // 1 minute
  
  // Database query limits
  defaultQueryLimit: 1000,
  maxQueryLimit: 10000,
};

// Helper to chunk large arrays
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Helper to process large datasets with memory management
export async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  const chunks = chunkArray(items, batchSize);
  
  for (const chunk of chunks) {
    const batchResults = await processor(chunk);
    results.push(...batchResults);
    
    // Force garbage collection hint
    if (global.gc) {
      global.gc();
    }
  }
  
  return results;
}

// Memory-efficient stream processing
export function createMemoryEfficientStream() {
  return {
    batchSize: memoryConfig.rncBatchSize,
    timeout: memoryConfig.rncSearchTimeout,
  };
}