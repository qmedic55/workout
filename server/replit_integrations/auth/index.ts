// Use OAuth auth instead of Replit auth
export { setupOAuth as setupAuth, isAuthenticated, getSession } from "../../auth/oauthAuth";
export { authStorage, type IAuthStorage } from "./storage";
export { registerAuthRoutes } from "./routes";
