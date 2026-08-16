import { describe, expect, it } from "vitest";
import { calculateProgress, gradeQuiz, isCertificateEligible } from "./educationUtils";

describe("learning progress", () => {
  it("calculates a whole-course completion percentage", () => {
    expect(calculateProgress(10, 8)).toBe(80);
    expect(calculateProgress(0, 0)).toBe(0);
  });
});

describe("quiz grading", () => {
  it("awards points only for correct answers", () => {
    const result = gradeQuiz(
      [
        { id: 1, correctOption: 1, points: 2 },
        { id: 2, correctOption: 0, points: 3 },
      ],
      [
        { questionId: 1, selectedOption: 1 },
        { questionId: 2, selectedOption: 2 },
      ],
    );
    expect(result).toEqual({ score: 2, maxScore: 5, percentage: 40 });
  });
});

describe("certificate eligibility", () => {
  it("requires completed lessons and required quizzes", () => {
    expect(isCertificateEligible({ progress: 100, requiredQuizzesPassed: true })).toBe(true);
    expect(isCertificateEligible({ progress: 100, requiredQuizzesPassed: false })).toBe(false);
    expect(isCertificateEligible({ progress: 90, requiredQuizzesPassed: true })).toBe(false);
  });
});

