import mongoose from "mongoose";

const chatRequestSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'senderType'
    },
    senderType: {
        type: String,
        enum: ['Hustler', 'Client'],
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'receiverType'
    },
    receiverType: {
        type: String,
        enum: ['Hustler', 'Client'],
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    respondedAt: {
        type: Date,
        default: null
    }
}, { 
    timestamps: true 
});

// Ensure a user can only send one pending request to another user
chatRequestSchema.index({ senderId: 1, receiverId: 1, status: 1 }, { 
    unique: true, 
    partialFilterExpression: { status: 'pending' } 
});

export const ChatRequest = mongoose.model("ChatRequest", chatRequestSchema);
