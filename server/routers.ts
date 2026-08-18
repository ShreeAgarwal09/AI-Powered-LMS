import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  categories,
  certificates,
  courses,
  enrollments,
  lessons,
  lessonProgress,
  purchases,
  quizAttempts,
  quizQuestions,
  quizzes,
  courseSections,
  users,
} from "../drizzle/schema";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, instructorProcedure, protectedProcedure, publicProcedure, router, studentProcedure } from "./_core/trpc";
import { calculateProgress, createCertificateCode, createCourseSlug, gradeQuiz, isCertificateEligible } from "./educationUtils";
import { createCourseCheckout } from "./stripe";

const levelSchema = z.enum(["beginner", "intermediate", "advanced"]);
const statusSchema = z.enum(["draft", "published", "archived"]);
const resourceSchema = z.object({ label: z.string().min(1).max(120), url: z.string().url() });
const courseInput = z.object({
  title: z.string().min(3).max(240),
  shortDescription: z.string().min(10).max(360),
  description: z.string().min(20),
  thumbnailUrl: z.string().url().nullable().optional(),
  categoryId: z.number().int().positive(),
  level: levelSchema,
  priceCents: z.number().int().min(0).max(100000000),
  currency: z.string().length(3).default("USD"),
  objectives: z.array(z.string().min(1).max(200)).min(1).max(12),
  requirements: z.array(z.string().min(1).max(200)).max(12),
  tags: z.array(z.string().min(1).max(50)).max(12),
});

async function requireDb() {
  const connection = await db.getDb();
  if (!connection) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The learning database is unavailable." });
  return connection;
}

function requireRole(role: "instructor" | "admin", currentRole: string) {
  if (currentRole !== role && currentRole !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to perform this action." });
  }
}

async function requireOwnedCourse(courseId: number, user: { id: number; role: string }) {
  const connection = await requireDb();
  const course = await connection.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  const item = course[0];
  if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Course not found." });
  if (user.role !== "admin" && item.instructorId !== user.id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You can only manage your own courses." });
  }
  return { connection, course: item };
}

async function requireEnrollment(courseId: number, userId: number) {
  const enrollment = await db.getEnrollmentForCourse(userId, courseId);
  if (!enrollment || enrollment.status === "cancelled") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Enroll in this course to continue learning." });
  }
  return enrollment;
}

