import QRCode from 'qrcode';

export class ThermalQRProcessor {
  /**
   * Generate real QR code as pure PNG data for thermal printing
   * Returns the QR as image data without processing
   */
  static async generateQRCodeForThermal(data: string): Promise<string> {
    try {
      // Generate QR code as PNG buffer
      const qrBuffer = await QRCode.toBuffer(data, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
      
      // Convert to base64 for thermal printer
      const base64QR = qrBuffer.toString('base64');
      
      // Return QR as PNG data for thermal printers
      // This preserves the original QR code without any processing
      return `data:image/png;base64,${base64QR}`;
      
    } catch (error) {
      console.error('QR generation error:', error);
      throw error;
    }
  }

  /**
   * Generate simple ASCII QR code as fallback
   */
  static async generateASCIIQR(data: string): Promise<string[]> {
    try {
      const qrString = await QRCode.toString(data, {
        type: 'terminal',
        small: true
      });
      
      // Clean and return lines
      return qrString.split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/\u001b\[[0-9;]*m/g, ''));
        
    } catch (error) {
      console.error('ASCII QR generation error:', error);
      return ['QR generation failed'];
    }
  }
}