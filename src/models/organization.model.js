import mongoose from "mongoose";

const orgSchema = new mongoose.Schema({
    description: {
        type: String,
    },
    name: {
        type: String,
        unique: true,
        required: true
    },
    leader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hustler",
        required: true
    },
    rating: {
        type: Number,
        default: 0
    },
    
}, { timestamps: true });

export const organization = mongoose.model("organization", orgSchema);