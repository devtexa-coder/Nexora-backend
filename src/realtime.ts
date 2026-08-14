import { Server } from "socket.io";
let io: Server | undefined;
export const setRealtime = (server: Server) => { io = server; };
export const emitRoom = (roomId: string, event: string, data: unknown) => io?.to(roomId).emit(event, data);
