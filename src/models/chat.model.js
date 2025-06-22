import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderType: { type: String, enum: ["Hustler", "Client"], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export const Chat = mongoose.model("Chat", chatSchema);
