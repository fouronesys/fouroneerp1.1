import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper function to extract and parse JSON from AI responses
function extractJSON(text: string): any {
  let jsonText = text.trim();
  
  // Remove markdown formatting
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  // Try to find JSON object within the text
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }
  
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('JSON parsing error:', error);
    return null;
  }
}

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

El código debe ser:
- Entre 4-8 caracteres
- Usar letras mayúsculas y números
- Fácil de recordar y escribir
- Único y profesional

Para productos dominicanos populares usa patrones como:
- BARC = Barceló
- BRUG = Brugal  
- PRES = Presidente
- MAMT = Mamajuana Típica

Responde solo con el código.`;

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
      const dataString = JSON.stringify(salesData.slice(0, 10));
      
      const prompt = `Analiza estos datos de ventas de una empresa dominicana:

${dataString}

Responde ÚNICAMENTE en formato JSON válido:
{
  "insights": ["insight1", "insight2", "insight3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "trends": "descripción de tendencias"
}

Incluye análisis sobre patrones de compra, productos populares y oportunidades. NO incluyas texto adicional fuera del JSON.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const result = extractJSON(responseText);
      
      return {
        insights: result?.insights || ["Los datos de ventas muestran patrones interesantes de consumo", "Se observan oportunidades de crecimiento", "Los productos dominicanos tienen buena aceptación"],
        recommendations: result?.recommendations || ["Optimizar inventario en horas pico", "Promover productos de mayor margen", "Implementar descuentos estratégicos"],
        trends: result?.trends || "Crecimiento sostenido con oportunidades de expansión"
      };
    } catch (error) {
      console.error('Error analyzing sales pattern:', error);
      return {
        insights: ["Los datos de ventas muestran patrones interesantes de consumo", "Se observan oportunidades de crecimiento", "Los productos dominicanos tienen buena aceptación"],
        recommendations: ["Optimizar inventario en horas pico", "Promover productos de mayor margen", "Implementar descuentos estratégicos"],
        trends: "Crecimiento sostenido con oportunidades de expansión"
      };
    }
  }

  static async optimizeInventory(products: any[], salesHistory: any[]): Promise<{
    lowStockAlerts: string[];
    restockSuggestions: string[];
    recommendations: string[];
  }> {
    try {
      const prompt = `Analiza este inventario y historial de ventas:

Productos: ${JSON.stringify(products.slice(0, 5))}
Ventas: ${JSON.stringify(salesHistory.slice(0, 10))}

Responde ÚNICAMENTE en formato JSON válido:
{
  "lowStockAlerts": ["alerta1", "alerta2"],
  "restockSuggestions": ["sugerencia1", "sugerencia2"],
  "recommendations": ["rec1", "rec2", "rec3"]
}

Considera productos dominicanos populares y patrones locales. NO incluyas texto adicional fuera del JSON.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const result = extractJSON(responseText);
      
      return {
        lowStockAlerts: result?.lowStockAlerts || ["Revisar niveles de inventario críticos", "Monitorear productos con alta rotación"],
        restockSuggestions: result?.restockSuggestions || ["Coordinar con proveedores locales", "Revisar términos de entrega"],
        recommendations: result?.recommendations || ["Implementar alertas automáticas", "Optimizar rotación de productos", "Analizar demanda estacional"]
      };
    } catch (error) {
      console.error('Error optimizing inventory:', error);
      return {
        lowStockAlerts: ["Revisar niveles de inventario críticos", "Monitorear productos con alta rotación"],
        restockSuggestions: ["Coordinar con proveedores locales", "Revisar términos de entrega"],
        recommendations: ["Implementar alertas automáticas", "Optimizar rotación de productos", "Analizar demanda estacional"]
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

Responde ÚNICAMENTE en formato JSON válido:
{
  "customerName": "nombre del cliente",
  "total": 123.45,
  "items": ["producto1", "producto2"],
  "date": "YYYY-MM-DD"
}

Si no encuentras un campo, omítelo del JSON. NO incluyas texto adicional fuera del JSON.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const result = extractJSON(responseText);
      
      return result || {};
    } catch (error) {
      console.error('Error extracting invoice data:', error);
      throw new Error('No se pudo extraer la información de la factura');
    }
  }
}