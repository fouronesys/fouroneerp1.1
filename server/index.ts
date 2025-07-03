import "./memory-optimization"; // Import memory optimization first
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandlerMiddleware } from "./error-management";
import { dgiiRegistryUpdater } from "./dgii-registry-updater";
import { dgiiMonitor } from "./dgii-monitor";
import { initializeOptimizedSystem } from "./init-optimized";

// Set server timezone to GMT-4:00 (Atlantic Standard Time / Dominican Republic)
process.env.TZ = 'America/Santo_Domingo';

const app = express();

// Enhanced JSON parsing with error handling
app.use(express.json({ 
  limit: '50mb'
}));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// JSON error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof SyntaxError && 'body' in error) {
    console.error('[JSON PARSE ERROR] Invalid JSON:', error.message);
    console.error('[JSON PARSE ERROR] Request path:', req.path);
    console.error('[JSON PARSE ERROR] Request method:', req.method);
    return res.status(400).json({ message: 'Invalid JSON format in request body' });
  }
  next();
});

// Debug middleware to log all requests
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`[DEBUG] ${req.method} ${req.path} - Body:`, req.body);
    
    // Extra debugging for customer endpoints
    if (req.path.includes('/customers/') && req.method === 'PUT') {
      console.log('[DEBUG] PUT Customer body keys:', Object.keys(req.body || {}));
      console.log('[DEBUG] PUT Customer content-type:', req.headers['content-type']);
      console.log('[DEBUG] PUT Customer raw body type:', typeof req.body);
    }
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Test database connection first
    const { testDatabaseConnection } = await import("./db");
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
      console.error("Failed to connect to database. Exiting...");
      process.exit(1);
    }

    const server = await registerRoutes(app);

    // Global error handler middleware
    app.use(errorHandlerMiddleware);

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, async () => {
      log(`serving on port ${port}`);
      
      // Initialize optimized RNC system
      try {
        await initializeOptimizedSystem();
        log("Optimized RNC system initialized with database queries");
      } catch (error) {
        console.warn("Failed to initialize optimized RNC system:", error);
      }
      
      // Start the DGII registry auto-updater (only after successful DB connection)
      try {
        dgiiRegistryUpdater.startAutoUpdate();
        log("DGII RNC registry system initialized with auto-update enabled");
      } catch (error) {
        console.warn("DGII registry updater failed to start:", error);
      }
      
      // Start DGII server monitoring
      try {
        dgiiMonitor.startMonitoring();
        dgiiMonitor.on('server_online', (status) => {
          log(`DGII server is online - Response time: ${status.responseTime}ms`);
        });
        dgiiMonitor.on('server_offline', (status) => {
          log(`DGII server is offline - Last error: ${status.lastError}`);
        });
      } catch (error) {
        console.warn("DGII monitor failed to start:", error);
      }

      // Initialize automatic backup system - TEMPORARILY DISABLED
      // The backup system is causing memory crashes when backing up 772K RNC records
      // TODO: Re-enable after implementing streaming backup
      /*
      (async () => {
        try {
          const { ScheduledBackupService } = await import("./scheduled-backup");
          const scheduledBackup = new ScheduledBackupService();
          await scheduledBackup.initialize();
        } catch (error) {
          console.warn("Scheduled backup system failed to initialize:", error);
        }
      })();
      */
    });
  } catch (error) {
    console.error("Application startup failed:", error);
    process.exit(1);
  }
})();
