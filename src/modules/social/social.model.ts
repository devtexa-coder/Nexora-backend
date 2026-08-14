import { Schema, model } from "mongoose";

export interface FriendRequestDocument { id: string; fromId: string; fromName: string; toId: string; toName: string; status: "pending" | "accepted"; }
export interface RoomMember { playerId: string; name: string; team?: "violet" | "cyan"; }
export interface RoomMessage { id: string; playerId: string; name: string; text: string; createdAt: Date; }
export interface MatchQuestion { questionId: string; question: string; answer: string; acceptedAnswers: string[]; explanation?: string; difficulty: string; }
export interface MatchAnswer { playerId: string; questionIndex: number; answer: string; status: "correct" | "incorrect" | "unanswered" | "quit"; points: number; }
export interface MatchState { categoryId: string; categoryName: string; questionCount: number; timePerQuestionSeconds: number; questions: MatchQuestion[]; answers: MatchAnswer[]; turnPlayerId?: string; turnStartedAt?: Date; quitPlayerIds: string[]; }
export interface SocialRoomDocument { id: string; name: string; hostId: string; mode: "duel" | "team"; members: RoomMember[]; messages: RoomMessage[]; status: "open" | "active" | "completed"; match?: MatchState; }

const friendSchema = new Schema<FriendRequestDocument>({ id: { type: String, required: true, unique: true }, fromId: String, fromName: String, toId: String, toName: String, status: { type: String, enum: ["pending", "accepted"], default: "pending" } }, { timestamps: true, versionKey: false });
friendSchema.index({ fromId: 1, toId: 1 }, { unique: true });
const memberSchema = new Schema<RoomMember>({ playerId: String, name: String, team: { type: String, enum: ["violet", "cyan"] } }, { _id: false });
const messageSchema = new Schema<RoomMessage>({ id: String, playerId: String, name: String, text: String, createdAt: { type: Date, default: Date.now } }, { _id: false });
const matchQuestionSchema = new Schema<MatchQuestion>({ questionId: String, question: String, answer: String, acceptedAnswers: [String], explanation: String, difficulty: String }, { _id: false });
const matchAnswerSchema = new Schema<MatchAnswer>({ playerId: String, questionIndex: Number, answer: String, status: String, points: Number }, { _id: false });
const matchSchema = new Schema<MatchState>({ categoryId: String, categoryName: String, questionCount: Number, timePerQuestionSeconds: Number, questions: [matchQuestionSchema], answers: [matchAnswerSchema], turnPlayerId: String, turnStartedAt: Date, quitPlayerIds: [String] }, { _id: false });
const roomSchema = new Schema<SocialRoomDocument>({ id: { type: String, required: true, unique: true }, name: { type: String, required: true }, hostId: { type: String, required: true }, mode: { type: String, enum: ["duel", "team"], required: true }, members: { type: [memberSchema], default: [] }, messages: { type: [messageSchema], default: [] }, status: { type: String, enum: ["open", "active", "completed"], default: "open" }, match: matchSchema }, { timestamps: true, versionKey: false });
roomSchema.index({ status: 1, createdAt: -1 });
export const FriendRequest = model<FriendRequestDocument>("FriendRequest", friendSchema);
export const SocialRoom = model<SocialRoomDocument>("SocialRoom", roomSchema);
