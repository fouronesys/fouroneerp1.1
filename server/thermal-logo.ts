import fs from 'fs';

export class ThermalLogoProcessor {
  /**
   * Include PNG logo directly as base64 for thermal printers
   * Returns the logo as pure PNG data without processing
   */
  static async convertPNGToThermal(logoPath: string): Promise<string> {
    try {
      if (!fs.existsSync(logoPath)) {
        throw new Error('Logo file not found');
      }

      // Read PNG file as base64
      const logoBuffer = fs.readFileSync(logoPath);
      const base64Logo = logoBuffer.toString('base64');
      
      // Return PNG data for thermal printers
      // This preserves the original PNG without any processing
      return `data:image/png;base64,${base64Logo}`;
      
    } catch (error) {
      console.error('Logo processing error:', error);
      throw error;
    }
  }
}