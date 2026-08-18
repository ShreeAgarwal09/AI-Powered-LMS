import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { createContext } from "./_core/context";
import { appRouter } from "./routers";
import { handleStripeWebhook } from "./stripe";

/**
 * Shared Vercel application assembly. The build pipeline bundles this module
 * to JavaScript before Vercel packages the catch-all function, preventing the
 * function compiler from independently type-checking the TypeScript server
 * graph with its incompatible Express type environment.
 */
const app = express();

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerStorageProxy(app);
registerOAuthRoutes(app);
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

export default app;
