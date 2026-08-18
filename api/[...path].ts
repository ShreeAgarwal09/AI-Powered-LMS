import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { createContext } from "../server/_core/context";
import { appRouter } from "../server/routers";
import { handleStripeWebhook } from "../server/stripe";

/**
 * Vercel invokes this catch-all Express application for API paths. Static
 * assets are emitted to dist/public by Vite and are served by Vercel directly.
 */
const app = express();

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerStorageProxy(app);
registerOAuthRoutes(app);
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

export default app;
