import { 
  users, User, InsertUser, 
  categories, Category, InsertCategory,
  habits, Habit, InsertHabit,
  habitLogs, HabitLog, InsertHabitLog
} from "@shared/schema";

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
  getHabitLog(habitId: number, date: string): Promise<HabitLog | undefined>;
  createHabitLog(log: InsertHabitLog): Promise<HabitLog>;
  updateHabitLog(id: number, log: Partial<InsertHabitLog>): Promise<HabitLog | undefined>;
  toggleHabitCompletion(habitId: number, userId: number, date: string): Promise<HabitLog>;
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

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.habits = new Map();
    this.habitLogs = new Map();
    this.userCurrentId = 1;
    this.categoriesCurrentId = 1;
    this.habitsCurrentId = 1;
    this.habitLogsCurrentId = 1;

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
    const category: Category = { ...insertCategory, id };
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

  async getHabitLog(habitId: number, date: string): Promise<HabitLog | undefined> {
    const logDate = new Date(date).toISOString().split('T')[0]; // Format as YYYY-MM-DD for consistent comparison
    
    return Array.from(this.habitLogs.values()).find(log => {
      const storedDate = new Date(log.date).toISOString().split('T')[0];
      return log.habitId === habitId && storedDate === logDate;
    });
  }

  async createHabitLog(insertLog: InsertHabitLog): Promise<HabitLog> {
    const id = this.habitLogsCurrentId++;
    const log: HabitLog = { ...insertLog, id };
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

  async toggleHabitCompletion(habitId: number, userId: number, date: string): Promise<HabitLog> {
    // Check if log exists for this habit and date
    const existingLog = await this.getHabitLog(habitId, date);
    
    if (existingLog) {
      // Toggle completion status
      const updated = await this.updateHabitLog(existingLog.id, { 
        completed: !existingLog.completed 
      });
      
      if (!updated) {
        throw new Error("Failed to update habit log");
      }
      
      return updated;
    } else {
      // Create new log with completed status
      return await this.createHabitLog({
        habitId,
        userId,
        date: date, // Use the string directly for date since the schema expects a string
        completed: true
      });
    }
  }
}

export const storage = new MemStorage();
