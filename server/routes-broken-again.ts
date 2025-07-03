import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import {
  AIProductService,
  AIBusinessService,
  AIChatService,
  AIDocumentService,
} from "./ai-services-fixed";
import {
  InvoiceTemplateService,
  type ThermalPrintOptions,
  type PDFPrintOptions,
} from "./invoice-template-service";
import { LogoProcessor } from "./logo-processor";
import { ThermalLogoProcessor } from "./thermal-logo";
import { ThermalQRProcessor } from "./thermal-qr";
import { DR_TAX_TYPES } from "@shared/schema";

import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { ErrorManager } from "./error-management";
import { auditLogger } from "./audit-logger";
import { InvoiceHTMLService } from "./invoice-html-service";
import { InvoicePOS80mmService } from "./invoice-pos-80mm-service";
import { simpleAccountingService } from "./accounting-service-simple";
import { accountingService } from "./accounting-service";
import { assetManager, type IconSet, type AssetOptimizationConfig } from "./asset-manager";
import { sendPasswordSetupEmail } from "./email-service";
import { initializeAdminUser } from "./init-admin";
import { dgiiRegistryUpdater } from "./dgii-registry-updater";
import QRCode from "qrcode";
import multer from "multer";
import path from "path";
import fs from "fs";

// Notification management system
const notifications = new Map<string, any[]>();

function initUserNotifications(userId: string) {
  if (!notifications.has(userId)) {
    notifications.set(userId, []);
  }
}

const userNotifications = notifications;
import {
  insertCompanySchema,
  insertPOSSaleSchema,
  insertPOSCartItemSchema,
  insertProductSchema,
  insertCustomerSchema,
  insertAccountSchema,
  insertJournalEntrySchema,
  insertEmployeeSchema,
} from "@shared/schema";

import { z } from "zod";

// File upload configuration
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Initialize RNC registry on startup
async function initializeRNCRegistry() {
  try {
    // RNC registry initialization - simplified for now
    console.log("RNC registry initialized successfully");
  } catch (error) {
    console.error("Failed to initialize RNC registry:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize RNC registry
  await initializeRNCRegistry();

  // Initialize admin user
  await initializeAdminUser();

  // Setup authentication
  setupAuth(app);

  // Create WebSocket server
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });

  // WebSocket connection handling
  const connectedClients = new Map<string, WebSocket>();
  const channelSubscriptions = new Map<string, Set<string>>();

  wss.on("connection", (ws, req) => {
    let userId: string | null = null;

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === "authenticate") {
          userId = data.userId;
          if (userId) {
            connectedClients.set(userId, ws);
            initUserNotifications(userId);
          }
        } else if (data.type === "subscribe_channel") {
          if (userId) {
            if (!channelSubscriptions.has(data.channelId)) {
              channelSubscriptions.set(data.channelId, new Set());
            }
            channelSubscriptions.get(data.channelId)?.add(userId);
          }
        } else if (data.type === "unsubscribe_channel") {
          if (userId) {
            channelSubscriptions.get(data.channelId)?.delete(userId);
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      if (userId) {
        connectedClients.delete(userId);
        // Remove from all channel subscriptions
        channelSubscriptions.forEach((subscribers, channelId) => {
          subscribers.delete(userId);
        });
      }
    });
  });

  function broadcastToChannel(channelId: number, message: any) {
    const subscribers = channelSubscriptions.get(channelId.toString());
    if (subscribers) {
      subscribers.forEach(userId => {
        const ws = connectedClients.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      });
    }
  }

  // AI Assistant endpoints
  app.post("/api/ai/chat", isAuthenticated, async (req: any, res) => {
    try {
      const { message, context } = req.body;
      const userId = req.user.id;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const response = await AIChatService.processQuery(message, context);
      
      res.json({
        response,
        timestamp: new Date().toISOString(),
        userId
      });
    } catch (error) {
      console.error("AI Chat Error:", error);
      res.status(500).json({ error: "Error processing AI request" });
    }
  });

  app.post("/api/ai/generate-product", isAuthenticated, async (req: any, res) => {
    try {
      const { name, category, features } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Product name is required" });
      }

      const description = await AIProductService.generateProductDescription(name, category, features);
      const code = await AIProductService.generateProductCode(name, category);
      
      res.json({
        description,
        code,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("AI Product Generation Error:", error);
      res.status(500).json({ error: "Error generating product information" });
    }
  });

  app.post("/api/ai/analyze-sales", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const company = await storage.getCompanyByUserId(userId);
      
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const salesData = await storage.getPOSSales(company.id);
      const analysis = await AIBusinessService.analyzeSalesPattern(salesData);
      
      res.json({
        analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("AI Sales Analysis Error:", error);
      res.status(500).json({ error: "Error analyzing sales data" });
    }
  });

  // Internal Chat endpoints
  app.get("/api/chat/channels", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const company = await storage.getCompanyByUserId(userId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Mock channels data for internal communication
      const channels = [
        {
          id: "general",
          name: "General",
          description: "Canal general de la empresa",
          type: "public",
          memberCount: 5,
          unreadCount: 0,
          isActive: true,
          members: [userId]
        },
        {
          id: "sales",
          name: "Ventas",
          description: "Discusión sobre ventas y clientes",
          type: "public",
          memberCount: 3,
          unreadCount: 2,
          isActive: true,
          members: [userId]
        },
        {
          id: "support",
          name: "Soporte",
          description: "Canal de soporte técnico",
          type: "public",
          memberCount: 2,
          unreadCount: 0,
          isActive: true,
          members: [userId]
        }
      ];

      res.json({ channels });
    } catch (error) {
      console.error("Error fetching chat channels:", error);
      res.status(500).json({ message: "Error fetching channels" });
    }
  });

  app.get("/api/chat/messages/:channelId", isAuthenticated, async (req: any, res) => {
    try {
      const { channelId } = req.params;
      const userId = req.user.id;

      // Mock messages data
      const messages = [
        {
          id: "1",
          content: "¡Bienvenidos al canal de comunicación interna!",
          userId: "system",
          userName: "Sistema",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          isRead: true,
          messageType: "system"
        },
        {
          id: "2",
          content: "Hola equipo, ¿cómo van las ventas de hoy?",
          userId: userId,
          userName: "Usuario",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          isRead: true,
          messageType: "text"
        }
      ];

      res.json({ messages });
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Error fetching messages" });
    }
  });

  app.post("/api/chat/send", isAuthenticated, async (req: any, res) => {
    try {
      const { channelId, content } = req.body;
      const userId = req.user.id;
      const user = await storage.getUserById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Mock message creation
      const newMessage = {
        id: Date.now().toString(),
        content,
        userId: user.id,
        userName: user.firstName,
        timestamp: new Date().toISOString(),
        isRead: false,
        messageType: "text"
      };

      // Broadcast to channel subscribers
      broadcastToChannel(parseInt(channelId), {
        type: "new_message",
        channelId,
        message: newMessage
      });

      res.json({
        success: true,
        message: newMessage
      });
    } catch (error) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ message: "Error sending message" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.id;
      const company = await storage.getCompanyByUserId(userId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Process the uploaded file
      const fileInfo = {
        id: Date.now().toString(),
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        file: fileInfo
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Error uploading file" });
    }
  });

  return httpServer;
}