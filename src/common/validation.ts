import { ZodError, ZodType } from "zod";
import { ApiError } from "./api-error.js";
export function parse<T>(schema: ZodType<T>, input: unknown): T { try { return schema.parse(input); } catch (error) { if (error instanceof ZodError) throw new ApiError(400, "INVALID_INPUT", "Please correct the highlighted fields.", Object.fromEntries(error.issues.map((issue) => [issue.path.join("."), issue.message]))); throw error; } }
