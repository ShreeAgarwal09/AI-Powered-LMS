import { and, asc, count, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  categories,
  certificates,
  courses,
  enrollments,
  InsertUser,
  lessons,
  lessonProgress,
  purchases,
  quizAttempts,
  quizQuestions,
  quizzes,
  courseSections,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = {
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    lastSignedIn: user.lastSignedIn ?? new Date(),
    role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "student"),
  };

  await db.insert(users).values(values).onDuplicateKeyUpdate({
    set: {
      name: values.name,
      email: values.email,
      loginMethod: values.loginMethod,
      lastSignedIn: values.lastSignedIn,
    },
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function getInstructorHighlights() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ instructor: users, courseCount: count(courses.id) })
    .from(users)
    .leftJoin(courses, eq(courses.instructorId, users.id))
    .where(eq(users.role, "instructor"))
    .groupBy(users.id)
    .orderBy(desc(count(courses.id)))
    .limit(3);
}

export async function getCourseCatalog(filters: { query?: string; categoryId?: number; level?: "beginner" | "intermediate" | "advanced"; price?: "free" | "paid" }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(courses.status, "published")];
  if (filters.categoryId) conditions.push(eq(courses.categoryId, filters.categoryId));
  if (filters.level) conditions.push(eq(courses.level, filters.level));
  if (filters.price === "free") conditions.push(eq(courses.priceCents, 0));
  if (filters.price === "paid") conditions.push(sql`${courses.priceCents} > 0`);
  if (filters.query?.trim()) {
    const term = `%${filters.query.trim()}%`;
    conditions.push(or(like(courses.title, term), like(courses.shortDescription, term), like(courses.description, term), like(users.name, term), sql`JSON_SEARCH(${courses.tags}, 'one', ${term}) IS NOT NULL`)!);
  }

  return db
    .select({ course: courses, instructorName: users.name, instructorHeadline: users.headline, categoryName: categories.name, categorySlug: categories.slug, enrollmentCount: sql<number>`(SELECT COUNT(*) FROM ${enrollments} WHERE ${enrollments.courseId} = ${courses.id})` })
    .from(courses)
    .leftJoin(users, eq(courses.instructorId, users.id))
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(courses.publishedAt), desc(courses.createdAt));
}

export async function getCourseBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const base = await db
    .select({ course: courses, instructor: users, category: categories })
    .from(courses)
    .leftJoin(users, eq(courses.instructorId, users.id))
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .where(eq(courses.slug, slug))
    .limit(1);
  const item = base[0];
  if (!item) return undefined;
  const [sectionRows, lessonRows, quizRows] = await Promise.all([
    db.select().from(courseSections).where(eq(courseSections.courseId, item.course.id)).orderBy(asc(courseSections.sortOrder)),
    db.select().from(lessons).where(eq(lessons.courseId, item.course.id)).orderBy(asc(lessons.sortOrder)),
    db.select().from(quizzes).where(eq(quizzes.courseId, item.course.id)).orderBy(asc(quizzes.sortOrder)),
  ]);
  const [enrollmentTotal] = await db.select({ count: count() }).from(enrollments).where(eq(enrollments.courseId, item.course.id));
  return { ...item, enrollmentCount: Number(enrollmentTotal?.count ?? 0), sections: sectionRows, lessons: lessonRows, quizzes: quizRows };
}

export async function getEnrollmentForCourse(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(enrollments).where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))).limit(1);
  return result[0];
}

export async function calculateCourseProgress(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return { totalLessons: 0, completedLessons: 0 };
  const [total] = await db.select({ value: count() }).from(lessons).where(eq(lessons.courseId, courseId));
  const [completed] = await db.select({ value: count() }).from(lessonProgress).where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.courseId, courseId), eq(lessonProgress.completed, true)));
  return { totalLessons: total?.value ?? 0, completedLessons: completed?.value ?? 0 };
}

export async function getStudentEnrollments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ enrollment: enrollments, course: courses, instructorName: users.name, categoryName: categories.name })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .leftJoin(users, eq(courses.instructorId, users.id))
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .where(eq(enrollments.userId, userId))
    .orderBy(desc(enrollments.updatedAt));
}

