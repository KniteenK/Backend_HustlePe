import mongoose from "mongoose";

const proposalSchema = new mongoose.Schema({
    gig: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "gigs",
        required: true
    },
    hustler: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hustler",
        required: true
    },
    cover_letter: {
        type: String,
        required: true,
        maxlength: 1200 // or any limit you want
    },
    expected_budget: {
        type: String,
        default: "Negotiable"
    },
    budget_type: {
        type: String,
        enum: ["fixed", "hourly", "negotiable", "as per client budget"],
        default: "negotiable"
    },
    estimated_timeline: {
        type: String,
        default: ""
    },
    availability: {
        type: String,
        default: ""
    },
    working_hours: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    }
}, { timestamps: true });

export const Proposal = mongoose.model("Proposal", proposalSchema);
