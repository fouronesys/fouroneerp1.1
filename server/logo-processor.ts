import sharp from 'sharp';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import fs from 'fs';

export class LogoProcessor {
  /**
   * Process PNG logo to black and white with intensified black for thermal printing
   */
  static async processLogoForThermal(logoPath: string): Promise<string[]> {
    try {
      // Load and process the image with Sharp
      const processedBuffer = await sharp(logoPath)
        .resize(200, 100, { // Resize to fit thermal printer width
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .threshold(128) // Convert to pure black and white
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data, info } = processedBuffer;
      const { width, height } = info;

      // Convert to ASCII representation for thermal printer
      const asciiLines: string[] = [];
      
      for (let y = 0; y < height; y += 2) { // Process 2 rows at a time for better density
        let line = '';
        for (let x = 0; x < width; x++) {
          const pixelIndex = (y * width + x);
          const pixelValue = data[pixelIndex];
          
          // Convert to block characters - intensify black
          if (pixelValue < 128) {
            line += '██'; // Full block for black pixels (intensified)
          } else {
            line += '  '; // Space for white pixels
          }
        }
        asciiLines.push(line);
      }

      return asciiLines;

    } catch (error) {
      console.error('Error processing logo:', error);
      // Return fallback logo
      return this.getFallbackLogo();
    }
  }

  /**
   * Create ESC/POS bitmap commands for the logo
   */
  static async createThermalBitmap(logoPath: string): Promise<string> {
    try {
      const processedBuffer = await sharp(logoPath)
        .resize(384, 200, { // Standard thermal printer width (384 dots for 80mm)
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .threshold(100) // More aggressive threshold for intensified black
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data, info } = processedBuffer;
      const { width, height } = info;

      // Generate ESC/POS bitmap command
      let escPos = '\x1B\x40'; // Initialize printer
      escPos += '\x1B\x61\x01'; // Center alignment
      escPos += `\x1D\x76\x30\x00`; // Print raster bitmap
      
      // Convert image data to bitmap
      const bytesPerLine = Math.ceil(width / 8);
      const bitmapData: number[] = [];

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < bytesPerLine; x++) {
          let byte = 0;
          for (let bit = 0; bit < 8; bit++) {
            const pixelX = x * 8 + bit;
            if (pixelX < width) {
              const pixelIndex = y * width + pixelX;
              const pixelValue = data[pixelIndex];
              if (pixelValue < 128) { // Black pixel (intensified)
                byte |= (1 << (7 - bit));
              }
            }
          }
          bitmapData.push(byte);
        }
      }

      // Add bitmap dimensions and data
      escPos += String.fromCharCode(bytesPerLine & 0xFF);
      escPos += String.fromCharCode((bytesPerLine >> 8) & 0xFF);
      escPos += String.fromCharCode(height & 0xFF);
      escPos += String.fromCharCode((height >> 8) & 0xFF);
      
      bitmapData.forEach(byte => {
        escPos += String.fromCharCode(byte);
      });

      escPos += '\x1B\x61\x00'; // Left alignment
      escPos += '\n\n'; // Line feeds

      return escPos;

    } catch (error) {
      console.error('Error creating thermal bitmap:', error);
      return ''; // Return empty string on error
    }
  }

  /**
   * Get fallback ASCII logo when PNG processing fails
   */
  static getFallbackLogo(): string[] {
    return [
      '████████████████████████████████████████████████',
      '██                                            ██',
      '██        FOUR ONE SOLUTIONS                  ██',
      '██                                            ██',
      '██      ███████   ██  ██   ██  ██             ██',
      '██      ██        ██  ██   ██  ██             ██',
      '██      █████     ██  ██   ██  ██             ██',
      '██      ██        ██  ██   ██  ██             ██',
      '██      ██         ████     ████              ██',
      '██                                            ██',
      '██              SOLUCIONES 411               ██',
      '██                                            ██',
      '████████████████████████████████████████████████'
    ];
  }

  /**
   * Check if logo file exists and is accessible
   */
  static async validateLogoFile(logoPath: string): Promise<boolean> {
    try {
      await fs.promises.access(logoPath, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Download logo from URL and save locally for processing
   */
  static async downloadAndSaveLogo(logoUrl: string, savePath: string): Promise<boolean> {
    try {
      const response = await fetch(logoUrl);
      if (!response.ok) return false;

      const buffer = await response.arrayBuffer();
      await fs.promises.writeFile(savePath, Buffer.from(buffer));
      return true;
    } catch (error) {
      console.error('Error downloading logo:', error);
      return false;
    }
  }
}