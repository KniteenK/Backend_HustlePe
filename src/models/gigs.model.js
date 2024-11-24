import mongoose from 'mongoose';

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
    assigned_hustler: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hustler',
    }
} , {timestamps: true});

export const gigs = mongoose.model('gigs', gigSchema);