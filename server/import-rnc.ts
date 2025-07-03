import { parseAndImportRNCFile } from './rnc-parser';

async function main() {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    try {
      console.log(`\n=== IMPORT ATTEMPT ${attempts + 1}/${maxAttempts} ===`);
      console.log('Starting complete RNC registry import from DGII file...');
      console.log('File contains 736,890 authentic DGII records');
      
      const result = await parseAndImportRNCFile('../attached_assets/DGII_RNC.TXT');
      
      console.log('\n=== IMPORT COMPLETE ===');
      console.log(`Total records processed: ${result.total}`);
      console.log(`Successfully imported: ${result.imported}`);
      console.log(`Completion rate: ${((result.imported / result.total) * 100).toFixed(2)}%`);
      
      if (result.imported === result.total) {
        console.log('✅ Complete DGII RNC registry import successful!');
        process.exit(0);
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        console.log(`Resuming in 2 seconds... (${result.total - result.imported} records remaining)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      console.error(`Import attempt ${attempts + 1} failed:`, error);
      attempts++;
      
      if (attempts < maxAttempts) {
        console.log(`Retrying in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  console.error('Maximum import attempts reached');
  process.exit(1);
}

main();