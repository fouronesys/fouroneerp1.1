import Anthropic from '@anthropic-ai/sdk';
import { db } from './db';
import { errorLogs } from '@shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ErrorContext {
  userId?: string;
  companyId?: number;
  userAgent?: string;
  url?: string;
  method?: string;
  body?: any;
  query?: any;
  headers?: any;
  sessionId?: string;
  timestamp: Date;
}

export interface ErrorLogEntry {
  id?: number;
  errorId: string;
  message: string;
  stack: string;
  type: 'frontend' | 'backend' | 'database' | 'api' | 'validation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: ErrorContext;
  userId?: string;
  companyId?: number;
  resolved: boolean;
  aiAnalysis?: string;
  suggestedFix?: string;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export class ErrorManager {
  private static instance: ErrorManager;

  public static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }

  // Generate unique error ID
  private generateErrorId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Determine error severity based on error type and context
  private determineSeverity(error: Error, context: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Critical errors
    if (
      message.includes('database') ||
      message.includes('connection') ||
      message.includes('authentication') ||
      message.includes('authorization') ||
      stack.includes('uncaught') ||
      stack.includes('unhandled')
    ) {
      return 'critical';
    }

    // High severity errors
    if (
      message.includes('payment') ||
      message.includes('fiscal') ||
      message.includes('invoice') ||
      message.includes('pos') ||
      message.includes('ncf') ||
      context.url?.includes('/api/pos/') ||
      context.url?.includes('/api/fiscal/')
    ) {
      return 'high';
    }

    // Medium severity errors
    if (
      message.includes('validation') ||
      message.includes('not found') ||
      message.includes('forbidden') ||
      context.method === 'POST' ||
      context.method === 'PUT' ||
      context.method === 'DELETE'
    ) {
      return 'medium';
    }

    // Default to low severity
    return 'low';
  }

  // Determine error type based on context and stack trace
  private determineErrorType(error: Error, context: ErrorContext): 'frontend' | 'backend' | 'database' | 'api' | 'validation' {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('database') || message.includes('sql') || stack.includes('drizzle') || stack.includes('neon')) {
      return 'database';
    }

    if (message.includes('validation') || message.includes('required') || message.includes('invalid')) {
      return 'validation';
    }

    if (context.url?.startsWith('/api/')) {
      return 'api';
    }

    if (stack.includes('client') || context.userAgent) {
      return 'frontend';
    }

