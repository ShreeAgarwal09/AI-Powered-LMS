import { nanoid } from "nanoid";

export function createCourseSlug(title: string) {
  const normalized = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${normalized || "course"}-${nanoid(7).toLowerCase()}`;
}

export function calculateProgress(totalLessons: number, completedLessons: number) {
  if (totalLessons <= 0) return 0;
  return Math.min(100, Math.round((completedLessons / totalLessons) * 100));
}

export function gradeQuiz(
  questions: { id: number; correctOption: number; points: number }[],
  answers: { questionId: number; selectedOption: number }[],
) {
  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer.selectedOption]));
  const maxScore = questions.reduce((sum, question) => sum + question.points, 0);
  const score = questions.reduce(
    (sum, question) => sum + (answerByQuestion.get(question.id) === question.correctOption ? question.points : 0),
    0,
  );
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return { score, maxScore, percentage };
}

export function isCertificateEligible(input: { progress: number; requiredQuizzesPassed: boolean }) {
  return input.progress === 100 && input.requiredQuizzesPassed;
}

export function createCertificateCode() {
  return `EDS-${nanoid(10).toUpperCase()}`;
}
