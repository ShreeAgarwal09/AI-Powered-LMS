import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { courses, lessons, quizzes } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const publicContext: TrpcContext = {
  user: null,
  req: { protocol: "https", headers: {}, get: () => "example.test" } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};

describe("showcase catalog seed", () => {
  it("exposes the twelve-course catalog and a complete seeded course through public procedures", async () => {
    const caller = appRouter.createCaller(publicContext);
    const catalog = await caller.catalog.list({ price: "free" });
    expect(catalog).toHaveLength(12);
    expect(catalog.every((item) => item.course.status === "published" && item.course.thumbnailUrl)).toBe(true);
    const detail = await caller.catalog.bySlug({ slug: "modern-web-foundations" });
    expect(detail?.course.title).toBe("Modern Web Foundations");
    expect(detail?.lessons).toHaveLength(5);
    expect(detail?.quizzes).toHaveLength(1);
  }, 20_000);

  it("keeps showcase curriculum and assessment rows persisted in the configured database", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database is required for showcase catalog tests.");
    const [course] = await db.select().from(courses).where(eq(courses.slug, "modern-web-foundations")).limit(1);
    expect(course).toBeTruthy();
    const lessonRows = await db.select().from(lessons).where(eq(lessons.courseId, course.id));
    const quizRows = await db.select().from(quizzes).where(eq(quizzes.courseId, course.id));
    expect(lessonRows).toHaveLength(5);
    expect(quizRows).toHaveLength(1);
  });
});
