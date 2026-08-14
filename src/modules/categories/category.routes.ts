import { Router } from "express";
import { Category } from "./category.model.js";
import { asyncHandler } from "../../common/async-handler.js";
export const categoryRouter = Router();
categoryRouter.get("/", asyncHandler(async (_req, res) => {
  const categories = await Category.aggregate([{ $match: { active: true } }, { $lookup: { from: "questions", let: { categoryId: "$id" }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$categoryId", "$$categoryId"] }, { $eq: ["$active", true] }] } } }, { $count: "count" }], as: "counts" } }, { $project: { _id: 0, id: 1, slug: 1, name: 1, description: 1, icon: 1, active: 1, questionCount: { $ifNull: [{ $arrayElemAt: ["$counts.count", 0] }, 0] } } }]);
  res.json({ data: categories });
}));
