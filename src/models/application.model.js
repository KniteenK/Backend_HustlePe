import mongoose from "mongoose";

const appSchema = new mongoose.Schema({
    gig_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'gigs',
        required: true,
    },
    hustler_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hustler',
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
}, {timestamps: true} ) ;

export const Application = mongoose.model('Application' , appSchema) ;