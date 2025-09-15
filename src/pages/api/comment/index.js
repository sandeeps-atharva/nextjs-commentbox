import { pool } from "@/lib/connect";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const [rows] = await pool.query(
        `SELECT 
        c.id,
        c.text,
        c.parentId,
        c.createdAt,
        c.updatedAt,
        c.userId,
        u.profile_pic as avatar,
        u.firstname,
        u.lastname
      FROM comments c
      JOIN users u ON c.userId = u.id
      ORDER BY c.createdAt ASC`
      );

      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching comments" });
    }
  }

  if (req.method === "POST") {
    const token = req.headers.authorization?.split(" ")[1];
    const userHeader = req.headers["x-user"];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    try {
      const { text, parentId = null, userId } = req.body;

      const [result] = await pool.query(
        "INSERT INTO comments (text, parentId, userId) VALUES (?, ?, ?)",
        [text, parentId, userId]
      );

      res.json({
        id: result.insertId,
        text,
        parentId,
        userId,
        message: "Comment created successfully",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error creating comment" });
    }
  }

  // Handle unsupported methods
  if (!["GET", "POST"].includes(req.method)) {
    res.status(405).json({ message: "Method not allowed" });
  }
}
