import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "../../auth/oauthAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user (extended version with full DB user data)
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      // New OAuth session format uses req.user.id directly
      const userId = req.user?.id || req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }
      const user = await authStorage.getUser(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
