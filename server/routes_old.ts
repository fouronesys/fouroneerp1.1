import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertCompanySchema,
  insertCustomerSchema, 
  insertProductSchema,
  insertInvoiceSchema,
  insertProductionOrderSchema,
  insertBOMSchema,
  insertPOSSaleSchema,
  insertPOSSaleItemSchema,
  insertPOSPrintSettingsSchema
} from "@shared/schema";

// Función para crear datos de ejemplo
async function createSampleData(companyId: number) {
  try {
    // Crear productos de ejemplo
    const sampleProducts = [
      {
        code: "CAFE001",
        name: "Café Premium Dominicano",
        description: "Café de alta calidad de las montañas dominicanas",
        price: "250.00",
        cost: "120.00",
        stock: 100,
        minStock: 10,
        unit: "lb",
        companyId
      },
      {
        code: "AZUC001", 
        name: "Azúcar Blanca",
        description: "Azúcar refinada nacional",
        price: "45.00",
        cost: "25.00", 
        stock: 200,
        minStock: 20,
        unit: "lb",
        companyId
      },
      {
        code: "LECH001",
        name: "Leche Entera",
        description: "Leche fresca pasteurizada",
        price: "65.00",
        cost: "40.00",
        stock: 50,
        minStock: 5,
        unit: "lt",
        companyId
      }
    ];

    for (const product of sampleProducts) {
      await storage.createProduct(product);
    }

    // Crear clientes de ejemplo
    const sampleCustomers = [
      {
        name: "Juan Pérez",
        type: "individual",
        cedula: "00112345678",
        phone: "(809) 555-1234",
        email: "juan.perez@email.com",
        address: "Calle Principal #123, Santo Domingo",
        companyId
      },
      {
        name: "Supermercado La Económica",
        type: "company", 
        rnc: "101234567",
        phone: "(809) 555-5678",
        email: "ventas@laeconomica.com",
        address: "Av. Independencia #456, Santiago",
        companyId
      }
    ];

    for (const customer of sampleCustomers) {
      await storage.createCustomer(customer);
    }

    console.log("Sample data created successfully");
  } catch (error) {
    console.error("Error creating sample data:", error);
  }
}
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Company routes
  app.post("/api/companies", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const companyData = insertCompanySchema.parse({ ...req.body, ownerId: userId });
      const company = await storage.createCompany(companyData);
      res.json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.get("/api/companies/current", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let company = await storage.getCompanyByUserId(userId);
      
      // Si no existe empresa, crear una por defecto
      if (!company) {
        const defaultCompany = {
          ownerId: userId,
          name: "Mi Empresa",
          rnc: "",
          address: "",
          phone: "",
          email: req.user.claims.email || "",
        };
        company = await storage.createCompany(defaultCompany);
        
        // Crear datos de ejemplo para demostración
        await createSampleData(company.id);
      }
      
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.put("/api/companies/current", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      const updateData = insertCompanySchema.parse({ ...req.body, ownerId: userId });
      const updatedCompany = await storage.updateCompany(company.id, updateData);
      res.json(updatedCompany);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Company routes
  app.post("/api/companies", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const companyData = insertCompanySchema.parse({ ...req.body, ownerId: userId });
      const company = await storage.createCompany(companyData);
      res.json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.get("/api/companies/current", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  // Customer routes
  app.get("/api/customers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const customers = await storage.getCustomers(company.id);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const customerData = insertCustomerSchema.parse({ ...req.body, companyId: company.id });
      const customer = await storage.createCustomer(customerData);
      res.json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const customerId = parseInt(req.params.id);
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(customerId, customerData, company.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const customerId = parseInt(req.params.id);
      await storage.deleteCustomer(customerId, company.id);
      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Product routes
  app.get("/api/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const products = await storage.getProducts(company.id);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const productData = insertProductSchema.parse({ ...req.body, companyId: company.id });
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const productId = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(productId, productData, company.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const productId = parseInt(req.params.id);
      await storage.deleteProduct(productId, company.id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const invoices = await storage.getInvoices(company.id);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const invoiceData = insertInvoiceSchema.parse({ ...req.body, companyId: company.id });
      const invoice = await storage.createInvoice(invoiceData);
      res.json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // Production Order routes
  app.get("/api/production-orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const orders = await storage.getProductionOrders(company.id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching production orders:", error);
      res.status(500).json({ message: "Failed to fetch production orders" });
    }
  });

  app.post("/api/production-orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const orderData = insertProductionOrderSchema.parse({ ...req.body, companyId: company.id });
      const order = await storage.createProductionOrder(orderData);
      res.json(order);
    } catch (error) {
      console.error("Error creating production order:", error);
      res.status(500).json({ message: "Failed to create production order" });
    }
  });

  // BOM routes
  app.get("/api/bom/:productId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const productId = parseInt(req.params.productId);
      const bomItems = await storage.getBOMByProduct(productId, company.id);
      res.json(bomItems);
    } catch (error) {
      console.error("Error fetching BOM:", error);
      res.status(500).json({ message: "Failed to fetch BOM" });
    }
  });

  app.post("/api/bom", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const bomData = insertBOMSchema.parse({ ...req.body, companyId: company.id });
      const bomItem = await storage.createBOMItem(bomData);
      res.json(bomItem);
    } catch (error) {
      console.error("Error creating BOM item:", error);
      res.status(500).json({ message: "Failed to create BOM item" });
    }
  });

  app.put("/api/bom/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const bomId = parseInt(req.params.id);
      const bomData = insertBOMSchema.partial().parse(req.body);
      const bomItem = await storage.updateBOMItem(bomId, bomData, company.id);
      if (!bomItem) {
        return res.status(404).json({ message: "BOM item not found" });
      }
      res.json(bomItem);
    } catch (error) {
      console.error("Error updating BOM item:", error);
      res.status(500).json({ message: "Failed to update BOM item" });
    }
  });

  app.delete("/api/bom/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const bomId = parseInt(req.params.id);
      await storage.deleteBOMItem(bomId, company.id);
      res.json({ message: "BOM item deleted successfully" });
    } catch (error) {
      console.error("Error deleting BOM item:", error);
      res.status(500).json({ message: "Failed to delete BOM item" });
    }
  });

  // POS routes
  app.get("/api/pos/sales", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const sales = await storage.getPOSSales(company.id);
      res.json(sales);
    } catch (error) {
      console.error("Error fetching POS sales:", error);
      res.status(500).json({ message: "Failed to fetch POS sales" });
    }
  });

  app.post("/api/pos/sales", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      const { items, ...saleData } = req.body;
      
      // Generate sale number
      const saleCount = await storage.getPOSSales(company.id);
      const saleNumber = `POS-${String(saleCount.length + 1).padStart(6, '0')}`;
      
      const saleToCreate = insertPOSSaleSchema.parse({ 
        ...saleData, 
        companyId: company.id,
        saleNumber 
      });
      
      const sale = await storage.createPOSSale(saleToCreate);
      
      // Create sale items
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const itemData = insertPOSSaleItemSchema.parse({ ...item, saleId: sale.id });
          await storage.createPOSSaleItem(itemData);
        }
      }
      
      res.json(sale);
    } catch (error) {
      console.error("Error creating POS sale:", error);
      res.status(500).json({ message: "Failed to create POS sale" });
    }
  });

  app.get("/api/pos/sales/:id/items", isAuthenticated, async (req: any, res) => {
    try {
      const saleId = parseInt(req.params.id);
      const items = await storage.getPOSSaleItems(saleId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching POS sale items:", error);
      res.status(500).json({ message: "Failed to fetch POS sale items" });
    }
  });

  app.get("/api/pos/print-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const settings = await storage.getPOSPrintSettings(company.id);
      res.json(settings || { printerWidth: "80mm", showNCF: true, showCustomerInfo: true });
    } catch (error) {
      console.error("Error fetching POS print settings:", error);
      res.status(500).json({ message: "Failed to fetch POS print settings" });
    }
  });

  app.post("/api/pos/print-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const settingsData = insertPOSPrintSettingsSchema.parse({ ...req.body, companyId: company.id });
      const settings = await storage.upsertPOSPrintSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating POS print settings:", error);
      res.status(500).json({ message: "Failed to update POS print settings" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const metrics = await storage.getDashboardMetrics(company.id);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
