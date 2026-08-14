import { Schema, model } from "mongoose";
export type Difficulty = "easy" | "medium" | "hard" | "expert";
export interface QuestionDocument { id: string; categoryId: string; question: string; answer: string; acceptedAnswers: string[]; explanation?: string; difficulty: Difficulty; active: boolean; }
const schema = new Schema<QuestionDocument>({ id: { type: String, required: true, unique: true, immutable: true }, categoryId: { type: String, required: true }, question: { type: String, required: true }, answer: { type: String, required: true }, acceptedAnswers: { type: [String], default: [] }, explanation: String, difficulty: { type: String, enum: ["easy", "medium", "hard", "expert"], required: true }, active: { type: Boolean, default: true } }, { timestamps: true, versionKey: false });
schema.index({ categoryId: 1, active: 1, difficulty: 1 });
export const Question = model<QuestionDocument>("Question", schema);
