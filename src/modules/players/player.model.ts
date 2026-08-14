import { Schema, model } from "mongoose";
export interface PlayerDocument { id: string; name: string; }
const schema = new Schema<PlayerDocument>({ id: { type: String, required: true, unique: true, immutable: true }, name: { type: String, required: true, trim: true, maxlength: 30 } }, { timestamps: true, versionKey: false });
export const Player = model<PlayerDocument>("Player", schema);
