import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertHabitSchema, 
  insertCategorySchema, 
  insertHabitLogSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handling middleware for Zod validation
  const validateRequest = (schema: any) => (req: any, res: any, next: any) => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(400).json({ message: "Invalid request data" });
      }
    }
  };

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", validateRequest(insertCategorySchema), async (req, res) => {
    try {
      const newCategory = await storage.createCategory(req.validatedBody);
      res.status(201).json(newCategory);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", validateRequest(insertCategorySchema), async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const updatedCategory = await storage.updateCategory(categoryId, req.validatedBody);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const success = await storage.deleteCategory(categoryId);
      
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Habits routes
  app.get("/api/habits", async (req, res) => {
    try {
      // For demo, we'll use user ID 1 since authentication is not implemented
      const userId = 1;
      const habits = await storage.getHabits(userId);
      res.json(habits);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });

  app.get("/api/habits/:id", async (req, res) => {
    try {
      const habitId = parseInt(req.params.id);
      const habit = await storage.getHabit(habitId);
      
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }
      
      res.json(habit);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch habit" });
    }
  });

  app.post("/api/habits", validateRequest(insertHabitSchema), async (req, res) => {
    try {
      const newHabit = await storage.createHabit(req.validatedBody);
      res.status(201).json(newHabit);
    } catch (error) {
      res.status(500).json({ message: "Failed to create habit" });
    }
  });

  app.put("/api/habits/:id", validateRequest(insertHabitSchema), async (req, res) => {
    try {
      const habitId = parseInt(req.params.id);
      const updatedHabit = await storage.updateHabit(habitId, req.validatedBody);
      
      if (!updatedHabit) {
        return res.status(404).json({ message: "Habit not found" });
      }
      
      res.json(updatedHabit);
    } catch (error) {
      res.status(500).json({ message: "Failed to update habit" });
    }
  });

  app.delete("/api/habits/:id", async (req, res) => {
    try {
      const habitId = parseInt(req.params.id);
      const success = await storage.deleteHabit(habitId);
      
      if (!success) {
        return res.status(404).json({ message: "Habit not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete habit" });
    }
  });

  // Habit logs routes
  app.get("/api/habit-logs", async (req, res) => {
    try {
      // For demo, we'll use user ID 1 since authentication is not implemented
      const userId = 1;
      const { date, startDate, endDate } = req.query;
      
      if (startDate && endDate) {
        const logs = await storage.getHabitLogsByDateRange(
          userId, 
          startDate as string, 
          endDate as string
        );
        return res.json(logs);
      } else if (date) {
        const logs = await storage.getHabitLogsByDate(userId, date as string);
        return res.json(logs);
      } else {
        return res.status(400).json({ message: "Date parameters required" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch habit logs" });
    }
  });

  app.get("/api/habits/:habitId/logs", async (req, res) => {
    try {
      const habitId = parseInt(req.params.habitId);
      const logs = await storage.getHabitLogs(habitId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch habit logs" });
    }
  });

  app.post("/api/habit-logs", validateRequest(insertHabitLogSchema), async (req, res) => {
    try {
      const newLog = await storage.createHabitLog(req.validatedBody);
      res.status(201).json(newLog);
    } catch (error) {
      res.status(500).json({ message: "Failed to create habit log" });
    }
  });

  app.post("/api/habits/:habitId/toggle", async (req, res) => {
    try {
      const habitId = parseInt(req.params.habitId);
      const { date } = req.body;
      
      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }
      
      // For demo, we'll use user ID 1 since authentication is not implemented
      const userId = 1;
      
      const updatedLog = await storage.toggleHabitCompletion(habitId, userId, date);
      res.json(updatedLog);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle habit completion" });
    }
  });

  // Seed demo data (only for development purposes)
  app.post("/api/seed-demo-data", async (req, res) => {
    try {
      // Create demo user if doesn't exist
      let demoUser = await storage.getUserByUsername("demo");
      
      if (!demoUser) {
        demoUser = await storage.createUser({
          username: "demo",
          password: "demo123"
        });
      }
      
      // Get categories
      const categories = await storage.getCategories();
      
      if (categories.length > 0) {
        // Create some demo habits
        const demoHabits = [
          {
            name: "Drink 2L of water",
            description: "Stay hydrated throughout the day",
            categoryId: categories.find(c => c.name === "Health")?.id || categories[0].id,
            frequency: "daily",
            reminderTime: "anytime",
            userId: demoUser.id
          },
          {
            name: "Read for 30 minutes",
            description: "Read non-fiction books to learn new skills",
            categoryId: categories.find(c => c.name === "Learning")?.id || categories[0].id,
            frequency: "daily",
            reminderTime: "evening",
            userId: demoUser.id
          },
          {
            name: "Meditate for 10 minutes",
            description: "Practice mindfulness and reduce stress",
            categoryId: categories.find(c => c.name === "Wellness")?.id || categories[0].id,
            frequency: "daily",
            reminderTime: "morning",
            userId: demoUser.id
          },
          {
            name: "Practice coding",
            description: "Work on personal projects to improve skills",
            categoryId: categories.find(c => c.name === "Learning")?.id || categories[0].id,
            frequency: "daily",
            reminderTime: "afternoon",
            userId: demoUser.id
          }
        ];
        
        // Create habits
        for (const habitData of demoHabits) {
          const habit = await storage.createHabit(habitData);
          
          // Create completion logs for the past week (with some randomness)
          const today = new Date();
          
          for (let i = 0; i < 7; i++) {
            const logDate = new Date();
            logDate.setDate(today.getDate() - i);
            
            // Randomly complete some habits (higher chance for older dates)
            const shouldComplete = Math.random() < (0.7 - (i * 0.05));
            
            if (shouldComplete) {
              await storage.createHabitLog({
                habitId: habit.id,
                userId: demoUser.id,
                date: logDate,
                completed: true
              });
            }
          }
        }
        
        res.json({ message: "Demo data created successfully" });
      } else {
        res.status(500).json({ message: "No categories available" });
      }
    } catch (error) {
      console.error("Seed data error:", error);
      res.status(500).json({ message: "Failed to seed demo data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
