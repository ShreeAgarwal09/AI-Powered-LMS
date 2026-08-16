import { relations } from "drizzle-orm";
import { categories, certificates, courses, courseSections, enrollments, lessons, lessonProgress, purchases, quizAttempts, quizQuestions, quizzes, users } from "./schema";

export const courseRelations = relations(courses, ({ one, many }) => ({
  instructor: one(users, { fields: [courses.instructorId], references: [users.id] }),
  category: one(categories, { fields: [courses.categoryId], references: [categories.id] }),
  sections: many(courseSections),
  lessons: many(lessons),
  enrollments: many(enrollments),
  quizzes: many(quizzes),
  certificates: many(certificates),
  purchases: many(purchases),
}));

export const sectionRelations = relations(courseSections, ({ one, many }) => ({
  course: one(courses, { fields: [courseSections.courseId], references: [courses.id] }),
  lessons: many(lessons),
}));

export const lessonRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, { fields: [lessons.courseId], references: [courses.id] }),
  section: one(courseSections, { fields: [lessons.sectionId], references: [courseSections.id] }),
  progress: many(lessonProgress),
}));

export const enrollmentRelations = relations(enrollments, ({ one, many }) => ({
  user: one(users, { fields: [enrollments.userId], references: [users.id] }),
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
  certificates: many(certificates),
}));

export const quizRelations = relations(quizzes, ({ one, many }) => ({
  course: one(courses, { fields: [quizzes.courseId], references: [courses.id] }),
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
}));

export const questionRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, { fields: [quizQuestions.quizId], references: [quizzes.id] }),
}));

export const attemptRelations = relations(quizAttempts, ({ one }) => ({
  user: one(users, { fields: [quizAttempts.userId], references: [users.id] }),
  course: one(courses, { fields: [quizAttempts.courseId], references: [courses.id] }),
  quiz: one(quizzes, { fields: [quizAttempts.quizId], references: [quizzes.id] }),
}));

export const certificateRelations = relations(certificates, ({ one }) => ({
  enrollment: one(enrollments, { fields: [certificates.enrollmentId], references: [enrollments.id] }),
  user: one(users, { fields: [certificates.userId], references: [users.id] }),
  course: one(courses, { fields: [certificates.courseId], references: [courses.id] }),
}));

export const purchaseRelations = relations(purchases, ({ one }) => ({
  user: one(users, { fields: [purchases.userId], references: [users.id] }),
  course: one(courses, { fields: [purchases.courseId], references: [courses.id] }),
}));

