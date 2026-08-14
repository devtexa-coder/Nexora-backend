import crypto from "node:crypto";
import { Router } from "express";
import { timingSafeEqual } from "node:crypto";
import { ApiError } from "../../common/api-error.js";
import { asyncHandler } from "../../common/async-handler.js";
import { parse } from "../../common/validation.js";
import { env } from "../../config/env.js";
import { Category } from "../categories/category.model.js";
import { Question } from "../questions/question.model.js";
import { createQuestionsSchema } from "../questions/question.schemas.js";

export const adminRouter = Router();

adminRouter.use((req, _res, next) => {
  const supplied = req.header("x-admin-api-key");
  const expected = env.ADMIN_API_KEY;
  if (!supplied || supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return next(new ApiError(401, "ADMIN_UNAUTHORIZED", "Administrator credentials are required."));
  }
  return next();
});

adminRouter.post("/questions", asyncHandler(async (req, res) => {
  const { questions } = parse(createQuestionsSchema, req.body);
  const categoryIds = [...new Set(questions.map((question) => question.categoryId))];
  const categories = await Category.find({ id: { $in: categoryIds } }).select({ id: 1 });
  const knownIds = new Set(categories.map((category) => category.id));
  const missing = categoryIds.filter((id) => !knownIds.has(id));
  if (missing.length) throw new ApiError(400, "INVALID_CATEGORY", `Unknown category: ${missing.join(", ")}.`);

  const created = await Question.insertMany(questions.map((question) => ({
    ...question,
    id: `q_${crypto.randomUUID()}`,
    acceptedAnswers: [...new Set((question.acceptedAnswers ?? []).filter((answer) => answer.toLowerCase() !== question.answer.toLowerCase()))],
  })));
  res.status(201).json({ data: created.map((question) => ({
    id: question.id, categoryId: question.categoryId, question: question.question, answer: question.answer,
    acceptedAnswers: question.acceptedAnswers, explanation: question.explanation, difficulty: question.difficulty, active: question.active,
  })) });
}));
