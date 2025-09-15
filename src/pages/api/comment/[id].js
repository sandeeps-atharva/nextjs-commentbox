import { pool } from "@/lib/connect";
import canEditComment from "@/utils/canEditComment";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  const commentId = req.query.id;

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  const userHeader = req.headers["x-user"]
    ? JSON.parse(req.headers["x-user"])
    : null;

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT userId FROM comments WHERE id = ?",
      [commentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const comment = rows[0];

    if (req.method === "DELETE") {
      await pool.query("DELETE FROM comments WHERE id = ?", [commentId]);
      return res.status(200).json({ message: "Comment deleted successfully" });
    }

    if (req.method === "PUT") {
      const { text } = req.body;

      if (!text || text.trim() === "") {
        return res.status(400).json({ message: "Comment text is required" });
      }

      await pool.query(
        "UPDATE comments SET text = ?, updatedAt = NOW() WHERE id = ?",
        [text.trim(), commentId]
      );

      return res.status(200).json({ message: "Comment updated successfully" });
    }

    res.status(405).json({ message: "Method not allowed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}
