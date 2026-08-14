import { Router } from "express";
import { asyncHandler } from "../../common/async-handler.js";
import { parse } from "../../common/validation.js";
import { Question } from "./question.model.js";
import { randomQuestionsSchema } from "./question.schemas.js";
import { redact, selectQuestions } from "./question.service.js";
export const questionRouter = Router();
questionRouter.get("/", asyncHandler(async (req, res) => { const limit = Math.min(Number(req.query.limit) || 50, 50); const filter: Record<string, unknown> = { active: true }; if (typeof req.query.categoryId === "string") filter.categoryId = req.query.categoryId; if (typeof req.query.difficulty === "string" && req.query.difficulty !== "mixed") filter.difficulty = req.query.difficulty; const questions = await Question.find(filter).sort({ id: 1 }).limit(limit + 1); res.json({ data: questions.slice(0, limit).map(redact), nextCursor: questions.length > limit ? questions[limit]?.id ?? null : null }); }));
questionRouter.post("/random", asyncHandler(async (req, res) => { const input = parse(randomQuestionsSchema, req.body); const questions = await selectQuestions(input.categoryId, input.count, input.difficulty ?? "mixed"); res.json({ data: questions.map(redact) }); }));
