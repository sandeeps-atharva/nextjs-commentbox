import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { pool } from "@/lib/connect";

export const config = {
  api: { bodyParser: false },
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dckrd0etw",
  api_key: process.env.CLOUDINARY_API_KEY || "457464228816313",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "HxUb9ed6Mj8iGvYbk99DjqZTvNg",
});

const upload = multer({ storage: multer.memoryStorage() });

const runMiddleware = (req, res, fn) =>
  new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      resolve(result);
    });
  });

// Cloudinary upload helper - Fixed the resource_type
const uploadToCloudinary = (buffer, filename) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "my_uploads",
        resource_type: "auto", // Changed from "row" to "auto"
        public_id: filename,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await runMiddleware(req, res, upload.single("avatar"));

    const { firstname, lastname, email, password, role_id } = req.body;

    if (!firstname || !lastname || !email || !password || !role_id) {
      return res.status(400).json({
        message:
          "Missing required fields: username, email, and password are required",
      });
    }

    const [existingUser] = await pool.execute(
      "SELECT * FROM users WHERE email = ? ",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let profilePicUrl = null;
    if (req.file) {
      try {
        const cloudRes = await uploadToCloudinary(
          req.file.buffer,
          firstname + "_profile"
        );
        profilePicUrl = cloudRes.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
      }
    }

    const [result] = await pool.execute(
      "INSERT INTO users (email, password, profile_pic,firstname,lastname , role_id) VALUES (?, ?, ?, ? , ? , ?)",
      [email, hashedPassword, profilePicUrl, firstname, lastname, role_id]
    );

    const token = jwt.sign(
      { userId: result.insertId, firstname },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: result.insertId,
        firstname,
        lastname,
        email,
        profilePic: profilePicUrl,
        role_id: role_id,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}
