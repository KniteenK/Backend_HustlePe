import mongoose from 'mongoose';

// Milestone schema for milestone-based payments
const milestoneSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    due_date: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'released'],
        default: 'pending',
    }
}, { _id: false });

const gigSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'client',
    },
    description: {
        type: String,
        required: true,
    },
    deadline: {
        type: Date,
        required: true,
    },
    budget: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['open' , 'closed'],
        default: 'open',
    },
    skills_req: [{
        type: String,
    }] ,
    payment_option: {
        type: String,
        enum: ['escrow', 'milestone'],
        default: 'escrow',
    },
    milestones: [milestoneSchema], // Only used if payment_option is 'milestone'
    assigned_hustler: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hustler',
    }
} , {timestamps: true});

export const gigs = mongoose.model('gigs', gigSchema);