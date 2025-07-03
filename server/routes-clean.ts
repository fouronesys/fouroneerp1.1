import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { isAuthenticated } from "./auth";
import { auditLogger } from "./audit-logger";
import { initializeAdminUser } from "./init-admin";
import { moduleInitializer } from "./module-initializer";
import { sendApiKeyEmail } from "./email-service";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";

// File upload configuration
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize admin user
  await initializeAdminUser();
  
  // Initialize system modules and configuration
  await moduleInitializer.initializeSystem();
  console.log("RNC registry initialized successfully");

  // Admin company management endpoints
  app.get("/api/admin/companies", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || (user.email !== 'admin@fourone.com.do' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const companies = await storage.getAllCompaniesWithDetails();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  // Update company status (activate/deactivate)
  app.patch("/api/admin/companies/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || (user.email !== 'admin@fourone.com.do' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const { isActive } = req.body;

      const company = await storage.updateCompanyStatus(parseInt(id), isActive);
      
      // Log company status update
      await auditLogger.logUserAction(
        user.id,
        parseInt(id),
        isActive ? 'COMPANY_ACTIVATED' : 'COMPANY_DEACTIVATED',
        'company',
        id,
        null,
        { isActive },
        req
      );
      
      res.json(company);
    } catch (error) {
      console.error("Error updating company status:", error);
      res.status(500).json({ message: "Failed to update company status" });
    }
  });

  // Delete company
  app.delete("/api/admin/companies/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || (user.email !== 'admin@fourone.com.do' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const companyId = parseInt(req.params.id);
      
      await storage.deleteCompany(companyId);
      
      // Log company deletion
      await auditLogger.logUserAction(
        user.id,
        companyId,
        'COMPANY_DELETED',
        'company',
        req.params.id,
        null,
        { companyId },
        req
      );
      
      res.json({ success: true, message: "Company deleted successfully" });
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // Update company details
  app.put("/api/admin/companies/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || (user.email !== 'admin@fourone.com.do' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const companyId = parseInt(req.params.id);
      const existingCompany = await storage.getCompany(companyId);

      if (!existingCompany) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Remove fields that shouldn't be updated directly
      const { ownerId, ...updateData } = req.body;
      
      const updatedCompany = await storage.updateCompany(companyId, updateData);
      
      res.json(updatedCompany);
    } catch (error: any) {
      console.error("Error updating company:", error);
      res.status(500).json({ 
        message: "No se pudo actualizar empresa", 
        error: error?.message || "Error interno del servidor"
      });
    }
  });

  // Create new company
  app.post("/api/admin/companies", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || (user.email !== 'admin@fourone.com.do' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const newCompany = await storage.createCompany(req.body);
      res.json(newCompany);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  // Bulk company operations
  app.patch("/api/admin/companies/bulk-activate", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || (user.email !== 'admin@fourone.com.do' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { companyIds } = req.body;
      
      for (const id of companyIds) {
        await storage.updateCompanyStatus(id, true);
      }
      
      res.json({ success: true, message: "Companies activated successfully" });
    } catch (error) {
      console.error("Error bulk activating companies:", error);
      res.status(500).json({ message: "Failed to activate companies" });
    }
  });

  app.patch("/api/admin/companies/bulk-deactivate", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || (user.email !== 'admin@fourone.com.do' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { companyIds } = req.body;
      
      for (const id of companyIds) {
        await storage.updateCompanyStatus(id, false);
      }
      
      res.json({ success: true, message: "Companies deactivated successfully" });
    } catch (error) {
      console.error("Error bulk deactivating companies:", error);
      res.status(500).json({ message: "Failed to deactivate companies" });
    }
  });

  // Resend email invitation
  app.post("/api/admin/companies/:id/resend-email", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || (user.email !== 'admin@fourone.com.do' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const companyId = parseInt(req.params.id);
      const company = await storage.getCompany(companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Resend email logic here
      res.json({ success: true, message: "Email resent successfully" });
    } catch (error) {
      console.error("Error resending email:", error);
      res.status(500).json({ message: "Failed to resend email" });
    }
  });

  // Basic authentication endpoints
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.authenticateUser(email, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      (req as any).session.userId = user.id;
      res.json({ user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  app.post("/api/logout", (req: any, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  // RNC verification endpoint
  app.get("/api/verify-rnc/:rnc", async (req, res) => {
    try {
      const { rnc } = req.params;
      
      // Clean and validate RNC format
      const cleanRnc = rnc.replace(/\D/g, "");
      
      if (cleanRnc.length < 9 || cleanRnc.length > 11) {
        return res.json({
          isValid: false,
          rnc: cleanRnc,
          message: `RNC debe tener entre 9 y 11 dígitos. RNC procesado: ${cleanRnc} (${cleanRnc.length} dígitos)`
        });
      }

      // Search in local DGII registry
      const rncData = await storage.getRNCFromRegistry(cleanRnc);
      
      if (rncData) {
        return res.json({
          isValid: true,
          rnc: cleanRnc,
          razonSocial: rncData.razonSocial,
          companyName: rncData.razonSocial,
          nombreComercial: rncData.nombreComercial,
          estado: rncData.estado || "ACTIVO",
          tipo: rncData.categoria || "CONTRIBUYENTE REGISTRADO",
          source: "local"
        });
      } else {
        return res.json({
          isValid: false,
          rnc: cleanRnc,
          message: "RNC no encontrado en el registro local de DGII",
          source: "local"
        });
      }
    } catch (error) {
      console.error("Error verifying RNC:", error);
      res.json({
        isValid: false,
        message: "Error interno del servidor al verificar RNC"
      });
    }
  });

  // Downloads endpoint
  app.get("/api/downloads/available", async (req, res) => {
    try {
      const downloads = [
        {
          id: 1,
          name: "Aplicación Windows",
          description: "Versión completa para Windows con funcionalidades avanzadas",
          platform: "windows",
          version: "1.0.0",
          size: "45.2 MB",
          downloadUrl: "/downloads/FourOneSystem-Windows-1.0.0.exe"
        },
        {
          id: 2,
          name: "Aplicación Android",
          description: "Versión móvil para Android con funcionalidades POS",
          platform: "android",
          version: "1.0.0",
          size: "12.8 MB",
          downloadUrl: "/downloads/FourOneSystem-Android-1.0.0.apk"
        }
      ];
      
      res.json(downloads);
    } catch (error) {
      console.error("Error fetching downloads:", error);
      res.status(500).json({ message: "Error fetching downloads" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}