import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized : NO token",
      });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) {
      return res.status(401).json({
        error: "Unauthorized : Invalid token",
      });
    }

    const user = await User.findById(verified.id);
    req.user = user;
    next();
  } catch (error) {
    console.log(`Error in protectRoute middleware: ${error.message}`);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};
