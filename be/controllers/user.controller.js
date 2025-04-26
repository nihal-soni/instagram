import { User } from "../models/user.model.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body
        if (!username || !email || !password) {
            return res.status(401).json({
                message: "All fields are required!",
                success: false,
            })
        }
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({
                message: 'User already exists with this email or username.',
                success: false,
            });
        }
        const hassedPassword = await bcrypt.hash(password, 10)
        const newUser = new User({
            username,
            email,
            password: hassedPassword
        });
        await newUser.save();
        res.status(201).json({
            message: 'User registered successfully!',
            success: true,
        });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({
            message: 'Something went wrong during registration.',
            success: false,
        });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required.",
                success: false,
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                message: "Invalid credentials.",
                success: false,
            });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Invalid credentials",
                success: false,
            })
        }

        const userdata = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followers: user.followers,
            followings: user.followings,
            posts: user.posts
        };
        
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1d" });
        
        return res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === "production", // add secure in production
            maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
        }).json({
            message: `Welcome back ${user.username}`,
            success: true,
            userdata
        });
        
    } catch (error) {
        console.log(error)
    }
};

export const logout = async (req, res) => {
    try {
        return res.cookie("token", "", { maxAge: 0 }).json({
            message: 'Logged out successfully.',
            success: true
        })
    } catch (error) {
        console.log(error)
    }
}

export const getProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        let user = await User.findById(userId).select('-__v -password');    
        return res.status(200).json({
            user,
            success: true
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'Failed to fetch user profile',
            success: false
        });
    }
};

export const editProfile = async (req, res) => {
    try {
        const userId = req.id;
        const { bio, gender } = req.body;
        const profilePicture = req.file
        let cloudResonse;
        if (profilePicture) {
            const fileUri = getDataUri(profilePicture)
            cloudResonse = await cloudinary.uploader.upload(fileUri)
        }
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                message: 'user not found',
                success: false
            })
        }
        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (profilePicture) user.profilePicture = cloudResponse.secure.url;

        await user.save()

        return res.status(200).json({
            message: 'Profile updated',
            success: true,
            user
        })
    } catch (error) {
        console.log(error)
    }
}
export const getSuggestedUsers = async (req, res) => {
    try {
        const currentUser = await User.findById(req.id);

        if (!currentUser) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Users not followed by current user AND not the current user
        const excludedUserIds = [req.id, ...currentUser.followings];

        const suggestedUsers = await User.find({
            _id: { $nin: excludedUserIds }
        })
            .limit(5) // or any number you prefer
            .select("_id username profilePicture");

        return res.status(200).json({
            success: true,
            users: suggestedUsers
        });

    } catch (error) {
        console.error("Suggested Users Error:", error);
        res.status(500).json({
            message: "Failed to fetch suggested users",
            success: false
        });
    }
};

export const followOrUnfollow = async (req, res) => {
    try {
        const currentUserId = req.id;
        const targetUserId = req.params.id;
        if (currentUserId === targetUserId) {
            return res.status(400).json({
                success: false,
                message: "You can't follow/unfollow yourself."
            });
        }
        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(targetUserId);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User to follow/unfollow not found."
            });
        }
        const isFollowing = currentUser.followings.includes(targetUserId);

        if (isFollowing) {
            // Unfollow
            currentUser.followings.pull(targetUserId);
            targetUser.followers.pull(currentUserId);
        } else {
            // Follow
            currentUser.followings.push(targetUserId);
            targetUser.followers.push(currentUserId);
        }

        await currentUser.save();
        await targetUser.save();

        return res.status(200).json({
            success: true,
            message: isFollowing ? "Unfollowed user." : "Followed user."
        });


    } catch (error) {
        console.error("Follow/Unfollow Error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong."
        });
    }
};
