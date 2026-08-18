import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { createContext } from "../server/_core/context";
import { appRouter } from "../server/routers";
import { handleStripeWebhook } from "../server/stripe";

/**
 * Catch-all Vercel Function for tRPC, OAuth, Stripe, and storage-proxy routes.
 * JavaScript avoids Vercel's isolated function type-checker conflicting with
 * the project's Express 4 type definitions; imported application code remains
 * TypeScript-checked through the normal project `pnpm check` command.
 */
const app = express();

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerStorageProxy(app);
registerOAuthRoutes(app);
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

export default app;
