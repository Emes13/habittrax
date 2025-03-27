import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table (using existing one from template)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Categories for habits
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#6366f1"), // Default primary color
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  color: true,
});

// Habits table
export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").notNull(),
  frequency: text("frequency").notNull().default("daily"), // daily, weekly, custom
  reminderTime: text("reminder_time"),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHabitSchema = createInsertSchema(habits).pick({
  name: true,
  description: true,
  categoryId: true,
  frequency: true,
  reminderTime: true,
  userId: true,
});

// Habit logs (tracking completions)
export const habitLogs = pgTable("habit_logs", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const insertHabitLogSchema = createInsertSchema(habitLogs).pick({
  habitId: true,
  userId: true,
  date: true,
  completed: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Habit = typeof habits.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;

export type HabitLog = typeof habitLogs.$inferSelect;
export type InsertHabitLog = z.infer<typeof insertHabitLogSchema>;

// Extended schemas with validations for frontend
export const habitValidationSchema = insertHabitSchema.extend({
  name: z.string().min(1, "Habit name is required").max(100, "Habit name must be less than 100 characters"),
});

export const categoryValidationSchema = insertCategorySchema.extend({
  name: z.string().min(1, "Category name is required").max(50, "Category name must be less than 50 characters"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color code"),
});
