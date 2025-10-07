import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"],
    },
  });
  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    socket.on("ping", () => socket.emit("pong"));

    socket.on("disconnect", (reason) => {
      console.log("socket disconnected:", socket.id, reason);
    });
  });
  return io;
}
//ฟังก์ชันนี้จะรับ HTTP server object (httpServer) เป็นพารามิเตอร์
//แล้วสร้าง WebSocket server ขึ้นมาโดยใช้ไลบรารี socket.io
//จากนั้นตั้งค่าการเชื่อมต่อ (connection) และส่งข้อความต้อนรับ (welcome message) ไปยังไคลเอนต์ที่เชื่อมต่อเข้ามาใหม่
//WS_EVENTS เป็น object ที่เก็บชื่อเหตุการณ์ (event names) ที่ใช้ใน WebSocket
