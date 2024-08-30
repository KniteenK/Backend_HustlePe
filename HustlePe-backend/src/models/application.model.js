import mongoose from "mongoose";

const appSchema = new mongoose.Schema({
    gig_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gig',
        required: true,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Declined'],
        default: 'Pending',
    },
    cover_letter: {
        type: String,
    },
}, {} ) ;

export const Application = mongoose.model('Application' , appSchema) ;