import { NextFunction, Request, Response } from "express";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) { super(message); }
}
export const notFound = (_req: Request, _res: Response, next: NextFunction) => next(new ApiError(404, "NOT_FOUND", "Route not found."));
export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ApiError) return res.status(error.status).json({ error: { code: error.code, message: error.message, ...(error.fields ? { fields: error.fields } : {}) } });
  if (error.name === "ValidationError") return res.status(400).json({ error: { code: "INVALID_INPUT", message: error.message } });
  console.error(error);
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected server error occurred." } });
};
