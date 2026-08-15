import { Router } from "express";
import { Category } from "./category.model.js";
import { asyncHandler } from "../../common/async-handler.js";
export const categoryRouter = Router();
categoryRouter.get("/", asyncHandler(async (_req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find({ active: true }).select({ _id: 0, id: 1, slug: 1, name: 1, description: 1, icon: 1, active: 1 }).lean(),
    Category.db.collection("questions").aggregate<{ _id: string; questionCount: number }>([{ $match: { active: true } }, { $group: { _id: "$categoryId", questionCount: { $sum: 1 } } }]).toArray(),
  ]);
  const countByCategory = new Map(counts.map((item) => [item._id, item.questionCount]));
  const data = categories.map((category) => ({ ...category, questionCount: countByCategory.get(category.id) ?? 0 }));
  res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
  res.json({ data });
}));
