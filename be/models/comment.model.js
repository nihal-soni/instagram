import mongoose, { mongo } from "mongoose";

const commentSchema = new mongoose.Schema({
    text: {
        type: String
    },
    userId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    postId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    }]
}, { timestamps: true })

export default commentSchema = mongooose.model('Comment', commentSchema)