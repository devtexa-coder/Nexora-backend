import { z } from "zod";
import { difficulty } from "../questions/question.schemas.js";
export const startQuizSchema = z.object({ playerName: z.string().trim().min(1).max(30), categoryId: z.string().trim().min(1), questionCount: z.number().int().min(1).max(50), timePerQuestionSeconds: z.number().int().min(10).max(300), difficulty: difficulty.default("mixed") });
export const submitAnswerSchema = z.object({ questionId: z.string().min(1), answer: z.string().max(1000).optional().default(""), clientSubmittedAt: z.string().datetime().optional() });
