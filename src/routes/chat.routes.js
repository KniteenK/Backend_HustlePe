import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Chat } from "../models/chat.model.js";
import { ChatRequest } from "../models/chatRequest.model.js";
import { client } from "../models/client.model.js";
import { Hustler } from "../models/hustler.model.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

// Helper function to generate room ID
function getRoomId(userId1, userId2) {
  return [String(userId1), String(userId2)].sort().join("_");
}

// Get chat history between two users
router.get("/history", verifyJWT, asyncHandler(async (req, res) => {
    const { otherUserId } = req.query;
    const currentUserId = req.user._id;

    if (!otherUserId) {
        return res.status(400).json(new apiResponse(400, null, "otherUserId is required"));
    }

    const roomId = getRoomId(currentUserId, otherUserId);
    const history = await Chat.find({ roomId })
        .populate('sender', 'username email first_name last_name avatar')
        .sort({ timestamp: 1 });

    return res.status(200).json(new apiResponse(200, { history, roomId }, "Chat history fetched successfully"));
}));

// Get all conversations for a user
router.get("/conversations", verifyJWT, asyncHandler(async (req, res) => {
    const currentUserId = req.user._id;

    // Find all unique conversations where current user is involved
    const conversations = await Chat.aggregate([
        {
            $match: {
                $or: [
                    { roomId: { $regex: `^${currentUserId}_` } },
                    { roomId: { $regex: `_${currentUserId}$` } }
                ]
            }
        },
        {
            $group: {
                _id: "$roomId",
                lastMessage: { $last: "$message" },
                lastTimestamp: { $last: "$timestamp" },
                lastSender: { $last: "$sender" },
                lastSenderType: { $last: "$senderType" },
                messageCount: { $sum: 1 }
            }
        },
        {
            $sort: { lastTimestamp: -1 }
        }
    ]);

    // Get other user details for each conversation
    const enrichedConversations = await Promise.all(
        conversations.map(async (conv) => {
            const [userId1, userId2] = conv._id.split('_');
            const otherUserId = userId1 === currentUserId.toString() ? userId2 : userId1;
            
            // Try to find the other user in both Hustler and Client collections
            let otherUser = await Hustler.findById(otherUserId).select('username email first_name last_name avatar');
            let userType = 'Hustler';
            
            if (!otherUser) {
                otherUser = await client.findById(otherUserId).select('username email first_name last_name avatar');
                userType = 'Client';
            }

            return {
                ...conv,
                otherUser,
                otherUserType: userType,
                otherUserId
            };
        })
    );

    return res.status(200).json(new apiResponse(200, enrichedConversations.filter(conv => conv.otherUser), "Conversations fetched successfully"));
}));

// Send a chat request
router.post("/request", verifyJWT, asyncHandler(async (req, res) => {
    const { receiverId, receiverType, message } = req.body;
    const senderId = req.user._id;
    const senderType = req.user.userType || (req.originalUrl.includes('hustler') ? 'Hustler' : 'Client');

    if (!receiverId || !receiverType || !message) {
        return res.status(400).json(new apiResponse(400, null, "receiverId, receiverType, and message are required"));
    }

    // Check if receiver exists
    let receiver;
    if (receiverType === 'Hustler') {
        receiver = await Hustler.findById(receiverId);
    } else {
        receiver = await Client.findById(receiverId);
    }

    if (!receiver) {
        return res.status(404).json(new apiResponse(404, null, "Receiver not found"));
    }

    // Check if there's already a pending request between these users
    const existingRequest = await ChatRequest.findOne({
        $or: [
            { senderId, receiverId, status: 'pending' },
            { senderId: receiverId, receiverId: senderId, status: 'pending' }
        ]
    });

    if (existingRequest) {
        return res.status(400).json(new apiResponse(400, null, "Chat request already exists"));
    }

    // Create new chat request
    const chatRequest = await ChatRequest.create({
        senderId,
        senderType,
        receiverId,
        receiverType,
        message,
        status: 'pending'
    });

    const populatedRequest = await ChatRequest.findById(chatRequest._id)
        .populate('senderId', 'username email first_name last_name avatar')
        .populate('receiverId', 'username email first_name last_name avatar');

    return res.status(201).json(new apiResponse(201, populatedRequest, "Chat request sent successfully"));
}));

