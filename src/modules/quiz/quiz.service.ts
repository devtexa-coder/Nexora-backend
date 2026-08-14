import crypto from "node:crypto";
import { ApiError } from "../../common/api-error.js";
import { Category } from "../categories/category.model.js";
import { Player } from "../players/player.model.js";
import { answersMatch, selectQuestions } from "../questions/question.service.js";
import { QuizSession, QuizSessionDocument } from "./quiz.model.js";
import { startQuizSchema } from "./quiz.schemas.js";
export async function startQuiz(input: { playerName: string; categoryId: string; questionCount: number; timePerQuestionSeconds: number; difficulty?: "easy" | "medium" | "hard" | "expert" | "mixed" }) {
  const category = await Category.findOne({ id: input.categoryId, active: true }); if (!category) throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found.");
  const difficulty = input.difficulty ?? "mixed"; const questions = await selectQuestions(input.categoryId, input.questionCount, difficulty);
  const player = await Player.create({ id: `pl_${crypto.randomUUID()}`, name: input.playerName });
  const session = await QuizSession.create({ id: `qs_${crypto.randomUUID()}`, playerId: player.id, playerName: player.name, categoryId: category.id, categoryName: category.name, questionCount: input.questionCount, timePerQuestionSeconds: input.timePerQuestionSeconds, difficulty, questions: questions.map((q) => ({ questionId: q.id, question: q.question, answer: q.answer, acceptedAnswers: q.acceptedAnswers, explanation: q.explanation, difficulty: q.difficulty })) });
  return { sessionId: session.id, player: { id: player.id, name: player.name }, category: { id: category.id, name: category.name }, questionCount: session.questionCount, timePerQuestionSeconds: session.timePerQuestionSeconds, questions: session.questions.map(({ questionId: id, question, difficulty, explanation }) => ({ id, question, difficulty, ...(explanation ? { explanation } : {}) })), startedAt: session.startedAt.toISOString() };
}
export async function submitAnswer(sessionId: string, questionId: string, answer: string) {
  const session = await QuizSession.findOne({ id: sessionId }); if (!session) throw new ApiError(404, "SESSION_NOT_FOUND", "Quiz session not found.");
  if (session.status !== "active") throw new ApiError(409, "SESSION_FINISHED", "This quiz session is already complete.");
  const questionIndex = session.questions.findIndex((q) => q.questionId === questionId); if (questionIndex < 0) throw new ApiError(400, "INVALID_QUESTION", "Question does not belong to this quiz session.");
  if (session.answers.some((item) => item.questionId === questionId)) throw new ApiError(409, "QUESTION_ALREADY_ANSWERED", "This question was already answered.");
  const expectedIndex = session.answers.length; if (questionIndex !== expectedIndex) throw new ApiError(409, "QUESTION_OUT_OF_ORDER", "Questions must be answered in order.");
  const deadline = session.currentQuestionStartedAt.getTime() + (session.timePerQuestionSeconds * 1000); const expired = Date.now() > deadline; const question = session.questions[questionIndex];
  const status = !answer.trim() || expired ? "unanswered" : answersMatch(answer, question) ? "correct" : "incorrect"; const pointsAwarded = status === "correct" ? 10 : 0; const answeredAt = new Date();
  session.answers.push({ questionId, answer, status, pointsAwarded, answeredAt }); session.score += pointsAwarded;
  await session.save();
  return { questionId, status, pointsAwarded, score: session.score, correctAnswer: question.answer, ...(question.explanation ? { explanation: question.explanation } : {}), answeredAt: answeredAt.toISOString() };
}
export async function advanceQuiz(sessionId: string) {
  const session = await QuizSession.findOne({ id: sessionId }); if (!session) throw new ApiError(404, "SESSION_NOT_FOUND", "Quiz session not found.");
  if (session.status !== "active") throw new ApiError(409, "SESSION_FINISHED", "This quiz session is already complete.");
  if (!session.answers.length || session.answers.length >= session.questionCount) throw new ApiError(409, "INVALID_ADVANCE", "There is no next question to start.");
  session.currentQuestionStartedAt = new Date(); await session.save();
  return { questionStartedAt: session.currentQuestionStartedAt.toISOString() };
}
export async function completeQuiz(sessionId: string) { const session = await QuizSession.findOne({ id: sessionId }); if (!session) throw new ApiError(404, "SESSION_NOT_FOUND", "Quiz session not found."); if (session.status === "active") { for (const question of session.questions.slice(session.answers.length)) session.answers.push({ questionId: question.questionId, answer: "", status: "unanswered", pointsAwarded: 0, answeredAt: new Date() }); session.status = "completed"; session.completedAt = new Date(); await session.save(); } return summary(session); }
export function summary(session: QuizSessionDocument) { const correct = session.answers.filter((a) => a.status === "correct").length; const incorrect = session.answers.filter((a) => a.status === "incorrect").length; const unanswered = session.questionCount - correct - incorrect; return { sessionId: session.id, status: "completed", score: session.score, maxScore: session.questionCount * 10, correct, incorrect, unanswered, accuracy: session.questionCount ? Math.round((correct / session.questionCount) * 100) : 0, totalTimeSeconds: Math.max(1, Math.round(((session.completedAt ?? new Date()).getTime() - session.startedAt.getTime()) / 1000)), completedAt: (session.completedAt ?? new Date()).toISOString() }; }
