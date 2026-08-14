import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./common/api-error.js";
import { categoryRouter } from "./modules/categories/category.routes.js";
import { questionRouter } from "./modules/questions/question.routes.js";
import { quizRouter } from "./modules/quiz/quiz.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
export const app = express();
app.use(helmet()); app.use(cors({ origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()) })); app.use(express.json({ limit: "32kb" }));
// Browser tabs can issue retries or resume after being backgrounded. Keep the
// public limit generous while the quiz session itself remains the authority.
const quizLimit = rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false });
const adminLimit = rateLimit({ windowMs: 15 * 60_000, limit: 60, standardHeaders: "draft-7", legacyHeaders: false });
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/categories", categoryRouter); app.use("/api/questions", questionRouter); app.use("/api/quiz", quizLimit, quizRouter); app.use("/api/admin", adminLimit, adminRouter); app.use(notFound); app.use(errorHandler);
