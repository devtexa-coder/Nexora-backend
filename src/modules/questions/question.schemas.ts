import { z } from "zod";
export const difficulty = z.enum(["easy", "medium", "hard", "expert", "mixed"]);
export const randomQuestionsSchema = z.object({ categoryId: z.string().trim().min(1), count: z.number().int().min(1).max(50), difficulty: difficulty.default("mixed") });

const questionWriteFields = z.object({
  categoryId: z.string().trim().min(1),
  question: z.string().trim().min(5).max(1_000),
  answer: z.string().trim().min(1).max(500),
  acceptedAnswers: z.array(z.string().trim().min(1).max(500)).max(25).default([]),
  explanation: z.string().trim().min(1).max(2_000).optional(),
  difficulty: difficulty.exclude(["mixed"]),
  active: z.boolean().default(true),
}).strict();

export const createQuestionsSchema = z.object({
  questions: z.array(questionWriteFields).min(1).max(50),
}).strict();
