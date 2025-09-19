import { pool } from "@/lib/connect";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
  } catch (error) {
    return null;
  }
};

const validatePassword = (password) => {
  if (password.length < 8) return "Password must be at least 8 characters long";
  if (!/(?=.*[a-z])/.test(password))
    return "Password must contain at least one lowercase letter";
  if (!/(?=.*[A-Z])/.test(password))
    return "Password must contain at least one uppercase letter";
  if (!/(?=.*\d)/.test(password))
    return "Password must contain at least one number";
  if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password))
    return "Password must contain at least one special character";
  return null;
};

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    // 🔒 Verify token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded?.id && !decoded?.userId) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const userId = decoded.userId || decoded.id;

    // 📝 Validate request body
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Both current and new passwords are required",
        });
    }

    if (currentPassword === newPassword) {
      return res
        .status(400)
        .json({
          success: false,
          message: "New password must be different from current password",
        });
    }

    const passwordError = validatePassword(newPassword.trim());
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    // 🔎 Find user
    const [rows] = await pool.query(
      "SELECT id, password FROM users WHERE id = ? AND deleted_at IS NULL",
      [userId]
    );
    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const user = rows[0];

    // 🔑 Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }

    // 🔐 Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await pool.query(
      "UPDATE users SET password = ?, updated_at = NOW(), password_changed_at = NOW() WHERE id = ?",
      [hashedPassword, userId]
    );

    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error, try again later" });
  }
}
