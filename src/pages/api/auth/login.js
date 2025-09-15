import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "@/lib/connect";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { email, password } = req.body;

    const [users] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const [roleData] = await pool.execute(
      `
      SELECT r.name AS role, p.name AS permission
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE r.id = ?
    `,
      [user.role_id]
    );

    const role = roleData.length > 0 ? roleData[0].role : null;
    const permissions = roleData
      .filter((row) => row.permission !== null)
      .map((row) => row.permission);

    const token = jwt.sign(
      {
        userId: user.id,
        firstname: user.firstname,
        role,
        permissions,
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        avatar: user.profile_pic,
        role,
        permissions,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