// Get received chat requests
router.get("/requests/received", verifyJWT, asyncHandler(async (req, res) => {
    const receiverId = req.user._id;

    const requests = await ChatRequest.find({ receiverId, status: 'pending' })
        .populate('senderId', 'username email first_name last_name avatar')
        .sort({ createdAt: -1 });

    return res.status(200).json(new apiResponse(200, requests, "Chat requests fetched successfully"));
}));

// Get sent chat requests
router.get("/requests/sent", verifyJWT, asyncHandler(async (req, res) => {
    const senderId = req.user._id;

    const requests = await ChatRequest.find({ senderId })
        .populate('receiverId', 'username email first_name last_name avatar')
        .sort({ createdAt: -1 });

    return res.status(200).json(new apiResponse(200, requests, "Sent requests fetched successfully"));
}));

// Accept/Reject chat request
router.put("/request/:requestId", verifyJWT, asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    const receiverId = req.user._id;

    if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json(new apiResponse(400, null, "Status must be 'accepted' or 'rejected'"));
    }

    const chatRequest = await ChatRequest.findById(requestId);
    if (!chatRequest) {
        return res.status(404).json(new apiResponse(404, null, "Chat request not found"));
    }

    if (chatRequest.receiverId.toString() !== receiverId.toString()) {
        return res.status(403).json(new apiResponse(403, null, "Not authorized to respond to this request"));
    }

    if (chatRequest.status !== 'pending') {
        return res.status(400).json(new apiResponse(400, null, "Request has already been responded to"));
    }

    chatRequest.status = status;
    chatRequest.respondedAt = new Date();
    await chatRequest.save();

    // If accepted, create initial chat message
    if (status === 'accepted') {
        const roomId = getRoomId(chatRequest.senderId, chatRequest.receiverId);
        await Chat.create({
            roomId,
            sender: chatRequest.senderId,
            senderType: chatRequest.senderType,
            message: chatRequest.message,
            timestamp: new Date(),
            isInitialMessage: true
        });
    }

    const populatedRequest = await ChatRequest.findById(requestId)
        .populate('senderId', 'username email first_name last_name avatar')
        .populate('receiverId', 'username email first_name last_name avatar');

    return res.status(200).json(new apiResponse(200, populatedRequest, `Chat request ${status} successfully`));
}));

// Search users (both hustlers and clients)
router.get("/search-users", verifyJWT, asyncHandler(async (req, res) => {
    const { query } = req.query;
    const currentUserId = req.user._id;

    if (!query || query.length < 2) {
        return res.status(400).json(new apiResponse(400, null, "Query must be at least 2 characters"));
    }

    const searchRegex = new RegExp(query, 'i');

    // Search hustlers
    const hustlers = await Hustler.find({
        _id: { $ne: currentUserId },
        $or: [
            { username: searchRegex },
            { first_name: searchRegex },
            { last_name: searchRegex },
            { email: searchRegex }
        ]
    }).select('username email first_name last_name avatar skills').limit(10);

    // Search clients
    const clients = await Client.find({
        _id: { $ne: currentUserId },
        $or: [
            { username: searchRegex },
            { first_name: searchRegex },
            { last_name: searchRegex },
            { email: searchRegex }
        ]
    }).select('username email first_name last_name avatar').limit(10);

    const results = [
        ...hustlers.map(h => ({ ...h.toObject(), userType: 'Hustler' })),
        ...clients.map(c => ({ ...c.toObject(), userType: 'Client' }))
    ];

    return res.status(200).json(new apiResponse(200, results, "Users found successfully"));
}));

export default router;
