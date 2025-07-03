import { db } from "./db";
import { companies } from "@shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "./storage";

export interface SubscriptionUpdate {
  subscriptionPlan: 'active' | 'suspended' | 'cancelled';
  subscriptionStartDate?: Date;
  subscriptionExpiry?: Date;
}

/**
 * Calculate subscription expiry date based on plan type
 */
export function calculateSubscriptionExpiry(plan: string, startDate: Date = new Date()): Date {
  const expiryDate = new Date(startDate);
  
  switch (plan) {
    case 'monthly':
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      break;
    case 'annual':
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      break;
    case 'active':
      // Active subscriptions don't expire automatically
      expiryDate.setFullYear(expiryDate.getFullYear() + 100);
      break;
    default:
      // Default to enterprise plan for production deployment
      expiryDate.setFullYear(expiryDate.getFullYear() + 100);
  }
  
  return expiryDate;
}

/**
 * Update company subscription with proper date calculations
 */
export async function updateCompanySubscription(
  companyId: number, 
  newPlan: 'trial' | 'monthly' | 'annual',
  startDate: Date = new Date()
): Promise<void> {
  const subscriptionStartDate = startDate;
  const subscriptionExpiry = calculateSubscriptionExpiry(newPlan, startDate);
  
  console.log(`[Subscription] Updating company ${companyId} to ${newPlan} plan`);
  console.log(`[Subscription] Start date: ${subscriptionStartDate.toISOString()}`);
  console.log(`[Subscription] Expiry date: ${subscriptionExpiry.toISOString()}`);
  
  await storage.updateCompany(companyId, {
    subscriptionPlan: newPlan,
    subscriptionStartDate,
    subscriptionExpiry
  });
}

/**
 * Confirm payment and update subscription dates
 */
export async function confirmPaymentAndUpdateSubscription(
  companyId: number,
  confirmationDate: Date = new Date()
): Promise<void> {
  const company = await storage.getCompanyById(companyId);
  if (!company) {
    throw new Error(`Company with ID ${companyId} not found`);
  }
  
  const plan = company.subscriptionPlan || 'monthly';
  
  console.log(`[Payment] Confirming payment for company ${companyId} with ${plan} plan`);
  
  await updateCompanySubscription(companyId, plan as any, confirmationDate);
  
  // Also update payment status
  await storage.updateCompany(companyId, {
    paymentConfirmed: true,
    paymentStatus: 'confirmed'
  });
}