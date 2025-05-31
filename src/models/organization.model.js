import mongoose from "mongoose";

// Sub-schema for organization members and their positions
const memberSchema = new mongoose.Schema({
    hustler: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hustler",
        required: true
    },
    position: {
        type: String,
        required: true
    }
}, { _id: false });

const orgSchema = new mongoose.Schema({
    description: {
        type: String,
    },
    name: {
        type: String,
        unique: true,
        required: true
    },
    founder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hustler",
        required: true
    },
    members: [memberSchema],
    rating: {
        type: Number,
        default: 0
    },
    
}, { timestamps: true });

export const organization = mongoose.model("organization", orgSchema);