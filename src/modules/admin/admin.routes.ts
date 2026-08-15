import crypto from "node:crypto";
import { Router } from "express";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
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
  if (missing.length) await Category.insertMany(missing.map((id) => ({ id, slug: id, name: id.split("-").map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" "), active: true })));

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

adminRouter.get("/questions", asyncHandler(async (_req, res) => {
  const questions = await Question.find().sort({ updatedAt: -1 }).limit(100);
  res.json({ data: questions });
}));
adminRouter.patch("/questions/:id", asyncHandler(async (req, res) => {
  const fields = parse(createQuestionsSchema.shape.questions.element.partial(), req.body);
  if (fields.categoryId) {
    const category = await Category.findOne({ id: fields.categoryId });
    if (!category) throw new ApiError(400, "INVALID_CATEGORY", `Unknown category: ${fields.categoryId}.`);
  }
  const question = await Question.findOneAndUpdate({ id: String(req.params.id) }, { $set: fields }, { new: true });
  if (!question) throw new ApiError(404, "QUESTION_NOT_FOUND", "Question not found.");
  res.json({ data: question });
}));
adminRouter.delete("/questions/:id", asyncHandler(async (req, res) => {
  const question = await Question.findOneAndDelete({ id: String(req.params.id) });
  if (!question) throw new ApiError(404, "QUESTION_NOT_FOUND", "Question not found.");
  res.status(204).send();
}));

const categoryInput = z.object({ id: z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens for the category ID.").optional(), name: z.string().trim().min(2).max(50), description: z.string().trim().max(250).optional(), icon: z.string().trim().max(12).optional(), active: z.boolean().default(true) }).strict();
adminRouter.get("/categories", asyncHandler(async (_req, res) => res.json({ data: await Category.find().sort({ name: 1 }) })));
adminRouter.post("/categories", asyncHandler(async (req, res) => { const input = parse(categoryInput, req.body); const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); if (!slug) throw new ApiError(400, "INVALID_INPUT", "Category name must include letters or numbers."); const category = await Category.create({ ...input, id: input.id ?? `cat_${crypto.randomUUID()}`, slug }); res.status(201).json({ data: category }); }));
adminRouter.patch("/categories/:id", asyncHandler(async (req, res) => { const input = parse(categoryInput.omit({ id: true }).partial(), req.body); const category = await Category.findOneAndUpdate({ id: String(req.params.id) }, { $set: input }, { new: true }); if (!category) throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found."); res.json({ data: category }); }));
adminRouter.delete("/categories/:id", asyncHandler(async (req, res) => { const category = await Category.findOne({ id: String(req.params.id) }); if (!category) throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found."); const questionCount = await Question.countDocuments({ categoryId: category.id }); if (questionCount) throw new ApiError(409, "CATEGORY_HAS_QUESTIONS", "Disable this category or remove its questions first."); await category.deleteOne(); res.status(204).send(); }));
