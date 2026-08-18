import { afterAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { courses, enrollments } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const testUserId = 1;

function studentContext(): TrpcContext {
  const now = new Date();
  return {
    user: { id: testUserId, openId: "integration-owner", name: "Integration Learner", email: "integration@example.com", loginMethod: "test", role: "student", headline: null, bio: null, avatarUrl: null, createdAt: now, updatedAt: now, lastSignedIn: now },
    req: { protocol: "https", headers: {}, get: () => "example.test" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("seeded catalog enrollment", () => {
  it("creates an active free enrollment for a published showcase course", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database is required for the enrollment integration test.");
    const [course] = await db.select().from(courses).where(eq(courses.slug, "modern-web-foundations")).limit(1);
    expect(course).toBeTruthy();
    const caller = appRouter.createCaller(studentContext());
    const result = await caller.learning.enroll({ courseId: course.id });
    expect(result).toMatchObject({ requiresPayment: false, enrollment: { userId: testUserId, courseId: course.id, status: "active" } });
    const rows = await db.select().from(enrollments).where(eq(enrollments.courseId, course.id));
    expect(rows.some((item) => item.userId === testUserId && item.status === "active")).toBe(true);
    const dashboardCourses = await caller.learning.myCourses();
    expect(dashboardCourses.some((item) => item.course.id === course.id)).toBe(true);
  });
});

afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  const [course] = await db.select().from(courses).where(eq(courses.slug, "modern-web-foundations")).limit(1);
  if (course) await db.delete(enrollments).where(and(eq(enrollments.userId, testUserId), eq(enrollments.courseId, course.id)));
});
