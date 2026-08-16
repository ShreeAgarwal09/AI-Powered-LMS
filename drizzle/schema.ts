import { boolean, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const userRoles = ["student", "instructor", "admin"] as const;
export const courseLevels = ["beginner", "intermediate", "advanced"] as const;
export const courseStatuses = ["draft", "published", "archived"] as const;
export const enrollmentStatuses = ["active", "completed", "cancelled"] as const;
export const paymentStatuses = ["free", "pending", "paid", "refunded"] as const;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", userRoles).default("student").notNull(),
  headline: varchar("headline", { length: 180 }),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => [index("users_role_idx").on(table.role), index("users_email_idx").on(table.email)]);

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("categories_name_idx").on(table.name)]);

export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 240 }).notNull(),
  slug: varchar("slug", { length: 280 }).notNull().unique(),
  shortDescription: varchar("shortDescription", { length: 360 }).notNull(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  instructorId: int("instructorId").notNull().references(() => users.id, { onDelete: "restrict" }),
  categoryId: int("categoryId").notNull().references(() => categories.id, { onDelete: "restrict" }),
  level: mysqlEnum("level", courseLevels).default("beginner").notNull(),
  priceCents: int("priceCents").default(0).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: mysqlEnum("status", courseStatuses).default("draft").notNull(),
  objectives: json("objectives").$type<string[]>().notNull(),
  requirements: json("requirements").$type<string[]>().notNull(),
  tags: json("tags").$type<string[]>().notNull(),
  durationMinutes: int("durationMinutes").default(0).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("courses_instructor_idx").on(table.instructorId), index("courses_category_idx").on(table.categoryId), index("courses_status_idx").on(table.status), index("courses_level_idx").on(table.level)]);

export const courseSections = mysqlTable("courseSections", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 220 }).notNull(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("sections_course_idx").on(table.courseId), uniqueIndex("sections_course_order_uq").on(table.courseId, table.sortOrder)]);

export const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  sectionId: int("sectionId").notNull().references(() => courseSections.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 240 }).notNull(),
  description: text("description"),
  videoUrl: text("videoUrl"),
  resources: json("resources").$type<{ label: string; url: string }[]>().notNull(),
  durationSeconds: int("durationSeconds").default(0).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isPreview: boolean("isPreview").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("lessons_course_idx").on(table.courseId), index("lessons_section_idx").on(table.sectionId)]);

export const enrollments = mysqlTable("enrollments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: int("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", enrollmentStatuses).default("active").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", paymentStatuses).default("free").notNull(),
  amountCents: int("amountCents").default(0).notNull(),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("enrollments_user_course_uq").on(table.userId, table.courseId), index("enrollments_course_idx").on(table.courseId), index("enrollments_user_idx").on(table.userId)]);

export const lessonProgress = mysqlTable("lessonProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: int("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  lessonId: int("lessonId").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  lastPositionSeconds: int("lastPositionSeconds").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("lesson_progress_user_lesson_uq").on(table.userId, table.lessonId), index("lesson_progress_course_idx").on(table.userId, table.courseId)]);

export const quizzes = mysqlTable("quizzes", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 240 }).notNull(),
  description: text("description"),
  passingScore: int("passingScore").default(70).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isRequired: boolean("isRequired").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("quizzes_course_idx").on(table.courseId)]);

export const quizQuestions = mysqlTable("quizQuestions", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  options: json("options").$type<string[]>().notNull(),
  correctOption: int("correctOption").notNull(),
  explanation: text("explanation"),
  points: int("points").default(1).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("quiz_questions_quiz_idx").on(table.quizId)]);

export const quizAttempts = mysqlTable("quizAttempts", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  courseId: int("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  answers: json("answers").$type<{ questionId: number; selectedOption: number }[]>().notNull(),
  score: int("score").notNull(),
  maxScore: int("maxScore").notNull(),
  percentage: int("percentage").notNull(),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
}, (table) => [index("quiz_attempts_user_quiz_idx").on(table.userId, table.quizId), index("quiz_attempts_course_idx").on(table.courseId)]);

export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  enrollmentId: int("enrollmentId").notNull().references(() => enrollments.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: int("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  certificateCode: varchar("certificateCode", { length: 64 }).notNull().unique(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("certificates_enrollment_uq").on(table.enrollmentId), index("certificates_user_idx").on(table.userId)]);

export const purchases = mysqlTable("purchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: int("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }).notNull().unique(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  amountCents: int("amountCents").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("purchases_user_idx").on(table.userId), index("purchases_course_idx").on(table.courseId)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
