import { Schema, model } from "mongoose";
export interface CategoryDocument { id: string; slug: string; name: string; description?: string; icon?: string; active: boolean; }
const schema = new Schema<CategoryDocument>({ id: { type: String, required: true, unique: true, immutable: true }, slug: { type: String, required: true, unique: true }, name: { type: String, required: true }, description: String, icon: String, active: { type: Boolean, default: true } }, { timestamps: true, versionKey: false });
export const Category = model<CategoryDocument>("Category", schema);
