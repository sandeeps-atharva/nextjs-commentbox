import { pool } from "@/lib/connect";

export default async function handler(req, res) {
  const { id } = req.query;
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    if (req.method === "PUT") {
      const { name, description, permissions = [] } = req.body;

      const [existingRole] = await pool.execute(
        "SELECT id FROM roles WHERE id = ?",
        [id]
      );
      if (existingRole.length === 0)
        return res.status(404).json({ error: "Role not found" });

      await pool.execute(
        "UPDATE roles SET name = ?, description = ? WHERE id = ?",
        [name, description, id]
      );

      await pool.execute("DELETE FROM role_permissions WHERE role_id = ?", [
        id,
      ]);

      if (permissions.length > 0) {
        const [permissionIds] = await pool.execute(
          `SELECT id FROM permissions WHERE name IN (${permissions
            .map(() => "?")
            .join(",")})`,
          permissions
        );

        const rolePermissions = permissionIds.map((p) => [id, p.id]);
        await pool.query(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES ?",
          [rolePermissions]
        );
      }

      return res.status(200).json({ id, name, description, permissions });
    }

    if (req.method === "DELETE") {
      // 1. Check if role exists
      const [existingRole] = await pool.execute(
        "SELECT name FROM roles WHERE id = ?",
        [id]
      );

      if (existingRole.length === 0) {
        return res.status(404).json({ error: "Role not found" });
      }

      // 2. Prevent deleting Super Admin
      if (existingRole[0].name === "Super Admin") {
        return res
          .status(403)
          .json({ error: "Cannot delete Super Admin role" });
      }

      // 3. Get fallback role (e.g., "User")
      const [fallbackRole] = await pool.execute(
        "SELECT id FROM roles WHERE name = 'User'"
      );

      if (fallbackRole.length === 0) {
        return res
          .status(500)
          .json({ error: "Fallback role 'User' not found" });
      }

      const fallbackRoleId = fallbackRole[0].id;

      // 4. Reassign users who had this role
      await pool.execute("UPDATE users SET role_id = ? WHERE role_id = ?", [
        fallbackRoleId,
        id,
      ]);

      // 5. Delete the role
      await pool.execute("DELETE FROM roles WHERE id = ?", [id]);

      return res.status(200).json({
        message: `Role deleted successfully. Users reassigned to '${fallbackRole[0].id}'.`,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Error in /api/roles/[id]:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
