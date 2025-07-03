import fetch from 'node-fetch';
import { storage } from './storage';
import { GeminiImageService } from './gemini-image-service';
import { ImageHistoryService } from './image-history-service';

interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  description?: string;
  alt_description?: string;
}

interface GoogleImage {
  link: string;
  title?: string;
  snippet?: string;
}

export class ImageGenerationService {
  private static unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
  private static googleApiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  private static googleSearchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  static async generateProductImage(productName: string, category?: string, description?: string): Promise<{ url: string; source: 'gemini' | 'unsplash' | 'google' } | null> {
    try {
      // First try Gemini AI image generation
      const geminiImage = await GeminiImageService.generateProductImage(productName, category, description);
      if (geminiImage) {
        return { url: geminiImage, source: 'gemini' };
      }

      // Fallback to Unsplash for high-quality stock photos
      const unsplashImage = await this.searchUnsplash(productName, category);
      if (unsplashImage) {
        return { url: unsplashImage, source: 'unsplash' };
      }

      // Final fallback to Google Custom Search
      const googleImage = await this.searchGoogleImages(productName, category);
      if (googleImage) {
        return { url: googleImage, source: 'google' };
      }

      return null;
    } catch (error) {
      console.error('Error generating product image:', error);
      return null;
    }
  }

  private static async searchUnsplash(productName: string, category?: string): Promise<string | null> {
    if (!this.unsplashAccessKey) {
      console.warn('Unsplash access key not configured');
      return null;
    }

    try {
      const searchQuery = category ? `${productName} ${category}` : productName;
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=portrait`,
        {
          headers: {
            Authorization: `Client-ID ${this.unsplashAccessKey}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Unsplash API error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json() as { results: UnsplashImage[] };
      
      if (data.results && data.results.length > 0) {
        return data.results[0].urls.regular;
      }

      return null;
    } catch (error) {
      console.error('Error searching Unsplash:', error);
      return null;
    }
  }

  private static async searchGoogleImages(productName: string, category?: string): Promise<string | null> {
    if (!this.googleApiKey || !this.googleSearchEngineId) {
      console.warn('Google Custom Search API credentials not configured');
      return null;
    }

    try {
      const searchQuery = category ? `${productName} ${category} product` : `${productName} product`;
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${this.googleApiKey}&cx=${this.googleSearchEngineId}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=1&imgSize=medium&safe=active`
      );

      if (!response.ok) {
        console.error('Google Custom Search API error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json() as { items?: GoogleImage[] };
      
      if (data.items && data.items.length > 0) {
        return data.items[0].link;
      }

      return null;
    } catch (error) {
      console.error('Error searching Google Images:', error);
      return null;
    }
  }

  static async batchGenerateImages(companyId: number): Promise<{
    total: number;
    processed: number;
    success: number;
    errors: number;
    details: Array<{ productId: number; productName: string; success: boolean; imageUrl?: string; error?: string }>;
  }> {
    try {
      // Get all products without images
      const products = await storage.getProductsWithoutImages(companyId);
      
      const results = {
        total: products.length,
        processed: 0,
        success: 0,
        errors: 0,
        details: [] as Array<{ productId: number; productName: string; success: boolean; imageUrl?: string; error?: string }>
      };

      for (const product of products) {
        try {
          results.processed++;
          
          const imageResult = await this.generateProductImage(
            product.name, 
            undefined, // category will be inferred from name/description
            product.description || undefined
          );
          
          if (imageResult) {
            const { url: imageUrl, source } = imageResult;
            // Update product with generated image
            await storage.updateProduct(product.id, { imageUrl }, product.companyId);
            
            // Record successful generation in history
            await ImageHistoryService.recordGeneration({
              productId: product.id,
              productName: product.name,
              imageUrl,
              source: source,
              prompt: `Batch generate image for: ${product.name}`,
              generatedAt: new Date(),
              userId: 'batch-process',
              companyId,
              success: true
            });
            
            results.success++;
            results.details.push({
              productId: product.id,
              productName: product.name,
              success: true,
              imageUrl
            });
          } else {
            // Record failed generation in history
            await ImageHistoryService.recordGeneration({
              productId: product.id,
              productName: product.name,
              imageUrl: '',
              source: 'manual',
              prompt: `Batch generate image for: ${product.name}`,
              generatedAt: new Date(),
              userId: 'batch-process',
              companyId,
              success: false,
              errorMessage: 'No suitable image found'
            });
            
            results.errors++;
            results.details.push({
              productId: product.id,
              productName: product.name,
              success: false,
              error: 'No suitable image found'
            });
          }

          // Add delay between requests to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          // Record error in history
          await ImageHistoryService.recordGeneration({
            productId: product.id,
            productName: product.name,
            imageUrl: '',
            source: 'manual',
            prompt: `Batch generate image for: ${product.name}`,
            generatedAt: new Date(),
            userId: 'batch-process',
            companyId,
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          });
          
          results.errors++;
          results.details.push({
            productId: product.id,
            productName: product.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error in batch image generation:', error);
      throw error;
    }
  }

  static async updateProductImage(productId: number, companyId: number): Promise<{ success: boolean; imageUrl?: string; source?: 'gemini' | 'unsplash' | 'google'; error?: string }> {
    try {
      const product = await storage.getProduct(productId, companyId);
      
      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      const imageResult = await this.generateProductImage(
        product.name, 
        undefined, // category will be inferred from name/description
        product.description || undefined
      );
      
      if (imageResult) {
        const { url: imageUrl, source } = imageResult;
        await storage.updateProduct(productId, { imageUrl }, companyId);
        return { success: true, imageUrl, source };
      } else {
        return { success: false, error: 'No suitable image found' };
      }
    } catch (error) {
      console.error('Error updating product image:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}