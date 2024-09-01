import mongoose from 'mongoose';

const gigSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
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
    applications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
    }] ,
    skills_req: [{
        type: String,
    }] ,
    payment_option: {
        type: String,
        enum: ['escrow', 'milestone'],
        default: 'escrow',
    }
} , {timestamps: true});

export const gigs = mongoose.model('gigs', gigSchema);