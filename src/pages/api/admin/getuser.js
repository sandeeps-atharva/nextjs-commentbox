import { pool } from "@/lib/connect";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { page = 1, limit = 10, search = "", roleFilter = "" } = req.query;
      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        whereConditions.push(`(
          u.id LIKE ? OR 
          CONCAT(u.firstname, ' ', u.lastname) LIKE ? OR 
          u.firstname LIKE ? OR 
          u.lastname LIKE ? OR 
          u.email LIKE ?
        )`);
        queryParams.push(
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm
        );
      }
      if (roleFilter && roleFilter.trim()) {
        whereConditions.push(`r.id = ?`);
        queryParams.push(roleFilter);
      }
      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      const countQuery = `
        SELECT COUNT(DISTINCT u.id) AS total 
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        ${whereClause}
      `;
      const [countResult] = await pool.query(countQuery, queryParams);
      const total = countResult[0].total;
      const usersQuery = `
        SELECT
          u.id AS id,
          u.firstname,
          u.lastname,
          u.email,
          u.profile_pic AS profile_pic,
          r.id AS role_id,
          r.name AS role_name,
          GROUP_CONCAT(p.name) AS permissions
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        ${whereClause}
        GROUP BY u.id, u.firstname, u.lastname, u.email, r.id, r.name
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const [rows] = await pool.query(usersQuery, [
        ...queryParams,
        Number(limit),
        Number(offset),
      ]);

      const users = rows.map((row) => ({
        ...row,
        permissions: row.permissions ? row.permissions.split(",") : [],
      }));

      res.json({
        users,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ message: "Error fetching users with permissions" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
