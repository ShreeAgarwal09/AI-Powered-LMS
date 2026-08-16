import type { Request, Response } from "express";
import Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { courses, enrollments, purchases } from "../drizzle/schema";
import { getDb } from "./db";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured. Open Settings → Payment to complete the connection.");
  return new Stripe(key);
}

export async function createCourseCheckout(input: { courseId: number; user: { id: number; email: string | null; name: string | null }; origin: string }) {
  const db = await getDb();
  if (!db) throw new Error("The learning database is unavailable.");
  const courseRows = await db.select().from(courses).where(eq(courses.id, input.courseId)).limit(1);
  const course = courseRows[0];
  if (!course || course.status !== "published" || course.priceCents <= 0) throw new Error("This paid course is not available for checkout.");
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: course.currency.toLowerCase(),
        product_data: { name: course.title, description: course.shortDescription },
        unit_amount: course.priceCents,
      },
      quantity: 1,
    }],
    customer_email: input.user.email ?? undefined,
    client_reference_id: String(input.user.id),
    metadata: {
      user_id: String(input.user.id),
      course_id: String(course.id),
      customer_email: input.user.email ?? "",
      customer_name: input.user.name ?? "",
    },
    allow_promotion_codes: true,
    success_url: `${input.origin}/courses/${course.slug}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/courses/${course.slug}?checkout=cancelled`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout link.");
  return { checkoutUrl: session.url };
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) return res.status(400).send("Missing Stripe signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(500).send("Stripe webhook is not configured");
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, signature, secret);
  } catch (error) {
    return res.status(400).send(`Webhook signature verification failed: ${error instanceof Error ? error.message : "unknown error"}`);
  }
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = Number(session.metadata?.user_id);
    const courseId = Number(session.metadata?.course_id);
    if (!Number.isInteger(userId) || !Number.isInteger(courseId) || session.payment_status !== "paid") {
      return res.json({ received: true });
    }
    const db = await getDb();
    if (!db) return res.status(503).send("Database unavailable");
    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
    const existing = await db.select().from(purchases).where(eq(purchases.stripeCheckoutSessionId, session.id)).limit(1);
    if (!existing.length) {
      await db.insert(purchases).values({ userId, courseId, stripeCheckoutSessionId: session.id, stripePaymentIntentId: paymentIntentId, amountCents: session.amount_total ?? 0 });
    }
    const enrolled = await db.select().from(enrollments).where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))).limit(1);
    if (enrolled.length) {
      await db.update(enrollments).set({ paymentStatus: "paid", amountCents: session.amount_total ?? 0, status: "active" }).where(eq(enrollments.id, enrolled[0].id));
    } else {
      await db.insert(enrollments).values({ userId, courseId, paymentStatus: "paid", amountCents: session.amount_total ?? 0, status: "active" });
    }
  }
  return res.json({ received: true });
}
