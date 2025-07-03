import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// AI Product Analysis Service
export class AIProductService {
  static async generateProductDescription(productName: string, category?: string, features?: string[]): Promise<string> {
    try {
      const prompt = `Como experto en productos dominicanos, genera una descripción profesional y atractiva para este producto:

Producto: ${productName}
${category ? `Categoría: ${category}` : ''}
${features?.length ? `Características: ${features.join(', ')}` : ''}

La descripción debe ser:
- Profesional y comercial
- Entre 50-100 palabras
- Enfocada en beneficios para el cliente
- Apropiada para el mercado dominicano
- Sin incluir precios

Responde solo con la descripción del producto.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      });

      return response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    } catch (error) {
      console.error('Error generating product description:', error);
      throw new Error('No se pudo generar la descripción del producto');
    }
  }

  static async generateProductCode(productName: string, category?: string, brand?: string): Promise<string> {
    try {
      const prompt = `Genera un código de producto profesional para:

Producto: ${productName}
${category ? `Categoría: ${category}` : ''}
${brand ? `Marca: ${brand}` : ''}

Reglas para el código:
- Máximo 8 caracteres
- Solo letras mayúsculas y números
- Basado en abreviaciones lógicas
- Fácil de recordar y escribir
- Ejemplo: Ron Barceló 750ml = BARC750

Responde solo con el código generado.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 50,
        messages: [{ role: 'user', content: prompt }]
      });

      return response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    } catch (error) {
      console.error('Error generating product code:', error);
      throw new Error('No se pudo generar el código del producto');
    }
  }
}

// AI Business Intelligence Service
export class AIBusinessService {
  static async analyzeSalesPattern(salesData: any[]): Promise<{
    insights: string[];
    recommendations: string[];
    trends: string;
  }> {
    try {
      const dataString = JSON.stringify(salesData.slice(0, 10)); // Limit data size
      
      const prompt = `Analiza estos datos de ventas de una empresa dominicana:

${dataString}

Proporciona:
1. 3 insights clave sobre patrones de ventas
2. 3 recomendaciones específicas para mejorar
3. Tendencias identificadas

Responde en formato JSON:
{
  "insights": ["insight1", "insight2", "insight3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "trends": "descripción de tendencias"
}`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '{}';
      
      // Clean the response text to remove markdown formatting
      const cleanedText = responseText.replace(/```json\s*|\s*```/g, '').trim();
      
      const result = JSON.parse(cleanedText);
      return result;
    } catch (error) {
      console.error('Error analyzing sales pattern:', error);
      // Return fallback structure instead of throwing error
      return {
        insights: ["Los datos de ventas están siendo procesados"],
        recommendations: ["Verifique los datos de entrada para obtener análisis más precisos"],
        trends: "Análisis en progreso"
      };
    }
  }

  static async optimizeInventory(products: any[], salesHistory: any[]): Promise<{
    lowStockAlerts: string[];
    overstockAlerts: string[];
    recommendations: string[];
  }> {
    try {
      // Filter out services and non-inventoriable products for inventory analysis
      const trackableProducts = products.filter(p => {
        const isStockless = p.productType === 'service' || 
                           p.productType === 'non_inventoriable' || 
                           p.trackInventory === false;
        return !isStockless;
      });

      const prompt = `Analiza este inventario y historial de ventas:

Productos con seguimiento de inventario: ${JSON.stringify(trackableProducts.slice(0, 5))}
Ventas: ${JSON.stringify(salesHistory.slice(0, 5))}

Nota: Los servicios y productos no inventariables están excluidos del análisis de stock.

Proporciona recomendaciones de inventario en JSON:
{
  "lowStockAlerts": ["producto con poco stock"],
  "overstockAlerts": ["producto con exceso"],
  "recommendations": ["recomendaciones específicas"]
}`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '{}';
      
      // Clean the response text to remove markdown formatting
      const cleanedText = responseText.replace(/```json\s*|\s*```/g, '').trim();
      
      const result = JSON.parse(cleanedText);
      return result;
    } catch (error) {
      console.error('Error optimizing inventory:', error);
      // Return fallback structure instead of throwing error
      return {
        lowStockAlerts: ["Revisando niveles de inventario"],
        overstockAlerts: ["Analizando productos con exceso de stock"],
        recommendations: ["Optimizando configuración de inventario"]
      };
    }
  }
}

// AI Chat Assistant Service
export class AIChatService {
  static async processQuery(userMessage: string, context: any = {}): Promise<string> {
    try {
      const prompt = `Eres un asistente experto del sistema ERP "Four One Solutions" para empresas dominicanas.

Contexto del usuario: ${JSON.stringify(context)}
Pregunta: ${userMessage}

Proporciona una respuesta útil, profesional y específica sobre:
- Gestión de productos e inventario
- Facturación y NCF (comprobantes fiscales dominicanos)
- Reportes y análisis de ventas
- Configuración del sistema
- Mejores prácticas empresariales

Mantén la respuesta concisa pero completa (máximo 200 palabras).`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      });

      return response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    } catch (error) {
      console.error('Error processing chat query:', error);
      throw new Error('No se pudo procesar la consulta');
    }
  }
}

// AI Document Processing Service
export class AIDocumentService {
  static async extractInvoiceData(text: string): Promise<{
    customerName?: string;
    total?: number;
    items?: string[];
    date?: string;
  }> {
    try {
      const prompt = `Extrae información de esta factura o documento:

${text}

Responde en JSON con los campos encontrados:
{
  "customerName": "nombre del cliente",
  "total": 123.45,
  "items": ["producto1", "producto2"],
  "date": "YYYY-MM-DD"
}

Si no encuentras un campo, omítelo del JSON.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      });

      return JSON.parse(response.content[0].type === 'text' ? response.content[0].text : '{}');
    } catch (error) {
      console.error('Error extracting invoice data:', error);
      throw new Error('No se pudo extraer datos del documento');
    }
  }
}