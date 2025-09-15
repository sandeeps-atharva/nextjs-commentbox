import { pool } from "@/lib/connect";
import hasPermission from "@/utils/hasPermission";

export default async function handler(req, res) {
  const id = req.query.id;
  const user = req.headers["x-user"] ? JSON.parse(req.headers["x-user"]) : null;

  const CanManageRole = hasPermission(user, "manage_roles");

  if (req.method === "DELETE") {
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    return res.status(200).json({ message: "User deleted successfully" });
  }

  if (req.method === "PUT") {
    if (CanManageRole) {
      const { firstname, lastname, email, role_id } = req.body;

      if (!id || !firstname || !lastname || !email || !role_id) {
        return res.status(400).json({ message: "All fields are required" });
      }

      await pool.query(
        "UPDATE users SET firstname = ?, lastname = ?, email = ?, role_id = ? WHERE id = ?",
        [firstname, lastname, email, role_id, id]
      );
    } else {
      const { firstname, lastname, email } = req.body;

      if (!id || !firstname || !lastname || !email) {
        return res.status(400).json({ message: "All fields are required" });
      }

      await pool.query(
        "UPDATE users SET firstname = ?, lastname = ?, email = ? WHERE id = ?",
        [firstname, lastname, email, id]
      );
    }

    return res.status(200).json({ message: "User updated successfully" });
  }

  return res.status(405).json({ message: "Method not allowed" });
}
