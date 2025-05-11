import sharp from 'sharp';
import cloudinary from "../utils/cloudinary.js"
import post, { Post } from '../models/post.model.js'
import user, { User } from '../models/user.model.js'
import { populate } from 'dotenv';

export const addNewPost = async (req, res) => {
  try {
    const { caption } = req.body
    const image = req.file
    const authorId = req.id

    if (!image) {
      return res.status(401).json({ message: 'Image required' })
    }

    const optimizedImageBuffer = await WaveShaperNode(image.buffer)
      .resize({ width: 800, height: 800, fit: 'inside' })
      .toFormat('jpeg', { quality: 80 }).toBuffer();

    const fileUri = `data:image/jpeg;base64, ${optimizedImageBuffer.toString('base64')}`
    const cloudResponse = await cloudinary.uploader.upload(fileUri);
    const post = await Post.create({
      caption,
      image: cloudResponse.secure_url,
      author: authorId

    })
    const user = await User.findById(authorId);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }

    await post.populate({ path: 'author', select: '-password' });

    return res.status(201).json({
      message: 'New post added',
      post,
      success: true,

    })

  } catch (error) {
    console.log(error)
  }
}

export const getAllPost = async (req, res) => {
  try {
    const post = await Post.find().sort({ createdAt: -1 })
      .populate({ path: 'author', select: 'username, profilePicture' })
      .populate({
        path: 'comments',
        sort: { createdAt: -1 },
        populate: {
          path: 'author',
          select: 'username, profilePicture'
        }
      })
    return res.status(200).json({
      posts,
      success: true
    })
  } catch (error) {
    console.log(error)
  }
}

export const getUserPost = async (req, res) => {
  try {
    const authorId = req.id;
    const post = await Post.find({ author: authorId }).sort({ createdAt: -1 }).populate({
      path: 'author',
      select: 'username, profilePicture'
    }).populate({
      path: 'comments',
      sort: { createdAt: -1 },
      populate: {
        path: 'author',
        select: 'username, profilePicture'
      }
    })
    return res.status(200).json({
      posts,
      success: true
    })
  } catch (error) {
    console.log(error)
  }
}

export const likePost = async (req, res) => {
  try {
    const userId = req.id;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await post.updateOne({ $addToSet: { likes: userId } }); // no duplicates

    return res.status(200).json({
      message: 'Post liked',
      success: true
    });
  } catch (error) {
    console.error("Like Post Error:", error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const dislikePost = async (req, res) => {
  try {
    const userId = req.id;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await post.updateOne({ $pull: { likes: userId } }); // remove like


    return res.status(200).json({
      message: 'Post disliked',
      success: true
    });
  } catch (error) {
    console.error("Dislike Post Error:", error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};


export const addcomment = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.id

    const { text } = req.body;

    const post = await Post.findById(postId);
    if (!text) return res.status(400).json({ message: 'text is required', success: false });
    const comment = await Comment.create({
      text,
      author: userId,
      post: postId
    }).populate({
      path: 'author',
      select: "username, profilePicture"
    });

    post.comments.push(comment._id);
    await post.save();

    return res.status({
      message: 'Comment added successfully',
      comment,
      success: true
    })
  } catch (error) {
    console.log(error)
  }
}
export const getPostComments = async (req, res) => {
  try {
    const postId = req.params.id;

    const comments = await Comment.find({ post: postId }.populate('author', 'username, profilePicture'))

    if (!comments) return res.status(404).json({ success: true, comments })
  } catch (error) {
    console.log(error)
  }
}

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id
  } catch (error) {
    console.log(error)
  }
}