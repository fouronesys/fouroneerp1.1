import { pgTable, serial, varchar, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  companyId: varchar("company_id", { length: 255 }),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // info, success, warning, error
  category: varchar("category", { length: 50 }).notNull(), // sales, inventory, system, financial, user_activity
  read: boolean("read").default(false),
  actionUrl: varchar("action_url", { length: 500 }),
  actionText: varchar("action_text", { length: 100 }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// User notification settings table
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  salesAlerts: boolean("sales_alerts").default(true),
  inventoryAlerts: boolean("inventory_alerts").default(true),
  systemAlerts: boolean("system_alerts").default(true),
  financialAlerts: boolean("financial_alerts").default(true),
  userActivityAlerts: boolean("user_activity_alerts").default(false),
  soundEnabled: boolean("sound_enabled").default(true),
  digestFrequency: varchar("digest_frequency", { length: 20 }).default("immediate"), // immediate, hourly, daily, weekly
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;