import { useQuery } from "@tanstack/react-query";
import type { Company } from "@shared/schema";

export interface SubscriptionPlan {
  name: string;
  features: string[];
  maxUsers: number;
  maxCompanies: number;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  monthly: {
    name: "Plan Mensual",
    features: [
      "dashboard", "pos", "customers", "products", "invoices", "reports", 
      "warehouses", "manufacturing", "bom", "movements", "suppliers", 
      "purchase-orders", "admin", "companies", "company-settings", "super-admin",
      "employees", "payroll", "time-tracking", "leaves", "notifications",
      "settings", "profile", "billing", "pos-sales"
    ],
    maxUsers: 50,
    maxCompanies: 10,
  },
  annual: {
    name: "Plan Anual",
    features: [
      "dashboard", "pos", "customers", "products", "invoices", "reports", 
      "warehouses", "manufacturing", "bom", "movements", "suppliers", 
      "purchase-orders", "admin", "companies", "company-settings", "super-admin",
      "employees", "payroll", "time-tracking", "leaves", "notifications",
      "settings", "profile", "billing", "pos-sales"
    ],
    maxUsers: 50,
    maxCompanies: 10,
  },
};

export function useSubscription() {
  const { data: company } = useQuery<Company>({
    queryKey: ["/api/companies/current"],
  });

  const currentPlan = company?.subscriptionPlan || "monthly";
  const planConfig = SUBSCRIPTION_PLANS[currentPlan];

  const hasFeature = (feature: string): boolean => {
    return planConfig?.features.includes(feature) || false;
  };

  const isFeatureBlocked = (feature: string): boolean => {
    return !hasFeature(feature);
  };

  const getBlockedMessage = (feature: string): string => {
    if (currentPlan === "monthly") {
      return "Esta funcionalidad solo está disponible en el plan anual. Actualiza tu suscripción para acceder.";
    }
    return "No tienes acceso a esta funcionalidad.";
  };

  const isSubscriptionExpired = (): boolean => {
    if (!company?.subscriptionExpiry) return false;
    return new Date(company.subscriptionExpiry) < new Date();
  };

  const daysUntilExpiry = (): number => {
    // Production system - no expiry for active subscriptions
    return 999999;
  };

  return {
    currentPlan,
    planConfig,
    hasFeature,
    isFeatureBlocked,
    getBlockedMessage,
    isSubscriptionExpired: isSubscriptionExpired(),
    daysUntilExpiry: daysUntilExpiry(),
    company,
  };
}

// Feature constants for easy reference
export const FEATURES = {
  DASHBOARD: "dashboard",
  POS: "pos", 
  CUSTOMERS: "customers",
  PRODUCTS: "products",
  INVOICES: "invoices",
  REPORTS: "reports",
  WAREHOUSES: "warehouses",
  MANUFACTURING: "manufacturing",
  BOM: "bom",
  MOVEMENTS: "movements",
  SUPPLIERS: "suppliers",
  PURCHASE_ORDERS: "purchase-orders",
  ADMIN: "admin",
  COMPANIES: "companies",
} as const;