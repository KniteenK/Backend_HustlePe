import { Chat } from "./models/chat.model.js";

// Helper to generate a unique room ID for a hustler-client pair
function getRoomId(hustlerId, clientId) {
  // Always sort to ensure the same room for the same pair
  return [String(hustlerId), String(clientId)].sort().join("_");
}

export function initSocket(io) {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Join a room for a hustler-client pair
    socket.on("joinChat", ({ hustlerId, clientId }) => {
      const roomId = getRoomId(hustlerId, clientId);
      socket.join(roomId);
      socket.emit("roomJoined", { roomId });
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Send a message in a hustler-client room
    socket.on("sendMessage", async ({ hustlerId, clientId, senderId, senderType, message }) => {
      const roomId = getRoomId(hustlerId, clientId);

      // Save message to DB
      await Chat.create({
        roomId,
        sender: senderId,
        senderType, // "Hustler" or "Client"
        message,
        timestamp: new Date()
      });

      // Broadcast to all in the room (including sender for echo)
      io.to(roomId).emit("receiveMessage", {
        senderId,
        senderType,
        message,
        timestamp: new Date()
      });
    });

    // Fetch chat history for a hustler-client pair
    socket.on("getChatHistory", async ({ hustlerId, clientId }) => {
      const roomId = getRoomId(hustlerId, clientId);
      const history = await Chat.find({ roomId })
        .sort({ timestamp: 1 }); // oldest first
      socket.emit("chatHistory", history);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });
  });
}