export async function getStudentCertificates(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ certificate: certificates, course: courses, instructorName: users.name })
    .from(certificates)
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .leftJoin(users, eq(courses.instructorId, users.id))
    .where(eq(certificates.userId, userId))
    .orderBy(desc(certificates.issuedAt));
}

export async function getQuizQuestions(quizId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId)).orderBy(asc(quizQuestions.sortOrder));
}

export async function getInstructorCourses(instructorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(courses).where(eq(courses.instructorId, instructorId)).orderBy(desc(courses.updatedAt));
}

export async function getAdminOverview() {
  const db = await getDb();
  if (!db) return { users: 0, students: 0, instructors: 0, courses: 0, publishedCourses: 0, enrollments: 0 };
  const [[allUsers], [students], [instructors], [allCourses], [publishedCourses], [allEnrollments]] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(users).where(eq(users.role, "student")),
    db.select({ value: count() }).from(users).where(eq(users.role, "instructor")),
    db.select({ value: count() }).from(courses),
    db.select({ value: count() }).from(courses).where(eq(courses.status, "published")),
    db.select({ value: count() }).from(enrollments),
  ]);
  return { users: allUsers?.value ?? 0, students: students?.value ?? 0, instructors: instructors?.value ?? 0, courses: allCourses?.value ?? 0, publishedCourses: publishedCourses?.value ?? 0, enrollments: allEnrollments?.value ?? 0 };
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function listCoursesForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ course: courses, instructorName: users.name, categoryName: categories.name }).from(courses).leftJoin(users, eq(courses.instructorId, users.id)).leftJoin(categories, eq(courses.categoryId, categories.id)).orderBy(desc(courses.updatedAt));
}

export async function getInstructorAnalytics(instructorId: number) {
  const db = await getDb();
  if (!db) return { courseCount: 0, publishedCourses: 0, studentCount: 0, revenueCents: 0 };
  const instructorCourses = await db.select({ id: courses.id, status: courses.status }).from(courses).where(eq(courses.instructorId, instructorId));
  if (!instructorCourses.length) return { courseCount: 0, publishedCourses: 0, studentCount: 0, revenueCents: 0 };
  const ids = instructorCourses.map((course) => course.id);
  const [studentRow] = await db.select({ value: count() }).from(enrollments).where(inArray(enrollments.courseId, ids));
  const [revenueRow] = await db.select({ value: sql<number>`coalesce(sum(${purchases.amountCents}), 0)` }).from(purchases).where(inArray(purchases.courseId, ids));
  return {
    courseCount: instructorCourses.length,
    publishedCourses: instructorCourses.filter((course) => course.status === "published").length,
    studentCount: studentRow?.value ?? 0,
    revenueCents: Number(revenueRow?.value ?? 0),
  };
}

export async function getPaymentHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ purchase: purchases, course: courses, instructorName: users.name })
    .from(purchases)
    .innerJoin(courses, eq(purchases.courseId, courses.id))
    .leftJoin(users, eq(courses.instructorId, users.id))
    .where(eq(purchases.userId, userId))
    .orderBy(desc(purchases.createdAt));
}

export async function getStudentQuizSummary(userId: number) {
  const db = await getDb();
  if (!db) return { attempts: 0, averageScore: 0, bestScore: 0 };
  const rows = await db
    .select({
      attempts: count(),
      averageScore: sql<number>`coalesce(round(avg(${quizAttempts.percentage})), 0)`,
      bestScore: sql<number>`coalesce(max(${quizAttempts.percentage}), 0)`,
    })
    .from(quizAttempts)
    .where(eq(quizAttempts.userId, userId));
  const item = rows[0];
  return { attempts: Number(item?.attempts ?? 0), averageScore: Number(item?.averageScore ?? 0), bestScore: Number(item?.bestScore ?? 0) };
}

export async function getEnrollmentsForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ enrollment: enrollments, courseTitle: courses.title, studentName: users.name, studentEmail: users.email })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .leftJoin(users, eq(enrollments.userId, users.id))
    .orderBy(desc(enrollments.enrolledAt));
}
