import { pgTable, text, serial, integer, timestamp, date, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
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
  startDay: integer("start_day"), // 0(Monday) - 6(Sunday)
  daysOfWeek: integer("days_of_week").array(), // for custom frequency
  reminderTime: text("reminder_time"),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHabitSchema = createInsertSchema(habits).pick({
  name: true,
  description: true,
  categoryId: true,
  frequency: true,
  startDay: true,
  daysOfWeek: true,
  reminderTime: true,
  userId: true,
});

// Habit logs (tracking completions)
export const habitStatusEnum = pgEnum("habit_status", [
  "incomplete",
  "partial",
  "complete",
  "not_applicable",
]);

export const habitLogs = pgTable("habit_logs", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  status: habitStatusEnum("status").notNull().default("incomplete"),
}, (table) => ({
  habitUserDateUnique: uniqueIndex("habit_logs_habit_user_date_unique")
    .on(table.habitId, table.userId, table.date),
}));

export const insertHabitLogSchema = createInsertSchema(habitLogs).pick({
  habitId: true,
  userId: true,
  date: true,
  status: true,
}).extend({
  status: z.enum(habitStatusEnum.enumValues).default("incomplete"),
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
export type HabitStatus = typeof habitStatusEnum.enumValues[number];

// Extended schemas with validations for frontend
export const habitValidationSchema = insertHabitSchema.extend({
  name: z.string().min(1, "Habit name is required").max(100, "Habit name must be less than 100 characters"),
  reminderTime: z.string().default("none"),
  startDay: z.number().min(0).max(6).optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
});

export const categoryValidationSchema = insertCategorySchema.extend({
  name: z.string().min(1, "Category name is required").max(50, "Category name must be less than 50 characters"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color code"),
});