    return 'backend';
  }

  // AI-powered error analysis
  private async analyzeErrorWithAI(error: Error, context: ErrorContext): Promise<{ analysis: string; suggestedFix: string }> {
    try {
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        type: this.determineErrorType(error, context),
        url: context.url,
        method: context.method,
        userAgent: context.userAgent,
        timestamp: context.timestamp.toISOString()
      };

      const prompt = `
Analiza este error de aplicación y proporciona:
1. Un análisis detallado del problema
2. Una solución sugerida paso a paso
3. Medidas preventivas para evitar que ocurra nuevamente

Error Details:
${JSON.stringify(errorDetails, null, 2)}

Contexto: Esta es una aplicación empresarial para empresas dominicanas que incluye POS, facturación, contabilidad y cumplimiento fiscal DGII.

Responde en español con formato JSON:
{
  "analysis": "análisis detallado del error",
  "suggestedFix": "solución paso a paso",
  "prevention": "medidas preventivas"
}
`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Expected text response from AI');
      }
      
      let aiResponse;
      try {
        aiResponse = JSON.parse(content.text);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', content.text);
        throw new Error('AI response is not valid JSON');
      }
      
      return {
        analysis: `${aiResponse.analysis}\n\nPrevención: ${aiResponse.prevention}`,
        suggestedFix: aiResponse.suggestedFix
      };
    } catch (aiError) {
      console.error('Error in AI analysis:', aiError);
      return {
        analysis: 'Error automático detectado. Análisis de IA no disponible.',
        suggestedFix: 'Revisar logs del sistema y contactar soporte técnico si el problema persiste.'
      };
    }
  }

  // Log error to database with AI analysis
  public async logError(error: Error, context: ErrorContext): Promise<string> {
    const errorId = this.generateErrorId();
    const severity = this.determineSeverity(error, context);
    const type = this.determineErrorType(error, context);

    try {
      // Disable AI analysis temporarily due to API key issues
      let aiAnalysis = 'AI analysis disabled - no API key configured';
      let suggestedFix = 'Check system logs for detailed error information';

      // Save to database
      await db.insert(errorLogs).values({
        errorId,
        message: error.message,
        stack: error.stack || '',
        type,
        severity,
        context: JSON.stringify(context),
        userId: context.userId,
        companyId: context.companyId,
        resolved: false,
        aiAnalysis,
        suggestedFix,
        createdAt: new Date()
      });

      // Log to console for immediate visibility
      console.error(`[${severity.toUpperCase()}] ${errorId}: ${error.message}`, {
        type,
        context: context.url,
        userId: context.userId,
        companyId: context.companyId
      });

      return errorId;
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError);
      // Fallback to console logging
      console.error(`[FALLBACK] ${errorId}: ${error.message}`, { context, originalError: error });
      return errorId;
    }
  }

  // Get error logs with filters
  public async getErrorLogs(filters: {
    companyId?: number;
    severity?: string;
    type?: string;
    resolved?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    const { companyId, severity, type, resolved, limit = 50, offset = 0 } = filters;

    const conditions = [];
    if (companyId) conditions.push(eq(errorLogs.companyId, companyId));
    if (severity) conditions.push(eq(errorLogs.severity, severity));
    if (type) conditions.push(eq(errorLogs.type, type));
    if (resolved !== undefined) conditions.push(eq(errorLogs.resolved, resolved));

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select()
      .from(errorLogs)
      .where(whereCondition)
      .orderBy(desc(errorLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(log => ({
      ...log,
      context: JSON.parse(log.context),
      createdAt: log.createdAt,
      resolvedAt: log.resolvedAt || undefined
    }));
  }

  // Mark error as resolved
  public async resolveError(errorId: string, resolvedBy: string): Promise<boolean> {
    try {
      const result = await db
        .update(errorLogs)
        .set({ 
          resolved: true, 
          resolvedAt: new Date(),
          resolvedBy 
        })
        .where(eq(errorLogs.errorId, errorId));

      return true;
    } catch (error) {
      console.error('Failed to resolve error:', error);
      return false;
    }
  }

  // Get error statistics
  public async getErrorStats(companyId?: number): Promise<{
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    resolved: number;
    unresolved: number;
    last24h: number;
  }> {
    try {
      const conditions = companyId ? [eq(errorLogs.companyId, companyId)] : [];
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [total, critical, high, medium, low, resolved, last24hCount] = await Promise.all([
        db.select().from(errorLogs).where(conditions.length ? and(...conditions) : undefined),
        db.select().from(errorLogs).where(and(eq(errorLogs.severity, 'critical'), ...(conditions as any))),
        db.select().from(errorLogs).where(and(eq(errorLogs.severity, 'high'), ...(conditions as any))),
        db.select().from(errorLogs).where(and(eq(errorLogs.severity, 'medium'), ...(conditions as any))),
        db.select().from(errorLogs).where(and(eq(errorLogs.severity, 'low'), ...(conditions as any))),
        db.select().from(errorLogs).where(and(eq(errorLogs.resolved, true), ...(conditions as any))),
        db.select().from(errorLogs).where(and(gte(errorLogs.createdAt, last24h), ...(conditions as any)))
      ]);

      return {
        total: total.length,
        critical: critical.length,
        high: high.length,
        medium: medium.length,
        low: low.length,
        resolved: resolved.length,
        unresolved: total.length - resolved.length,
        last24h: last24hCount.length
      };
    } catch (error) {
      console.error('Failed to get error stats:', error);
      return {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        resolved: 0,
        unresolved: 0,
        last24h: 0
      };
    }
  }
}

// Extended Error interface for Express
interface ExtendedError extends Error {
  status?: number;
}

// Global error handler middleware for Express
export function errorHandlerMiddleware(err: ExtendedError, req: any, res: any, next: any) {
  const errorManager = ErrorManager.getInstance();
  
  const context: ErrorContext = {
    userId: req.user?.id,
    companyId: req.user?.companyId,
    userAgent: req.get('User-Agent'),
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    query: req.query,
    headers: req.headers,
    sessionId: req.sessionID,
    timestamp: new Date()
  };

  // Log error asynchronously
  errorManager.logError(err, context).catch(console.error);

  // Send appropriate response
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Error interno del servidor' 
    : err.message;

  res.status(status).json({
    error: true,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

// Frontend error handler
export function logFrontendError(error: Error, context: Partial<ErrorContext> = {}) {
  const errorManager = ErrorManager.getInstance();
  
  const fullContext: ErrorContext = {
    ...context,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date()
  };

  return errorManager.logError(error, fullContext);
}

export default ErrorManager;