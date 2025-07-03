import { storage } from "./storage";
import bcrypt from "bcrypt";

// Initialize admin user and system
export async function initializeAdminUser() {
  try {
    console.log("Initializing super admin user and company...");
    
    // Check if admin user already exists
    try {
      const existingAdmin = await storage.getUserByEmail("admin@fourone.com.do");
      if (existingAdmin) {
        console.log("Super admin user already exists");
        return true;
      }
    } catch (error) {
      console.log("No existing admin found, creating new one...");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash("PSzorro99**", 10);

    // Create super admin user first
    const adminUserId = `admin-${Date.now()}`;
    const adminData = {
      id: adminUserId,
      email: "admin@fourone.com.do",
      password: hashedPassword,
      firstName: "Super",
      lastName: "Admin",
      role: "super_admin",
      isActive: true,
      phoneNumber: "8293519324"
    };

    const adminUser = await storage.createUser(adminData);
    console.log("Created super admin user:", adminUser.email);

    // Create the company with the admin as owner
    const companyData = {
      name: "Four One Solutions",
      rnc: "132123456",
      address: "Av. Winston Churchill, Santo Domingo",
      phone: "8293519324",
      email: "jesus@fourone.com",
      website: "https://fourone.com.do",
      ownerId: adminUser.id
    };

    const company = await storage.createCompany(companyData);
    console.log("Created main company:", company.name);

    // Create company-user relationship
    await storage.createCompanyUser({
      userId: adminUser.id,
      companyId: company.id,
      role: "company_admin",
      permissions: ["all"], // Super admin has all permissions
      isActive: true
    });

    // No sample products - system starts clean for production
    console.log("System initialized without sample data - ready for production use");

    // No sample customers - system starts clean for production
    console.log("System ready for production - no sample data created");

    console.log("Super admin initialization completed successfully");
    return true;
  } catch (error) {
    console.error("Error initializing super admin:", error);
    return false;
  }
}