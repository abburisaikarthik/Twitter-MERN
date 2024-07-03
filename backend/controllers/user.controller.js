import User from "../models/user.model.js";

import bcrypt from "bcrypt";

import { v2 as cloudinary } from "cloudinary";

import Notification from "../models/notification.model.js";
export const getUserProfile = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    // console.log(username);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.status(200).json({
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      followers: user.followers,
      following: user.following,
      profileImg: user.profileImg,
      coverImg: user.coverImg,
    });
  } catch (error) {
    console.log(`Error in getUserProfile controller: ${error.message}`);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userTOModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);
    if (id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        error: "Cannot follow/unfollow yourself",
      });
    }
    if (!userTOModify || !currentUser) {
      return res.status(404).json({
        error: "User not found",
      });
    }
    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      await User.findByIdAndUpdate(id, {
        $pull: { followers: req.user._id },
      });
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: id },
      });
      return res.status(200).json({
        message: "User unfollowed successfully",
      });
    } else {
      await User.findByIdAndUpdate(id, {
        $push: { followers: req.user._id },
      });
      await User.findByIdAndUpdate(req.user._id, {
        $push: { following: id },
      });

      const notification = new Notification({
        sender: req.user._id,
        receiver: id,
        type: "follow",
      });
      await notification.save();

      return res.status(200).json({
        message: "User followed successfully",
      });
    }
  } catch (error) {
    console.log(`Error in followUnfollowUser controller: ${error.message}`);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const usersFollowedByMe = await User.findById(userId).select("following");

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
        },
      },
      {
        $sample: { size: 10 },
      },
    ]);

    const filteredUsers = users.filter((user) => {
      return !usersFollowedByMe.following.includes(user._id);
    });
    const suggestedUsers = filteredUsers.slice(0, 4);
    suggestedUsers.forEach((user) => {
      user.password = null;
    });

    return res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log(`Error in getSuggestedUsers controller: ${error.message}`);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const updateUser = async (req, res) => {
  const { fullName, username, email, currentpassword, newpassword, bio, link } =
    req.body;

  let { profileImg, coverImg } = req.body;
  const userId = req.user._id;

  try {
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }
    if (
      (!newpassword && currentpassword) ||
      (newpassword && !currentpassword)
    ) {
      return res.status(400).json({
        error: "Please provide both current password and new password",
      });
    }

    if (newpassword && currentpassword) {
      const isMatch = await bcrypt.compare(currentpassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          error: "Invalid current password",
        });
      }
      if (newpassword.length < 6) {
        return res.status(400).json({
          error: "Password must be at least 6 characters long",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newpassword, salt);

      user.password = hashedPassword;
    }

    if (profileImg) {
      if (user.profileImg) {
        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }

      const uploadedresponse = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadedresponse.secure_url;
    }

    if (coverImg) {
      if (user.coverImg) {
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );
      }
      const uploadedresponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedresponse.secure_url;
    }

    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.username = username || user.username;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user = await user.save();
    user.password = null;

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.log(`Error in updateUser controller: ${error.message}`);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
