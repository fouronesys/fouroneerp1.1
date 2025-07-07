import * as fs from "fs";
import * as path from "path";
import { GoogleGenAI, Modality } from "@google/genai";
import sharp from 'sharp';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export class GeminiImageService {
  private static uploadsDir = path.join(process.cwd(), 'uploads', 'products');

  static async ensureUploadsDirectory() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  static async generateProductImage(
    productName: string, 
    category?: string,
    description?: string
  ): Promise<string | null> {
    try {
      await this.ensureUploadsDirectory();

      // Create a more descriptive prompt for better image generation
      let prompt = `Generate a professional product image for: ${productName}`;
      
      if (category) {
        prompt += ` in the ${category} category`;
      }
      
      if (description) {
        prompt += `. Product description: ${description}`;
      }
      
      prompt += `. Make it look professional, clean, with good lighting on a white or neutral background. The product should be clearly visible and attractive for e-commerce use.`;

      console.log(`Generating image with prompt: ${prompt}`);

      // Use Gemini 2.0 Flash model for image generation
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        console.error('No candidates returned from Gemini');
        return null;
      }

      const content = candidates[0].content;
      if (!content || !content.parts) {
        console.error('No content parts in response');
        return null;
      }

      // Process the response to find and save the image
      for (const part of content.parts) {
        if (part.inlineData && part.inlineData.data) {
          // Generate a filename based on product name
          const sanitizedName = productName.toLowerCase().replace(/[^a-z0-9]/g, '-');
          const timestamp = Date.now();
          const filename = `${sanitizedName}-${timestamp}.png`;
          const filepath = path.join(this.uploadsDir, filename);

          // Save the image data
          const imageData = Buffer.from(part.inlineData.data, "base64");
          
          // Optimize the image using sharp
          await sharp(imageData)
            .resize(800, 800, { 
              fit: 'inside',
              withoutEnlargement: true 
            })
            .png({ quality: 90 })
            .toFile(filepath);

          console.log(`Image saved to: ${filepath}`);
          
          // Return the full URL for the image that can be accessed by the frontend
          return `/uploads/products/${filename}`;
        }
      }

      console.error('No image data found in Gemini response');
      return null;
    } catch (error) {
      console.error('Error generating image with Gemini:', error);
      return null;
    }
  }

  static async batchGenerateImages(
    products: Array<{ id: number; name: string; category?: string; description?: string }>
  ): Promise<{
    total: number;
    processed: number;
    success: number;
    errors: number;
    details: Array<{ 
      productId: number; 
      productName: string; 
      success: boolean; 
      imageUrl?: string; 
      error?: string 
    }>;
  }> {
    const results = {
      total: products.length,
      processed: 0,
      success: 0,
      errors: 0,
      details: [] as Array<{ 
        productId: number; 
        productName: string; 
        success: boolean; 
        imageUrl?: string; 
        error?: string 
      }>
    };

    for (const product of products) {
      try {
        results.processed++;
        
        const imageUrl = await this.generateProductImage(
          product.name, 
          product.category, 
          product.description
        );
        
        if (imageUrl) {
          results.success++;
          results.details.push({
            productId: product.id,
            productName: product.name,
            success: true,
            imageUrl
          });
        } else {
          results.errors++;
          results.details.push({
            productId: product.id,
            productName: product.name,
            success: false,
            error: 'Failed to generate image'
          });
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
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
  }
}