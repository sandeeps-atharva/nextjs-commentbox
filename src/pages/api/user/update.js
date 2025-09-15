import { pool } from "@/lib/connect";
import jwt from "jsonwebtoken";
import multer from "multer";
import cloudinary from "cloudinary";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dckrd0etw",
  api_key: process.env.CLOUDINARY_API_KEY || "457464228816313",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "HxUb9ed6Mj8iGvYbk99DjqZTvNg",
});

// Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Wrap multer in a promise
const runMiddleware = (req, res, fn) =>
  new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      resolve(result);
    });
  });

// Cloudinary upload helper
const uploadToCloudinary = (buffer, filename) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder: "user_profiles",
        resource_type: "auto",
        public_id: filename,
        transformation: [
          { width: 400, height: 400, crop: "fill" },
          { quality: "auto:good" },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
  } catch (error) {
    return null;
  }
};

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Run multer to handle file
    await runMiddleware(req, res, upload.single("avatar"));

    const { firstname, lastname, userId } = req.body;

    // Validate required fields
    if (!firstname || !lastname) {
      return res
        .status(400)
        .json({ message: "Firstname and lastname are required" });
    }

    // Validate userId
    const userIdToUpdate = userId || decoded.userId || decoded.id;

    if (!userIdToUpdate) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Upload profile picture if exists
    let profilePicUrl = null;
    if (req.file) {
      try {
        const filename = `${firstname}_${userIdToUpdate}_${Date.now()}`;
        const cloudRes = await uploadToCloudinary(req.file.buffer, filename);
        profilePicUrl = cloudRes.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          message: "Failed to upload image. Please try again.",
        });
      }
    }

    // Build dynamic SQL
    let sql = `UPDATE users SET firstname = ?, lastname = ?`;
    let values = [firstname.trim(), lastname.trim()];

    if (profilePicUrl) {
      sql += `, profile_pic = ?`;
      values.push(profilePicUrl);
    }

    sql += ` WHERE id = ?`;
    values.push(userIdToUpdate);

    // Update user
    const [updateResult] = await pool.query(sql, values);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get updated user with role
    const [rows] = await pool.query(
      `SELECT 
      u.id, 
      u.email, 
      u.firstname, 
      u.lastname, 
      u.profile_pic AS avatar, 
      u.created_at, 
      u.role_id,
      r.name AS role_name
   FROM users u
   LEFT JOIN roles r ON u.role_id = r.id
   WHERE u.id = ?`,
      [userIdToUpdate]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found after update" });
    }
    const user = rows[0];

    // Fetch permissions for this role (assuming role_permissions table)
    const [permRows] = await pool.query(
      `SELECT p.name
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = ?`,
      [user.role_id] // role_id from user
    );

    const permissions = permRows.map((p) => p.name);

    return res.status(200).json({
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      avatar: user.avatar,
      role: user.role_name,
      permissions,
    });
  } catch (err) {
    console.error("Update user error:", err);

    // Handle specific multer errors
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File too large. Maximum size is 5MB." });
    }

    if (err.message === "Only image files are allowed") {
      return res.status(400).json({ message: "Only image files are allowed" });
    }

    return res.status(500).json({ message: "Server error" });
  }
}
