import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    caption: {
        type: String,
        default: ''
    },
    mediaUrl: {
        type: String,
        required: true
    },
    mediaType: {
        type: String,
        enum: ['image', 'video'],
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }],
    Comment: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'Comment'
    }]
}, {timestamps: true})

export const Post =  mongoose.model('Post', postSchema)