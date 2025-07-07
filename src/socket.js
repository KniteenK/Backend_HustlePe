import { Chat } from "./models/chat.model.js";

// Helper to generate a unique room ID for any two users
function getRoomId(userId1, userId2) {
  // Always sort to ensure the same room for the same pair
  return [String(userId1), String(userId2)].sort().join("_");
}

export function initSocket(io) {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Join a room for any two users (hustler-client, hustler-hustler, client-client)
    socket.on("joinChat", ({ currentUserId, otherUserId, hustlerId, clientId }) => {
      // Support both old and new parameter formats
      const userId1 = currentUserId || hustlerId;
      const userId2 = otherUserId || clientId;
      
      if (!userId1 || !userId2) {
        console.error("Missing user IDs for joinChat");
        return;
      }

      const roomId = getRoomId(userId1, userId2);
      socket.join(roomId);
      socket.emit("roomJoined", { roomId });
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Send a message in a room
    socket.on("sendMessage", async ({ 
      currentUserId, 
      otherUserId, 
      senderId, 
      senderType, 
      message, 
      messageType = 'text',
      // Support old format
      hustlerId,
      clientId
    }) => {
      // Support both old and new parameter formats
      const userId1 = currentUserId || hustlerId;
      const userId2 = otherUserId || clientId;
      const actualSenderId = senderId || hustlerId;
      const actualSenderType = senderType || "Hustler";

      if (!userId1 || !userId2 || !actualSenderId || !message) {
        console.error("Missing required parameters for sendMessage");
        return;
      }

      const roomId = getRoomId(userId1, userId2);

      try {
        // Save message to DB
        const newMessage = await Chat.create({
          roomId,
          sender: actualSenderId,
          senderType: actualSenderType,
          message,
          messageType,
          timestamp: new Date()
        });

        // Populate sender info
        const populatedMessage = await Chat.findById(newMessage._id)
          .populate('sender', 'username email first_name last_name avatar');

        // Broadcast to all in the room (including sender for echo)
        io.to(roomId).emit("receiveMessage", populatedMessage);
      } catch (error) {
        console.error("Error saving message:", error);
        socket.emit("messageError", { error: "Failed to send message" });
      }
    });

    // Fetch chat history for any two users
    socket.on("getChatHistory", async ({ currentUserId, otherUserId, hustlerId, clientId }) => {
      // Support both old and new parameter formats
      const userId1 = currentUserId || hustlerId;
      const userId2 = otherUserId || clientId;
      
      if (!userId1 || !userId2) {
        console.error("Missing user IDs for getChatHistory");
        return;
      }

      const roomId = getRoomId(userId1, userId2);
      try {
        const history = await Chat.find({ roomId })
          .populate('sender', 'username email first_name last_name avatar')
          .sort({ timestamp: 1 }); // oldest first
        socket.emit("chatHistory", history);
      } catch (error) {
        console.error("Error fetching chat history:", error);
        socket.emit("chatHistoryError", { error: "Failed to fetch chat history" });
      }
    });

    // Mark messages as read
    socket.on("markAsRead", async ({ roomId, userId }) => {
      try {
        await Chat.updateMany(
          { 
            roomId, 
            sender: { $ne: userId },
            isRead: false 
          },
          { isRead: true }
        );
        socket.to(roomId).emit("messagesRead", { roomId, readBy: userId });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // Handle typing indicators
    socket.on("typing", ({ roomId, userId, isTyping }) => {
      socket.to(roomId).emit("userTyping", { userId, isTyping });
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });
  });
}
