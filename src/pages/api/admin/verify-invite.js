import { pool } from "@/lib/connect";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const { token, preview, accept } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, error: "Token is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (preview) {
      return res.json({
        success: true,
        user: {
          firstname: decoded.firstname,
          lastname: decoded.lastname,
          email: decoded.email,
          role: decoded.role,
        },
      });
    }

    if (accept) {
      const [existingUsers] = await pool.query(
        "SELECT id FROM users WHERE email = ?",
        [decoded.email]
      );

      if (existingUsers.length > 0) {
        return res
          .status(400)
          .json({ success: false, error: "User already exists" });
      }

      const tempPassword = "Temp@12345";
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const [result] = await pool.query(
        `INSERT INTO users (firstname, lastname, email, role_id, password, is_verified, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          decoded.firstname,
          decoded.lastname,
          decoded.email,
          decoded.role,
          hashedPassword,
          true,
        ]
      );

      const newUserId = result.insertId;

      const [rows] = await pool.query(
        `SELECT u.id, u.firstname, u.lastname, u.email, u.profile_pic,
              u.role_id, u.is_verified, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
        [newUserId]
      );

      if (rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: "User not found after creation" });
      }

      const user = rows[0];

      const [permissionsRows] = await pool.query(
        `SELECT p.name
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = ?`,
        [user.role_id]
      );

      const permissions = permissionsRows.map((p) => p.name);
      const authToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role_name, permissions },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        success: true,
        message:
          "Account created successfully! You can now participate in discussions.",
        user: {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          avatar: user.profile_pic,
          role: user.role_name,
          permissions,
        },
        token: authToken,
        tempPassword,
      });
    }

    return res.status(400).json({
      success: false,
      error: "Invalid action. Must specify either 'preview' or 'accept'",
    });
  } catch (err) {
    console.error("verify-invite error:", err);

    if (err.name === "JsonWebTokenError") {
      return res.status(400).json({ success: false, error: "Invalid token" });
    } else if (err.name === "TokenExpiredError") {
      return res
        .status(400)
        .json({ success: false, error: "Token has expired" });
    }

    return res
      .status(500)
      .json({ success: false, error: "Server error during verification" });
  }
}
