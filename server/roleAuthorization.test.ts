import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function contextFor(role: "student" | "instructor" | "admin"): TrpcContext {
  const now = new Date();
  return {
    user: { id: 99, openId: `test-${role}`, name: "Test User", email: "test@example.com", loginMethod: "test", role, headline: null, bio: null, avatarUrl: null, createdAt: now, updatedAt: now, lastSignedIn: now },
    req: { protocol: "https", headers: {}, get: () => "example.test" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("role-based authorization", () => {
  it("blocks student accounts from instructor procedures before data access", async () => {
    const caller = appRouter.createCaller(contextFor("student"));
    await expect(caller.instructor.analytics()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks instructor accounts from student-only learning procedures before data access", async () => {
    const caller = appRouter.createCaller(contextFor("instructor"));
    await expect(caller.learning.myCourses()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

