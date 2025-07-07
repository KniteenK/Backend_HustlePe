import mongoose from "mongoose";

const orgApplicationSchema = new mongoose.Schema({
    hustler: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hustler",
        required: true
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "organization",
        required: true
    },
    application_message: {
        type: String,
        required: true,
        trim: true
    },
    desired_position: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    applied_at: {
        type: Date,
        default: Date.now
    },
    responded_at: {
        type: Date,
        default: null
    },
    response_message: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Ensure a hustler can only apply once to an organization
orgApplicationSchema.index({ hustler: 1, organization: 1 }, { unique: true });

export const OrgApplication = mongoose.model("OrgApplication", orgApplicationSchema);
