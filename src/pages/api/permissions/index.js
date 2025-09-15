import { pool } from "@/lib/connect";

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    if (req.method === "GET") {
      const [permissions] = await pool.execute(
        "SELECT * FROM permissions ORDER BY name"
      );
      return res.status(200).json(permissions);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Error in /api/permissions:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
