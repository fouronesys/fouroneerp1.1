import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

export interface IconSet {
  name: string;
  sizes: number[];
  formats: ('png' | 'webp' | 'svg')[];
  baseColor: string;
  variants?: {
    dark?: string;
    light?: string;
    accent?: string;
  };
}

export interface AssetOptimizationConfig {
  quality: number;
  progressive: boolean;
  stripMetadata: boolean;
  formats: ('webp' | 'png' | 'jpg')[];
}

export class AssetManager {
  private baseDir: string;
  private outputDir: string;
  private manifestFile: string;

  constructor(baseDir: string = 'uploads', outputDir: string = 'client/public/assets') {
    this.baseDir = baseDir;
    this.outputDir = outputDir;
    this.manifestFile = path.join(outputDir, 'asset-manifest.json');
  }

  /**
   * Generate complete icon set for PWA and branding
   */
  async generateIconSet(sourceImage: string, config: IconSet): Promise<string[]> {
    const generatedFiles: string[] = [];
    const sourcePath = path.join(this.baseDir, sourceImage);
    
    try {
      await fs.access(sourcePath);
    } catch {
      throw new Error(`Source image not found: ${sourcePath}`);
    }

    // Ensure output directory exists
    await this.ensureDirectory(this.outputDir);

    const baseImage = sharp(sourcePath);
    const { width, height } = await baseImage.metadata();

    if (!width || !height) {
      throw new Error('Unable to read image dimensions');
    }

    // Generate different sizes
    for (const size of config.sizes) {
      for (const format of config.formats) {
        if (format === 'svg') {
          // Copy original SVG if source is SVG
          if (path.extname(sourceImage).toLowerCase() === '.svg') {
            const outputPath = path.join(this.outputDir, `${config.name}-${size}.svg`);
            await fs.copyFile(sourcePath, outputPath);
            generatedFiles.push(outputPath);
          }
          continue;
        }

        let processor = baseImage.clone().resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        });

        const filename = `${config.name}-${size}x${size}.${format}`;
        const outputPath = path.join(this.outputDir, filename);

        if (format === 'png') {
          processor = processor.png({ quality: 90, progressive: true });
        } else if (format === 'webp') {
          processor = processor.webp({ quality: 85, effort: 6 });
        }

        await processor.toFile(outputPath);
        generatedFiles.push(outputPath);
      }
    }

    // Generate themed variants if specified
    if (config.variants) {
      for (const [theme, color] of Object.entries(config.variants)) {
        for (const size of config.sizes) {
          const filename = `${config.name}-${theme}-${size}x${size}.png`;
          const outputPath = path.join(this.outputDir, filename);

          await baseImage
            .clone()
            .resize(size, size, {
              fit: 'contain',
              background: { r: 255, g: 255, b: 255, alpha: 0 }
            })
            .tint(color)
            .png({ quality: 90 })
            .toFile(outputPath);

          generatedFiles.push(outputPath);
        }
      }
    }

    return generatedFiles;
  }

  /**
   * Generate responsive image variants
   */
  async generateResponsiveImages(
    sourceImage: string, 
    breakpoints: number[] = [320, 480, 768, 1024, 1200, 1920],
    config: AssetOptimizationConfig = {
      quality: 80,
      progressive: true,
      stripMetadata: true,
      formats: ['webp', 'png']
    }
  ): Promise<{ [size: number]: { [format: string]: string } }> {
    const sourcePath = path.join(this.baseDir, sourceImage);
    const baseFilename = path.parse(sourceImage).name;
    const result: { [size: number]: { [format: string]: string } } = {};

    await this.ensureDirectory(this.outputDir);

    const baseImage = sharp(sourcePath);
    const metadata = await baseImage.metadata();

    if (!metadata.width) {
      throw new Error('Unable to read image width');
    }

    for (const width of breakpoints) {
      // Skip if breakpoint is larger than original image
      if (width > metadata.width) continue;

      result[width] = {};

      for (const format of config.formats) {
        let processor = baseImage.clone().resize(width, null, {
          withoutEnlargement: true
        });

        if (config.stripMetadata) {
          processor = processor.withMetadata({});
        }

        const filename = `${baseFilename}-${width}w.${format}`;
        const outputPath = path.join(this.outputDir, filename);

        if (format === 'webp') {
          processor = processor.webp({ 
            quality: config.quality,
            effort: 6
          });
        } else if (format === 'png') {
          processor = processor.png({ 
            quality: config.quality,
            progressive: config.progressive
          });
        } else if (format === 'jpg') {
          processor = processor.jpeg({ 
            quality: config.quality,
            progressive: config.progressive
          });
        }

        await processor.toFile(outputPath);
        result[width][format] = `/assets/${filename}`;
      }
    }

    return result;
  }

  /**
   * Generate favicons and PWA icons
   */
  async generateFavicons(sourceImage: string): Promise<string[]> {
    const faviconSizes = [16, 32, 48, 64, 96, 128, 180, 192, 256, 512];
    const generatedFiles: string[] = [];
    
    const iconSet: IconSet = {
      name: 'favicon',
      sizes: faviconSizes,
      formats: ['png'],
      baseColor: '#0072FF'
    };

    const files = await this.generateIconSet(sourceImage, iconSet);
    generatedFiles.push(...files);

    // Generate apple-touch-icon
    const sourcePath = path.join(this.baseDir, sourceImage);
    const appleIconPath = path.join(this.outputDir, 'apple-touch-icon.png');
    
    await sharp(sourcePath)
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png({ quality: 90 })
      .toFile(appleIconPath);
    
    generatedFiles.push(appleIconPath);

    // Generate favicon.ico (using 32x32)
    const faviconIcoPath = path.join(this.outputDir, 'favicon.ico');
    await sharp(sourcePath)
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(faviconIcoPath);
    
    generatedFiles.push(faviconIcoPath);

    return generatedFiles;
  }

  /**
   * Optimize existing images
   */
  async optimizeImage(
    inputPath: string, 
    outputPath?: string,
    config: AssetOptimizationConfig = {
      quality: 80,
      progressive: true,
      stripMetadata: true,
      formats: ['webp']
    }
  ): Promise<string[]> {
    const fullInputPath = path.join(this.baseDir, inputPath);
    const optimizedFiles: string[] = [];
    const baseFilename = path.parse(inputPath).name;
    
    await this.ensureDirectory(this.outputDir);

    const image = sharp(fullInputPath);
    
    for (const format of config.formats) {
      const filename = `${baseFilename}-optimized.${format}`;
      const fullOutputPath = outputPath || path.join(this.outputDir, filename);
      
      let processor = image.clone();
      
      if (config.stripMetadata) {
        processor = processor.withMetadata({});
      }

      if (format === 'webp') {
        processor = processor.webp({
          quality: config.quality,
          effort: 6
        });
      } else if (format === 'png') {
        processor = processor.png({
          quality: config.quality,
          progressive: config.progressive
        });
      } else if (format === 'jpg') {
        processor = processor.jpeg({
          quality: config.quality,
          progressive: config.progressive
        });
      }

      await processor.toFile(fullOutputPath);
      optimizedFiles.push(fullOutputPath);
    }

    return optimizedFiles;
  }

  /**
   * Generate asset manifest for caching and optimization
   */
  async generateAssetManifest(): Promise<void> {
    const manifest: {
      generated: string;
      assets: { [filename: string]: {
        hash: string;
        size: number;
        mtime: string;
        type: string;
      }};
    } = {
      generated: new Date().toISOString(),
      assets: {}
    };

    try {
      const files = await fs.readdir(this.outputDir, { recursive: true });
      
      for (const file of files) {
        if (typeof file !== 'string') continue;
        
        const filePath = path.join(this.outputDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          const content = await fs.readFile(filePath);
          const hash = createHash('md5').update(content).digest('hex');
          
          manifest.assets[file] = {
            hash,
            size: stats.size,
            mtime: stats.mtime.toISOString(),
            type: path.extname(file).slice(1).toLowerCase()
          };
        }
      }
    } catch (error) {
      console.warn('Error generating asset manifest:', error);
    }

    await fs.writeFile(this.manifestFile, JSON.stringify(manifest, null, 2));
  }

  /**
   * Get responsive image srcset string
   */
  generateSrcSet(baseFilename: string, breakpoints: number[], format: string = 'webp'): string {
    return breakpoints
      .map(width => `/assets/${baseFilename}-${width}w.${format} ${width}w`)
      .join(', ');
  }

  /**
   * Clean up old assets
   */
  async cleanupAssets(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<string[]> {
    const deletedFiles: string[] = [];
    const now = Date.now();

    try {
      const files = await fs.readdir(this.outputDir, { recursive: true });
      
      for (const file of files) {
        if (typeof file !== 'string') continue;
        
        const filePath = path.join(this.outputDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile() && (now - stats.mtime.getTime()) > maxAge) {
          await fs.unlink(filePath);
          deletedFiles.push(file);
        }
      }
    } catch (error) {
      console.warn('Error during asset cleanup:', error);
    }

    return deletedFiles;
  }

  private async ensureDirectory(dir: string): Promise<void> {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

export const assetManager = new AssetManager();