async function evaluateCompletion(userId: number, courseId: number, enrollmentId: number) {
  const connection = await requireDb();
  const { totalLessons, completedLessons } = await db.calculateCourseProgress(userId, courseId);
  const progress = calculateProgress(totalLessons, completedLessons);
  const requiredQuizzes = await connection.select().from(quizzes).where(and(eq(quizzes.courseId, courseId), eq(quizzes.isRequired, true)));
  const attempts = requiredQuizzes.length
    ? await connection.select().from(quizAttempts).where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.courseId, courseId)))
    : [];
  const requiredQuizzesPassed = requiredQuizzes.every((quiz) => attempts.some((attempt) => attempt.quizId === quiz.id && attempt.percentage >= quiz.passingScore));
  const eligible = isCertificateEligible({ progress, requiredQuizzesPassed });

  if (eligible) {
    await connection.update(enrollments).set({ status: "completed", completedAt: new Date() }).where(eq(enrollments.id, enrollmentId));
    const existing = await connection.select().from(certificates).where(eq(certificates.enrollmentId, enrollmentId)).limit(1);
    if (!existing.length) {
      await connection.insert(certificates).values({ enrollmentId, userId, courseId, certificateCode: createCertificateCode() });
    }
  }
  return { progress, totalLessons, completedLessons, requiredQuizzesPassed, eligible };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  contact: router({
    submit: publicProcedure
      .input(z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(320), subject: z.string().trim().min(2).max(240), message: z.string().trim().min(10).max(5000) }))
      .mutation(({ input }) => db.createContactMessage(input)),
  }),

  catalog: router({
    categories: publicProcedure.query(() => db.getCategories()),
    list: publicProcedure
      .input(z.object({ query: z.string().max(120).optional(), categoryId: z.number().int().positive().optional(), level: levelSchema.optional(), price: z.enum(["free", "paid"]).optional() }).optional())
      .query(({ input }) => db.getCourseCatalog(input ?? {})),
    bySlug: publicProcedure.input(z.object({ slug: z.string().min(1).max(280) })).query(({ input }) => db.getCourseBySlug(input.slug)),
    featured: publicProcedure.query(async () => (await db.getCourseCatalog({})).slice(0, 3)),
    instructors: publicProcedure.query(() => db.getInstructorHighlights()),
  }),

  account: router({
    profile: protectedProcedure.query(({ ctx }) => ctx.user),
    updateProfile: protectedProcedure
      .input(z.object({ name: z.string().min(2).max(120).optional(), headline: z.string().max(180).nullable().optional(), bio: z.string().max(1600).nullable().optional(), avatarUrl: z.string().url().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        const connection = await requireDb();
        await connection.update(users).set(input).where(eq(users.id, ctx.user.id));
        return { success: true };
      }),
    chooseLearningRole: protectedProcedure
      .input(z.object({ role: z.enum(["student", "instructor"]) }))
      .mutation(async ({ ctx, input }) => {
        const connection = await requireDb();
        if (ctx.user.role === "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator roles are managed separately." });
        await connection.update(users).set({ role: input.role }).where(eq(users.id, ctx.user.id));
        return { success: true };
      }),
  }),

  learning: router({
    myCourses: studentProcedure.query(async ({ ctx }) => {
      const items = await db.getStudentEnrollments(ctx.user.id);
      return Promise.all(items.map(async (item) => ({ ...item, progress: calculateProgress(...Object.values(await db.calculateCourseProgress(ctx.user.id, item.course.id)) as [number, number]) })));
    }),
    enroll: studentProcedure.input(z.object({ courseId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const connection = await requireDb();
      const course = await connection.select().from(courses).where(eq(courses.id, input.courseId)).limit(1);
      const item = course[0];
      if (!item || item.status !== "published") throw new TRPCError({ code: "NOT_FOUND", message: "This course is not available for enrollment." });
      const existing = await db.getEnrollmentForCourse(ctx.user.id, input.courseId);
      if (existing) return { enrollment: existing, requiresPayment: item.priceCents > 0 };
      if (item.priceCents > 0) return { enrollment: null, requiresPayment: true, courseId: item.id };
      await connection.insert(enrollments).values({ userId: ctx.user.id, courseId: item.id, paymentStatus: "free", amountCents: 0 });
      const enrollment = await db.getEnrollmentForCourse(ctx.user.id, item.id);
      return { enrollment, requiresPayment: false };
    }),
    courseState: studentProcedure.input(z.object({ courseId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const enrollment = await requireEnrollment(input.courseId, ctx.user.id);
      const [courseRows, lessonRows, sectionRows, progressRows, quizRows, attemptRows] = await Promise.all([
        (await requireDb()).select().from(courses).where(eq(courses.id, input.courseId)).limit(1),
        (await requireDb()).select().from(lessons).where(eq(lessons.courseId, input.courseId)).orderBy(asc(lessons.sortOrder)),
        (await requireDb()).select().from(courseSections).where(eq(courseSections.courseId, input.courseId)).orderBy(asc(courseSections.sortOrder)),
        (await requireDb()).select().from(lessonProgress).where(and(eq(lessonProgress.userId, ctx.user.id), eq(lessonProgress.courseId, input.courseId))),
        (await requireDb()).select().from(quizzes).where(eq(quizzes.courseId, input.courseId)).orderBy(asc(quizzes.sortOrder)),
        (await requireDb()).select().from(quizAttempts).where(and(eq(quizAttempts.userId, ctx.user.id), eq(quizAttempts.courseId, input.courseId))).orderBy(desc(quizAttempts.submittedAt)),
      ]);
      const current = courseRows[0];
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Course not found." });
      const computed = calculateProgress(lessonRows.length, progressRows.filter((row) => row.completed).length);
      return { course: current, enrollment, sections: sectionRows, lessons: lessonRows, progress: progressRows, quizzes: quizRows, attempts: attemptRows, overallProgress: computed };
    }),
    markLesson: studentProcedure.input(z.object({ courseId: z.number().int().positive(), lessonId: z.number().int().positive(), completed: z.boolean(), lastPositionSeconds: z.number().int().min(0).default(0) })).mutation(async ({ ctx, input }) => {
      const enrollment = await requireEnrollment(input.courseId, ctx.user.id);
      const connection = await requireDb();
      const lesson = await connection.select().from(lessons).where(and(eq(lessons.id, input.lessonId), eq(lessons.courseId, input.courseId))).limit(1);
      if (!lesson.length) throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found." });
      await connection.insert(lessonProgress).values({ userId: ctx.user.id, courseId: input.courseId, lessonId: input.lessonId, completed: input.completed, completedAt: input.completed ? new Date() : null, lastPositionSeconds: input.lastPositionSeconds }).onDuplicateKeyUpdate({ set: { completed: input.completed, completedAt: input.completed ? new Date() : null, lastPositionSeconds: input.lastPositionSeconds } });
      return evaluateCompletion(ctx.user.id, input.courseId, enrollment.id);
    }),
    certificates: studentProcedure.query(({ ctx }) => db.getStudentCertificates(ctx.user.id)),
    quizSummary: studentProcedure.query(({ ctx }) => db.getStudentQuizSummary(ctx.user.id)),
  }),

  payments: router({
    checkout: studentProcedure.input(z.object({ courseId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const origin = ctx.req.headers.origin ?? `${ctx.req.protocol}://${ctx.req.get("host")}`;
      return createCourseCheckout({ courseId: input.courseId, user: ctx.user, origin });
    }),
    history: studentProcedure.query(({ ctx }) => db.getPaymentHistory(ctx.user.id)),
  }),

  quiz: router({
    get: studentProcedure.input(z.object({ quizId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const connection = await requireDb();
      const quiz = await connection.select().from(quizzes).where(eq(quizzes.id, input.quizId)).limit(1);
      const item = quiz[0];
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Quiz not found." });
      await requireEnrollment(item.courseId, ctx.user.id);
      const questions = await db.getQuizQuestions(item.id);
      const attempts = await connection.select({ id: quizAttempts.id, percentage: quizAttempts.percentage, submittedAt: quizAttempts.submittedAt }).from(quizAttempts).where(and(eq(quizAttempts.userId, ctx.user.id), eq(quizAttempts.quizId, item.id))).orderBy(desc(quizAttempts.submittedAt));
      return { quiz: item, questions: questions.map(({ correctOption, ...question }) => question), attempts };
    }),
    submit: studentProcedure.input(z.object({ quizId: z.number().int().positive(), answers: z.array(z.object({ questionId: z.number().int().positive(), selectedOption: z.number().int().min(0) })) })).mutation(async ({ ctx, input }) => {
      const connection = await requireDb();
      const quiz = await connection.select().from(quizzes).where(eq(quizzes.id, input.quizId)).limit(1);
      const item = quiz[0];
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Quiz not found." });
      const enrollment = await requireEnrollment(item.courseId, ctx.user.id);
      const questions = await db.getQuizQuestions(item.id);
      const grade = gradeQuiz(questions, input.answers);
      await connection.insert(quizAttempts).values({ quizId: item.id, courseId: item.courseId, userId: ctx.user.id, answers: input.answers, ...grade });
      const completion = await evaluateCompletion(ctx.user.id, item.courseId, enrollment.id);
      return { ...grade, passingScore: item.passingScore, passed: grade.percentage >= item.passingScore, completion, review: questions.map((question) => ({ id: question.id, question: question.question, options: question.options, correctOption: question.correctOption, explanation: question.explanation, selectedOption: input.answers.find((answer) => answer.questionId === question.id)?.selectedOption })) };
    }),
  }),

  instructor: router({
    analytics: instructorProcedure.query(async ({ ctx }) => {
      requireRole("instructor", ctx.user.role);
      return db.getInstructorAnalytics(ctx.user.id);
    }),
    courses: instructorProcedure.query(async ({ ctx }) => {
      requireRole("instructor", ctx.user.role);
      return db.getInstructorCourses(ctx.user.id);
    }),
    course: instructorProcedure.input(z.object({ courseId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const { connection, course } = await requireOwnedCourse(input.courseId, ctx.user);
      const [sections, lessonRows, quizRows] = await Promise.all([
        connection.select().from(courseSections).where(eq(courseSections.courseId, course.id)).orderBy(asc(courseSections.sortOrder)),
        connection.select().from(lessons).where(eq(lessons.courseId, course.id)).orderBy(asc(lessons.sortOrder)),
        connection.select().from(quizzes).where(eq(quizzes.courseId, course.id)).orderBy(asc(quizzes.sortOrder)),
      ]);
      return { course, sections, lessons: lessonRows, quizzes: quizRows };
    }),
    createCourse: instructorProcedure.input(courseInput).mutation(async ({ ctx, input }) => {
      requireRole("instructor", ctx.user.role);
      const connection = await requireDb();
      const category = await connection.select().from(categories).where(eq(categories.id, input.categoryId)).limit(1);
      if (!category.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a valid category." });
      const result = await connection.insert(courses).values({ ...input, thumbnailUrl: input.thumbnailUrl ?? null, slug: createCourseSlug(input.title), instructorId: ctx.user.id, status: "draft", durationMinutes: 0 });
      return { courseId: Number((result as unknown as [{ insertId: number }])[0]?.insertId) };
    }),
    updateCourse: instructorProcedure.input(z.object({ courseId: z.number().int().positive(), data: courseInput.partial().extend({ status: statusSchema.optional() }) })).mutation(async ({ ctx, input }) => {
      const { connection } = await requireOwnedCourse(input.courseId, ctx.user);
      const data = { ...input.data, publishedAt: input.data.status === "published" ? new Date() : undefined };
      await connection.update(courses).set(data).where(eq(courses.id, input.courseId));
      return { success: true };
    }),
    deleteCourse: instructorProcedure.input(z.object({ courseId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const { connection } = await requireOwnedCourse(input.courseId, ctx.user);
      await connection.update(courses).set({ status: "archived" }).where(eq(courses.id, input.courseId));
      return { success: true };
    }),
    addSection: instructorProcedure.input(z.object({ courseId: z.number().int().positive(), title: z.string().min(2).max(220), description: z.string().max(1000).nullable().optional(), sortOrder: z.number().int().min(0) })).mutation(async ({ ctx, input }) => {
      const { connection } = await requireOwnedCourse(input.courseId, ctx.user);
      const result = await connection.insert(courseSections).values({ ...input, description: input.description ?? null });
      return { sectionId: Number((result as unknown as [{ insertId: number }])[0]?.insertId) };
    }),
    updateSection: instructorProcedure.input(z.object({ courseId: z.number().int().positive(), sectionId: z.number().int().positive(), title: z.string().min(2).max(220).optional(), description: z.string().max(1000).nullable().optional(), sortOrder: z.number().int().min(0).optional() })).mutation(async ({ ctx, input }) => {
      const { connection } = await requireOwnedCourse(input.courseId, ctx.user);
      await connection.update(courseSections).set({ title: input.title, description: input.description, sortOrder: input.sortOrder }).where(and(eq(courseSections.id, input.sectionId), eq(courseSections.courseId, input.courseId)));
      return { success: true };
    }),
    deleteSection: instructorProcedure.input(z.object({ courseId: z.number().int().positive(), sectionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const { connection } = await requireOwnedCourse(input.courseId, ctx.user);
      await connection.delete(courseSections).where(and(eq(courseSections.id, input.sectionId), eq(courseSections.courseId, input.courseId)));
      return { success: true };
    }),
    addLesson: instructorProcedure.input(z.object({ courseId: z.number().int().positive(), sectionId: z.number().int().positive(), title: z.string().min(2).max(240), description: z.string().max(4000).nullable().optional(), videoUrl: z.string().url().nullable().optional(), resources: z.array(resourceSchema).default([]), durationSeconds: z.number().int().min(0), sortOrder: z.number().int().min(0), isPreview: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
      const { connection } = await requireOwnedCourse(input.courseId, ctx.user);
      const section = await connection.select().from(courseSections).where(and(eq(courseSections.id, input.sectionId), eq(courseSections.courseId, input.courseId))).limit(1);
      if (!section.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Select a section belonging to this course." });
      const result = await connection.insert(lessons).values({ ...input, description: input.description ?? null, videoUrl: input.videoUrl ?? null });
      await connection.update(courses).set({ durationMinutes: sql`coalesce((select sum(${lessons.durationSeconds}) from ${lessons} where ${lessons.courseId} = ${input.courseId}), 0) / 60` }).where(eq(courses.id, input.courseId));
      return { lessonId: Number((result as unknown as [{ insertId: number }])[0]?.insertId) };
    }),
    updateLesson: instructorProcedure.input(z.object({ courseId: z.number().int().positive(), lessonId: z.number().int().positive(), title: z.string().min(2).max(240).optional(), description: z.string().max(4000).nullable().optional(), videoUrl: z.string().url().nullable().optional(), resources: z.array(resourceSchema).optional(), durationSeconds: z.number().int().min(0).optional(), sortOrder: z.number().int().min(0).optional(), isPreview: z.boolean().optional() })).mutation(async ({ ctx, input }) => {
      const { connection } = await requireOwnedCourse(input.courseId, ctx.user);
      const { courseId, lessonId, ...data } = input;
      await connection.update(lessons).set(data).where(and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)));
      return { success: true };
    }),
    deleteLesson: instructorProcedure.input(z.object({ courseId: z.number().int().positive(), lessonId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const { connection } = await requireOwnedCourse(input.courseId, ctx.user);
      await connection.delete(lessons).where(and(eq(lessons.id, input.lessonId), eq(lessons.courseId, input.courseId)));
      return { success: true };
    }),
    createQuiz: instructorProcedure.input(z.object({ courseId: z.number().int().positive(), title: z.string().min(2).max(240), description: z.string().max(2000).nullable().optional(), passingScore: z.number().int().min(1).max(100).default(70), sortOrder: z.number().int().min(0), isRequired: z.boolean().default(true) })).mutation(async ({ ctx, input }) => {
      const { connection } = await requireOwnedCourse(input.courseId, ctx.user);
      const result = await connection.insert(quizzes).values({ ...input, description: input.description ?? null });
      return { quizId: Number((result as unknown as [{ insertId: number }])[0]?.insertId) };
    }),
    deleteQuiz: instructorProcedure.input(z.object({ courseId: z.number().int().positive(), quizId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const { connection } = await requireOwnedCourse(input.courseId, ctx.user);
      await connection.delete(quizzes).where(and(eq(quizzes.id, input.quizId), eq(quizzes.courseId, input.courseId)));
      return { success: true };
    }),
    addQuizQuestion: instructorProcedure.input(z.object({ quizId: z.number().int().positive(), question: z.string().min(3), options: z.array(z.string().min(1)).min(2).max(6), correctOption: z.number().int().min(0), explanation: z.string().max(2000).nullable().optional(), points: z.number().int().min(1).max(100).default(1), sortOrder: z.number().int().min(0) })).mutation(async ({ ctx, input }) => {
      const connection = await requireDb();
      const quiz = await connection.select().from(quizzes).where(eq(quizzes.id, input.quizId)).limit(1);
      const item = quiz[0];
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Quiz not found." });
      await requireOwnedCourse(item.courseId, ctx.user);
      if (input.correctOption >= input.options.length) throw new TRPCError({ code: "BAD_REQUEST", message: "The correct answer must be one of the available options." });
      await connection.insert(quizQuestions).values({ ...input, explanation: input.explanation ?? null });
      return { success: true };
    }),
    deleteQuizQuestion: instructorProcedure.input(z.object({ quizId: z.number().int().positive(), questionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const connection = await requireDb();
      const item = await connection.select().from(quizzes).where(eq(quizzes.id, input.quizId)).limit(1);
      if (!item[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Quiz not found." });
      await requireOwnedCourse(item[0].courseId, ctx.user);
      await connection.delete(quizQuestions).where(and(eq(quizQuestions.id, input.questionId), eq(quizQuestions.quizId, input.quizId)));
      return { success: true };
    }),
  }),

  admin: router({
    overview: adminProcedure.query(async ({ ctx }) => {
      requireRole("admin", ctx.user.role);
      return db.getAdminOverview();
    }),
    users: adminProcedure.query(async ({ ctx }) => {
      requireRole("admin", ctx.user.role);
      return db.listUsers();
    }),
    updateUserRole: adminProcedure.input(z.object({ userId: z.number().int().positive(), role: z.enum(["student", "instructor", "admin"]) })).mutation(async ({ ctx, input }) => {
      requireRole("admin", ctx.user.role);
      const connection = await requireDb();
      await connection.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
      return { success: true };
    }),
    courses: adminProcedure.query(async ({ ctx }) => {
      requireRole("admin", ctx.user.role);
      return db.listCoursesForAdmin();
    }),
    setCourseStatus: adminProcedure.input(z.object({ courseId: z.number().int().positive(), status: statusSchema })).mutation(async ({ ctx, input }) => {
      requireRole("admin", ctx.user.role);
      const connection = await requireDb();
      await connection.update(courses).set({ status: input.status, publishedAt: input.status === "published" ? new Date() : null }).where(eq(courses.id, input.courseId));
      return { success: true };
    }),
    categories: adminProcedure.query(async ({ ctx }) => {
      requireRole("admin", ctx.user.role);
      return db.getCategories();
    }),
    enrollments: adminProcedure.query(async ({ ctx }) => {
      requireRole("admin", ctx.user.role);
      return db.getEnrollmentsForAdmin();
    }),
    createCategory: adminProcedure.input(z.object({ name: z.string().min(2).max(100), slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/), description: z.string().max(1000).nullable().optional() })).mutation(async ({ ctx, input }) => {
      requireRole("admin", ctx.user.role);
      const connection = await requireDb();
      await connection.insert(categories).values({ ...input, description: input.description ?? null });
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
