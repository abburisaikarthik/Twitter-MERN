import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { v2 as cloudinary } from "cloudinary";
export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body;
    const userId = req.user._id.toString();

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }
    if (!text && !img) {
      return res.status(400).json({
        error: "Please provide text or image",
      });
    }
    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.url;
    }
    const newpost = new Post({
      user: userId,
      text,
      img,
    });
    await newpost.save();
    return res.status(200).json({
      message: "Post created successfully",
      post: newpost,
    });
  } catch (error) {
    console.log(`Error in createPost controller: ${error.message}`);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    console.log(req.params);
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        error: "Post not found",
      });
    }
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (post.img) {
      const imageId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imageId);
    }

    await Post.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.log(`Error in deletePost controller: ${error.message}`);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;

    const { id } = req.params;
    const userId = req.user._id.toString();
    if (!text) {
      return res.status(400).json({
        error: "Please provide text",
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        error: "Post not found",
      });
    }
    const comment = {
      user: userId,
      text,
    };
    post.comments.push(comment);
    await post.save();
    return res.status(200).json({
      message: "Comment added successfully",
      post,
    });
  } catch (error) {
    console.log(`Error in commentOnPost controller: ${error.message}`);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        error: "Post not found",
      });
    }

    const userLikedPost = post.likes.includes(req.user._id);

    if (userLikedPost) {
      //unlike the post

      await Post.updateOne(
        { _id: id },
        { $pull: { likes: userId.toString() } }
      );

      return res.status(200).json({ message: "Post unliked successfully" });
    } else {
      post.likes.push(userId);
      await post.save();

      const notification = new Notification({
        sender: userId,
        receiver: post.user,
        type: "like",
      });
      await notification.save();
      return res.status(200).json({ message: "Post liked successfully" });
    }
  } catch (error) {
    console.log(`Error in likeUnlikePost controller: ${error.message}`);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
