import { Schema, model } from "mongoose";
import { Difficulty } from "../questions/question.model.js";
export type AnswerStatus = "correct" | "incorrect" | "unanswered";
interface Snapshot { questionId: string; question: string; answer: string; acceptedAnswers: string[]; explanation?: string; difficulty: Difficulty; }
interface Answer { questionId: string; answer: string; status: AnswerStatus; pointsAwarded: number; answeredAt: Date; }
export interface QuizSessionDocument { id: string; playerId: string; playerName: string; categoryId: string; categoryName: string; questionCount: number; timePerQuestionSeconds: number; difficulty: string; questions: Snapshot[]; answers: Answer[]; status: "active" | "completed"; score: number; startedAt: Date; currentQuestionStartedAt: Date; completedAt?: Date; }
const snapshotSchema = new Schema<Snapshot>({ questionId: String, question: String, answer: String, acceptedAnswers: [String], explanation: String, difficulty: String }, { _id: false });
const answerSchema = new Schema<Answer>({ questionId: String, answer: String, status: { type: String, enum: ["correct", "incorrect", "unanswered"] }, pointsAwarded: Number, answeredAt: Date }, { _id: false });
const schema = new Schema<QuizSessionDocument>({ id: { type: String, required: true, unique: true, immutable: true }, playerId: { type: String, required: true }, playerName: { type: String, required: true }, categoryId: { type: String, required: true }, categoryName: { type: String, required: true }, questionCount: Number, timePerQuestionSeconds: Number, difficulty: String, questions: { type: [snapshotSchema], required: true }, answers: { type: [answerSchema], default: [] }, status: { type: String, enum: ["active", "completed"], default: "active" }, score: { type: Number, default: 0 }, startedAt: { type: Date, default: Date.now }, currentQuestionStartedAt: { type: Date, default: Date.now }, completedAt: Date }, { timestamps: true, versionKey: false });
schema.index({ playerId: 1, createdAt: -1 });
export const QuizSession = model<QuizSessionDocument>("QuizSession", schema);
