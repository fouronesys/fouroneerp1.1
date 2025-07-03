// Frontend Error Logger
// Automatically logs frontend errors to the backend error management system

interface ErrorLogData {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  companyId?: number;
  context?: any;
}

class FrontendErrorLogger {
  private static instance: FrontendErrorLogger;
  private userId?: string;
  private companyId?: number;

  public static getInstance(): FrontendErrorLogger {
    if (!FrontendErrorLogger.instance) {
      FrontendErrorLogger.instance = new FrontendErrorLogger();
    }
    return FrontendErrorLogger.instance;
  }

  // Set user context for error logging
  public setUserContext(userId: string, companyId: number) {
    this.userId = userId;
    this.companyId = companyId;
  }

  // Log error to backend
  public async logError(error: Error, context?: any): Promise<void> {
    try {
      const errorData: ErrorLogData = {
        message: error.message,
        stack: error.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.userId,
        companyId: this.companyId,
        context
      };

      // Send to backend error management API
      await fetch('/api/errors/frontend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      });
    } catch (logError) {
      // Fallback to console if backend logging fails
      console.error('Failed to log error to backend:', logError);
      console.error('Original error:', error);
    }
  }

  // Initialize global error handlers
  public initializeGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      // Filter out WebSocket errors that are expected during development
      const message = event.reason?.message || 'Unhandled Promise Rejection';
      if (message.includes('WebSocket') || message.includes('wss://localhost:undefined')) {
        // Prevent WebSocket development errors from being logged
        event.preventDefault();
        return;
      }
      
      const error = new Error(message);
      error.stack = event.reason?.stack;
      this.logError(error, {
        type: 'unhandledrejection',
        reason: event.reason
      });
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      const error = new Error(event.message);
      error.stack = `${event.filename}:${event.lineno}:${event.colno}`;
      this.logError(error, {
        type: 'javascript_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Handle React errors (if using React error boundaries)
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Check if this is a React error
      const message = args[0]?.toString() || '';
      if (message.includes('React') || message.includes('component')) {
        const error = new Error(message);
        this.logError(error, {
          type: 'react_error',
          args: args.slice(1)
        });
      }
      originalConsoleError.apply(console, args);
    };
  }
}

// Export singleton instance
export const errorLogger = FrontendErrorLogger.getInstance();

// React Error Boundary helper
export class ErrorBoundary extends Error {
  constructor(message: string, componentStack?: string) {
    super(message);
    this.name = 'ErrorBoundary';
    this.stack = componentStack;
  }
}

// Utility function to wrap async functions with error logging
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: any
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorLogger.logError(error as Error, {
        ...context,
        functionName: fn.name,
        arguments: args
      });
      throw error; // Re-throw to maintain normal error handling
    }
  }) as T;
}

// Utility function to wrap sync functions with error logging
export function withSyncErrorLogging<T extends (...args: any[]) => any>(
  fn: T,
  context?: any
): T {
  return ((...args: any[]) => {
    try {
      return fn(...args);
    } catch (error) {
      errorLogger.logError(error as Error, {
        ...context,
        functionName: fn.name,
        arguments: args
      });
      throw error; // Re-throw to maintain normal error handling
    }
  }) as T;
}

export default errorLogger;