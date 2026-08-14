import { ApiError } from "../../common/api-error.js";
import { Question, QuestionDocument } from "./question.model.js";
export function redact(question: QuestionDocument) { return { id: question.id, categoryId: question.categoryId, question: question.question, difficulty: question.difficulty, ...(question.explanation ? { explanation: question.explanation } : {}) }; }
export async function selectQuestions(categoryId: string, count: number, difficulty: string) {
  const filter: Record<string, unknown> = { categoryId, active: true }; if (difficulty !== "mixed") filter.difficulty = difficulty;
  const availableCount = await Question.countDocuments(filter);
  if (availableCount < count) throw new ApiError(409, "QUESTION_COUNT_UNAVAILABLE", `Only ${availableCount} matching questions are available.`, { availableCount: String(availableCount) });
  return Question.aggregate<QuestionDocument>([{ $match: filter }, { $sample: { size: count } }]);
}
export function normalizeAnswer(value: string) { return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.,!?]/g, ""); }
export function answersMatch(answer: string, question: Pick<QuestionDocument, "answer" | "acceptedAnswers">) { const received = normalizeAnswer(answer); const accepted = [question.answer, ...question.acceptedAnswers].map(normalizeAnswer); if (accepted.includes(received)) return true; const numeric = Number(received.replace(/[$,%]/g, "")); return Number.isFinite(numeric) && accepted.some((item) => Number.isFinite(Number(item)) && Number(item) === numeric); }
