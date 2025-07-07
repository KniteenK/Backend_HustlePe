import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    refPath: 'senderType'
  },
  senderType: { 
    type: String, 
    enum: ["Hustler", "Client"], 
    required: true 
  },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isInitialMessage: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'file'], 
    default: 'text' 
  },
  fileUrl: { type: String },
  fileName: { type: String }
}, { timestamps: true });

// Index for efficient queries
chatSchema.index({ roomId: 1, timestamp: 1 });
chatSchema.index({ sender: 1, timestamp: -1 });

export const Chat = mongoose.model("Chat", chatSchema);
