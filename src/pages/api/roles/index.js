import { pool } from "@/lib/connect";

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    if (req.method === "GET") {
      const [roles] = await pool.execute(`
        SELECT 
          r.id, 
          r.name, 
          r.description,
          GROUP_CONCAT(p.name) as permissions
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        GROUP BY r.id, r.name, r.description
        ORDER BY r.name
      `);

      const formattedRoles = roles.map((role) => ({
        ...role,
        permissions: role.permissions ? role.permissions.split(",") : [],
      }));

      return res.status(200).json(formattedRoles);
    }

    if (req.method === "POST") {
      const { name, description, permissions = [] } = req.body;

      if (!name)
        return res.status(400).json({ error: "Role name is required" });

      const [existingRole] = await pool.execute(
        "SELECT id FROM roles WHERE name = ?",
        [name]
      );
      if (existingRole.length > 0) {
        return res.status(409).json({ error: "Role already exists" });
      }

      const [result] = await pool.execute(
        "INSERT INTO roles (name, description) VALUES (?, ?)",
        [name, description]
      );

      const roleId = result.insertId;

      if (permissions.length > 0) {
        const [permissionIds] = await pool.execute(
          `SELECT id FROM permissions WHERE name IN (${permissions
            .map(() => "?")
            .join(",")})`,
          permissions
        );

        const rolePermissions = permissionIds.map((p) => [roleId, p.id]);
        await pool.query(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES ?",
          [rolePermissions]
        );
      }

      return res
        .status(201)
        .json({ id: roleId, name, description, permissions });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Error in /api/roles:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
