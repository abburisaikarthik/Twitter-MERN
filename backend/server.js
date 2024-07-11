import express from "express";
import dotenv from "dotenv";
import connectMongoDB from "./db/connectMongoDB.js";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import postRoutes from "./routes/post.routes.js";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const app = express();

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

// console.log(process.env.MONGO_URI);

const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth/", authRoutes);
app.use("/api/users/", userRoutes);
app.use("/api/posts/", postRoutes);

app.listen(8000, () => {
  console.log(`server is running on port ${port}`);
  connectMongoDB();
});
