import { app } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { createServer } from "node:http";
import { Server } from "socket.io";
import crypto from "node:crypto";
import { SocialRoom } from "./modules/social/social.model.js";
import { setRealtime } from "./realtime.js";
const server = createServer(app);
const io = new Server(server, { cors: { origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()) } });
setRealtime(io);
io.on("connection", (socket) => {
  socket.on("room:join", async ({ roomId, playerId }: { roomId: string; playerId: string }, done?: (result: { ok: boolean }) => void) => { const room = await SocialRoom.findOne({ id: roomId, "members.playerId": playerId }); if (!room) { socket.emit("room:error", "Join the lobby before opening its chat."); return done?.({ ok: false }); } await socket.join(roomId); done?.({ ok: true }); io.to(roomId).emit("room:presence", { roomId, online: (await io.in(roomId).fetchSockets()).length }); });
  socket.on("chat:send", async ({ roomId, playerId, text }: { roomId: string; playerId: string; text: string }) => { const message = text?.trim().slice(0, 500); if (!message) return; const room = await SocialRoom.findOne({ id: roomId, "members.playerId": playerId }); const member = room?.members.find((item) => item.playerId === playerId); if (!room || !member) return socket.emit("room:error", "You are not a member of this lobby."); const entry = { id: `msg_${crypto.randomUUID()}`, playerId, name: member.name, text: message, createdAt: new Date() }; room.messages.push(entry); if (room.messages.length > 100) room.messages = room.messages.slice(-100); await room.save(); io.to(roomId).emit("chat:message", { ...entry, createdAt: entry.createdAt.toISOString() }); });
  socket.on("match:draft", async ({ roomId, playerId, answer }: { roomId: string; playerId: string; answer: string }) => { const room = await SocialRoom.findOne({ id: roomId, status: "active", mode: "duel", "members.playerId": playerId }); if (!room?.match || room.match.turnPlayerId !== playerId) return; io.to(roomId).emit("match:draft", { playerId, answer: String(answer ?? "").slice(0, 1000) }); });
  socket.on("disconnecting", () => { socket.rooms.forEach((roomId) => { if (roomId !== socket.id) socket.to(roomId).emit("room:presence", { roomId, online: Math.max(0, (io.sockets.adapter.rooms.get(roomId)?.size ?? 1) - 1) }); }); });
});
connectDatabase().then(() => server.listen(env.PORT, () => console.log(`Nexora API + realtime server listening on :${env.PORT}`))).catch((error) => { console.error("Unable to connect to MongoDB", error); process.exit(1); });
