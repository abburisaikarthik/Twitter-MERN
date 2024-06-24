import express from "express";
import authRoutes from "./routes/auth.routes.js";
import dotenv from "dotenv";
import connectMongoDB from "./db/connectMongoDB.js";

dotenv.config();
const app = express();

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

// console.log(process.env.MONGO_URI);

const port = process.env.PORT || 5000;
app.use("/api/auth", authRoutes);

app.listen(8000, () => {
  console.log(`server is running on port ${port}`);
  connectMongoDB();
});
