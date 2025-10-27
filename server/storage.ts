import {
  users, User, InsertUser,
  categories, Category, InsertCategory,
  habits, Habit, InsertHabit,
  habitLogs, HabitLog, InsertHabitLog,
  HabitStatus,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, between, desc } from "drizzle-orm";
import pg from "pg";
const { Pool } = pg;
import session from "express-session";
import connectPg from "connect-pg-simple";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Habit operations
  getHabits(userId: number): Promise<Habit[]>;
  getHabit(id: number): Promise<Habit | undefined>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(id: number, habit: Partial<InsertHabit>): Promise<Habit | undefined>;
  deleteHabit(id: number): Promise<boolean>;

  // Habit log operations
  getHabitLogs(habitId: number): Promise<HabitLog[]>;
  getHabitLogsByDate(userId: number, date: string): Promise<HabitLog[]>;
  getHabitLogsByDateRange(userId: number, startDate: string, endDate: string): Promise<HabitLog[]>;
  getHabitLog(habitId: number, date: string, userId: number): Promise<HabitLog | undefined>;
  createHabitLog(log: InsertHabitLog): Promise<HabitLog>;
  updateHabitLog(id: number, log: Partial<InsertHabitLog>): Promise<HabitLog | undefined>;
  toggleHabitCompletion(
    habitId: number,
    userId: number,
    date: string,
    status?: HabitStatus
  ): Promise<HabitLog>;
  
  // Session
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private habits: Map<number, Habit>;
  private habitLogs: Map<number, HabitLog>;
  private userCurrentId: number;
  private categoriesCurrentId: number;
  private habitsCurrentId: number;
  private habitLogsCurrentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.habits = new Map();
    this.habitLogs = new Map();
    this.userCurrentId = 1;
    this.categoriesCurrentId = 1;
    this.habitsCurrentId = 1;
    this.habitLogsCurrentId = 1;
    
    // Create memory session store
    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    // Add default categories
    this.initDefaultCategories();
  }

  // Initialize default categories
  private initDefaultCategories() {
    const defaultCategories: InsertCategory[] = [
      { name: "Health", color: "#3b82f6" },
      { name: "Productivity", color: "#10b981" },
      { name: "Learning", color: "#8b5cf6" },
      { name: "Wellness", color: "#22c55e" }
    ];

    defaultCategories.forEach(category => {
      this.createCategory(category);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoriesCurrentId++;
    // Ensure color property is present (use default if not provided)
    const category: Category = { 
      ...insertCategory, 
      id,
      color: insertCategory.color || "#6366f1" 
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, categoryUpdate: Partial<InsertCategory>): Promise<Category | undefined> {
    const existingCategory = this.categories.get(id);
    if (!existingCategory) return undefined;

    const updatedCategory = {
      ...existingCategory,
      ...categoryUpdate
    };

    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Habit methods
  async getHabits(userId: number): Promise<Habit[]> {
    return Array.from(this.habits.values()).filter(habit => habit.userId === userId);
  }

  async getHabit(id: number): Promise<Habit | undefined> {
    return this.habits.get(id);
  }

  async createHabit(insertHabit: InsertHabit): Promise<Habit> {
    const id = this.habitsCurrentId++;
    const habit: Habit = {
      ...insertHabit,
      id,
      description: insertHabit.description || null,
      frequency: insertHabit.frequency || "daily",
      startDay: insertHabit.startDay ?? null,
      daysOfWeek: insertHabit.daysOfWeek ?? null,
      reminderTime: insertHabit.reminderTime || null,
      createdAt: new Date()
    };
    this.habits.set(id, habit);
    return habit;
  }

  async updateHabit(id: number, habitUpdate: Partial<InsertHabit>): Promise<Habit | undefined> {
    const existingHabit = this.habits.get(id);
    if (!existingHabit) return undefined;

    const updatedHabit = {
      ...existingHabit,
      ...habitUpdate
    };

    this.habits.set(id, updatedHabit);
    return updatedHabit;
  }

  async deleteHabit(id: number): Promise<boolean> {
    // Also delete all habit logs related to this habit
    Array.from(this.habitLogs.entries())
      .filter(([_, log]) => log.habitId === id)
      .forEach(([logId, _]) => this.habitLogs.delete(logId));
      
    return this.habits.delete(id);
  }

  // Habit log methods
  async getHabitLogs(habitId: number): Promise<HabitLog[]> {
    return Array.from(this.habitLogs.values()).filter(log => log.habitId === habitId);
  }

  async getHabitLogsByDate(userId: number, date: string): Promise<HabitLog[]> {
    const queryDate = new Date(date).toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    return Array.from(this.habitLogs.values()).filter(log => {
      // Get habits for this user
      const habit = this.habits.get(log.habitId);
      if (!habit || habit.userId !== userId) return false;
      
      const logDate = new Date(log.date).toISOString().split('T')[0];
      return logDate === queryDate;
    });
  }

  async getHabitLogsByDateRange(userId: number, startDate: string, endDate: string): Promise<HabitLog[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return Array.from(this.habitLogs.values()).filter(log => {
      // Get habits for this user
      const habit = this.habits.get(log.habitId);
      if (!habit || habit.userId !== userId) return false;
      
      const logDate = new Date(log.date);
      return logDate >= start && logDate <= end;
    });
  }

  async getHabitLog(habitId: number, date: string, userId: number): Promise<HabitLog | undefined> {
    const logDate = new Date(date).toISOString().split('T')[0]; // Format as YYYY-MM-DD for consistent comparison

    return Array.from(this.habitLogs.values()).find(log => {
      const storedDate = new Date(log.date).toISOString().split('T')[0];
      return log.habitId === habitId && log.userId === userId && storedDate === logDate;
    });
  }

  async createHabitLog(insertLog: InsertHabitLog): Promise<HabitLog> {
    const id = this.habitLogsCurrentId++;
    const log: HabitLog = {
      ...insertLog,
      id,
      status: insertLog.status ?? "incomplete"
    };
    this.habitLogs.set(id, log);
    return log;
  }

  async updateHabitLog(id: number, logUpdate: Partial<InsertHabitLog>): Promise<HabitLog | undefined> {
    const existingLog = this.habitLogs.get(id);
    if (!existingLog) return undefined;

    const updatedLog = {
      ...existingLog,
      ...logUpdate
    };

    this.habitLogs.set(id, updatedLog);
    return updatedLog;
  }

  async toggleHabitCompletion(
    habitId: number,
    userId: number,
    date: string,
    status?: HabitStatus
  ): Promise<HabitLog> {
    // Check if log exists for this habit and date
    const existingLog = await this.getHabitLog(habitId, date, userId);

    if (existingLog) {
      const cycleStatus = (current: HabitStatus): HabitStatus => {
        if (current === "complete") return "incomplete";
        if (current === "partial" || current === "incomplete" || current === "not_applicable") {
          return "complete";
        }
        return "complete";
      };

      const nextStatus = status ?? cycleStatus(existingLog.status);

      const updated = await this.updateHabitLog(existingLog.id, {
        status: nextStatus
      });

      if (!updated) {
        throw new Error("Failed to update habit log");
      }

      return updated;
    } else {
      const resolvedStatus = status ?? "complete";

      return await this.createHabitLog({
        habitId,
        userId,
        date: date, // Use the string directly for date since the schema expects a string
        status: resolvedStatus
      });
    }
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  db: ReturnType<typeof drizzle>;
  pool: any; // Using any as a workaround for the Pool type
  sessionStore: session.Store;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    this.db = drizzle(this.pool);
    
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool: this.pool,
      createTableIfMissing: true,
    });

    // Ensure new columns exist when the server starts
    this.ensureHabitColumns().catch((err) => {
      console.error('Failed to ensure habit columns', err);
    });
  }

  // Check for newly added columns and create them if missing
  private async ensureHabitColumns() {
    const res = await this.pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'habits'`
    );
    const cols = res.rows.map((r: any) => r.column_name);
    if (!cols.includes('start_day')) {
      await this.pool.query('ALTER TABLE habits ADD COLUMN start_day integer');
    }
    if (!cols.includes('days_of_week')) {
      await this.pool.query('ALTER TABLE habits ADD COLUMN days_of_week integer[]');
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const results = await this.db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await this.db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const results = await this.db.insert(users).values(user).returning();
    return results[0];
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await this.db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const results = await this.db.select().from(categories).where(eq(categories.id, id));
    return results[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const results = await this.db.insert(categories).values(category).returning();
    return results[0];
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const results = await this.db.update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return results[0];
  }

  async deleteCategory(id: number): Promise<boolean> {
    const results = await this.db.delete(categories).where(eq(categories.id, id)).returning();
    return results.length > 0;
  }

  // Habit methods
  async getHabits(userId: number): Promise<Habit[]> {
    return await this.db.select().from(habits).where(eq(habits.userId, userId)).orderBy(desc(habits.id));
  }

  async getHabit(id: number): Promise<Habit | undefined> {
    const results = await this.db.select().from(habits).where(eq(habits.id, id));
    return results[0];
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const results = await this.db.insert(habits).values(habit).returning();
    return results[0];
  }

  async updateHabit(id: number, habit: Partial<InsertHabit>): Promise<Habit | undefined> {
    const results = await this.db.update(habits)
      .set(habit)
      .where(eq(habits.id, id))
      .returning();
    return results[0];
  }

  async deleteHabit(id: number): Promise<boolean> {
    // Delete all related habit logs first
    await this.db.delete(habitLogs).where(eq(habitLogs.habitId, id));
    
    // Then delete the habit
    const results = await this.db.delete(habits).where(eq(habits.id, id)).returning();
    return results.length > 0;
  }

  // Habit log methods
  async getHabitLogs(habitId: number): Promise<HabitLog[]> {
    return await this.db.select().from(habitLogs).where(eq(habitLogs.habitId, habitId));
  }

  async getHabitLogsByDate(userId: number, date: string): Promise<HabitLog[]> {
    const normalizedDate = new Date(date).toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    // Get all logs for this user for this date
    const userHabits = await this.getHabits(userId);
    const habitIds = userHabits.map(habit => habit.id);
    
    if (habitIds.length === 0) {
      return [];
    }
    
    // For each habit, find the log for this date
    const logs: HabitLog[] = [];
    for (const habitId of habitIds) {
      const habitLog = await this.getHabitLog(habitId, normalizedDate, userId);
      if (habitLog) {
        logs.push(habitLog);
      }
    }
    
    return logs;
  }

  async getHabitLogsByDateRange(userId: number, startDate: string, endDate: string): Promise<HabitLog[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get all habits for this user
    const userHabits = await this.getHabits(userId);
    const habitIds = userHabits.map(habit => habit.id);
    
    if (habitIds.length === 0) {
      return [];
    }
    
    // For each habit, find logs within date range
    const logs: HabitLog[] = [];
    for (const habitId of habitIds) {
      // Convert dates to string format for comparison
      const startStr = start.toISOString().split('T')[0]; 
      const endStr = end.toISOString().split('T')[0];
      
      const habitLogsResults = await this.db.select()
        .from(habitLogs)
        .where(
          and(
            eq(habitLogs.habitId, habitId),
            eq(habitLogs.userId, userId),
            between(habitLogs.date, startStr, endStr)
          )
        );
      logs.push(...habitLogsResults);
    }

    return logs;
  }

  async getHabitLog(habitId: number, date: string, userId: number): Promise<HabitLog | undefined> {
    const normalizedDate = new Date(date).toISOString().split('T')[0]; // Format as YYYY-MM-DD

    const results = await this.db.select()
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.habitId, habitId),
          eq(habitLogs.userId, userId),
          eq(habitLogs.date, normalizedDate)
        )
      );

    return results[0];
  }

  async createHabitLog(log: InsertHabitLog): Promise<HabitLog> {
    // Ensure the date is normalized
    const normalizedLog = {
      ...log,
      date: new Date(log.date).toISOString().split('T')[0],
      status: log.status ?? "incomplete"
    };

    const results = await this.db.insert(habitLogs).values(normalizedLog).returning();
    return results[0];
  }

  async updateHabitLog(id: number, log: Partial<InsertHabitLog>): Promise<HabitLog | undefined> {
    // Normalize date if present
    const normalizedLog = { ...log };
    if (normalizedLog.date) {
      normalizedLog.date = new Date(normalizedLog.date).toISOString().split('T')[0];
    }
    
    const results = await this.db.update(habitLogs)
      .set(normalizedLog)
      .where(eq(habitLogs.id, id))
      .returning();
    
    return results[0];
  }

  async toggleHabitCompletion(
    habitId: number,
    userId: number,
    date: string,
    status?: HabitStatus
  ): Promise<HabitLog> {
    const normalizedDate = new Date(date).toISOString().split('T')[0]; // Format as YYYY-MM-DD

    // Check if log exists for this habit and date
    const existingLog = await this.getHabitLog(habitId, normalizedDate, userId);

    const cycleStatus = (current: HabitStatus): HabitStatus => {
      if (current === "complete") return "incomplete";
      if (current === "partial" || current === "incomplete" || current === "not_applicable") {
        return "complete";
      }
      return "complete";
    };

    const nextStatus = status ?? (existingLog ? cycleStatus(existingLog.status) : "complete");

    const results = await this.db.insert(habitLogs)
      .values({
        habitId,
        userId,
        date: normalizedDate,
        status: nextStatus,
      })
      .onConflictDoUpdate({
        target: [habitLogs.habitId, habitLogs.userId, habitLogs.date],
        set: { status: nextStatus },
      })
      .returning();

    return results[0];
  }
  
  // Initialize default categories if they don't exist
  async initDefaultCategories() {
    const existingCategories = await this.getCategories();
    
    if (existingCategories.length === 0) {
      const defaultCategories: InsertCategory[] = [
        { name: "Health", color: "#3b82f6" },
        { name: "Productivity", color: "#10b981" },
        { name: "Learning", color: "#8b5cf6" },
        { name: "Wellness", color: "#22c55e" }
      ];
      
      for (const category of defaultCategories) {
        await this.createCategory(category);
      }
    }
  }
}

// Create storage instance based on environment
export const storage = new DatabaseStorage();
