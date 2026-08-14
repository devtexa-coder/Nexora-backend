import { z } from "zod";
export const difficulty = z.enum(["easy", "medium", "hard", "expert", "mixed"]);
export const randomQuestionsSchema = z.object({ categoryId: z.string().trim().min(1), count: z.number().int().min(1).max(50), difficulty: difficulty.default("mixed") });
