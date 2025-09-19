// // // import { pool } from "@/lib/connect";
// // // import jwt from "jsonwebtoken";

// // // export default async function handler(req, res) {
// // //   if (req.method === "GET") {
// // //     try {
// // //       const [rows] = await pool.query(
// // //         `SELECT
// // //         c.id,
// // //         c.text,
// // //         c.parentId,
// // //         c.createdAt,
// // //         c.updatedAt,
// // //         c.userId,
// // //         u.profile_pic as avatar,
// // //         u.firstname,
// // //         u.lastname
// // //       FROM comments c
// // //       JOIN users u ON c.userId = u.id
// // //       ORDER BY c.createdAt ASC`
// // //       );

// // //       res.json(rows);
// // //     } catch (err) {
// // //       console.error(err);
// // //       res.status(500).json({ message: "Error fetching comments" });
// // //     }
// // //   }

// // //   if (req.method === "POST") {
// // //     const token = req.headers.authorization?.split(" ")[1];
// // //     const userHeader = req.headers["x-user"];
// // //     if (!token) return res.status(401).json({ message: "Unauthorized" });

// // //     let decoded;
// // //     try {
// // //       decoded = jwt.verify(token, process.env.JWT_SECRET);
// // //     } catch (err) {
// // //       return res.status(401).json({ message: "Invalid token" });
// // //     }

// // //     try {
// // //       const { text, parentId = null, userId } = req.body;

// // //       const [result] = await pool.query(
// // //         "INSERT INTO comments (text, parentId, userId) VALUES (?, ?, ?)",
// // //         [text, parentId, userId]
// // //       );

// // //       res.json({
// // //         id: result.insertId,
// // //         text,
// // //         parentId,
// // //         userId,
// // //         message: "Comment created successfully",
// // //       });
// // //     } catch (err) {
// // //       console.error(err);
// // //       res.status(500).json({ message: "Error creating comment" });
// // //     }
// // //   }

// // //   // Handle unsupported methods
// // //   if (!["GET", "POST"].includes(req.method)) {
// // //     res.status(405).json({ message: "Method not allowed" });
// // //   }
// // // }

// // import { pool } from "@/lib/connect";
// // import jwt from "jsonwebtoken";

// // export default async function handler(req, res) {
// //   if (req.method === "GET") {
// //     try {
// //       const { take = 5, skip = 0 } = req.query;
// //       console.log("take", take, "skip", skip);

// //       // Progressive pagination query - gets 5 parent comments + all their replies
// //       const [rows] = await pool.query(
// //         `SELECT
// //           c.id,
// //           c.text,
// //           c.parentId,
// //           c.createdAt,
// //           c.updatedAt,
// //           c.userId,
// //           u.profile_pic as avatar,
// //           u.firstname,
// //           u.lastname
// //         FROM comments c
// //         JOIN users u ON c.userId = u.id
// //         WHERE
// //           -- Get 5 parent comments
// //           (c.parentId IS NULL AND c.id IN (
// //             SELECT id
// //             FROM comments
// //             WHERE parentId IS NULL
// //             ORDER BY createdAt DESC
// //             LIMIT ? OFFSET ?
// //           ))
// //           OR
// //           -- Get all replies for those 5 parent comments
// //           (c.parentId IN (
// //             SELECT id
// //             FROM comments
// //             WHERE parentId IS NULL
// //             ORDER BY createdAt DESC
// //             LIMIT ? OFFSET ?
// //           ))
// //         ORDER BY
// //           CASE WHEN c.parentId IS NULL THEN c.id ELSE c.parentId END,
// //           c.parentId IS NULL DESC,
// //           c.createdAt ASC`,
// //         [parseInt(take), parseInt(skip), parseInt(take), parseInt(skip)]
// //       );

// //       // Count total parent comments (not all comments)
// //       const [[{ count }]] = await pool.query(
// //         "SELECT COUNT(*) as count FROM comments WHERE parentId IS NULL"
// //       );

// //       // Calculate if there are more parent comments to load
// //       const loadedParentComments = parseInt(skip) + parseInt(take);
// //       const hasMore = loadedParentComments < count;

// //       res.json({
// //         comments: rows,
// //         total: count, // Total parent comments
// //         totalLoaded: Math.min(loadedParentComments, count), // How many parent comments loaded so far
// //         limit: parseInt(take),
// //         hasMore: hasMore,
// //       });
// //     } catch (err) {
// //       console.error(err);
// //       res.status(500).json({ message: "Error fetching comments" });
// //     }
// //   }

// //   if (req.method === "POST") {
// //     const token = req.headers.authorization?.split(" ")[1];
// //     if (!token) return res.status(401).json({ message: "Unauthorized" });

// //     let decoded;
// //     try {
// //       decoded = jwt.verify(token, process.env.JWT_SECRET);
// //     } catch (err) {
// //       return res.status(401).json({ message: "Invalid token" });
// //     }

// //     try {
// //       const { text, parentId = null, userId } = req.body;

// //       const [result] = await pool.query(
// //         "INSERT INTO comments (text, parentId, userId) VALUES (?, ?, ?)",
// //         [text, parentId, userId]
// //       );

// //       res.json({
// //         id: result.insertId,
// //         text,
// //         parentId,
// //         userId,
// //         message: "Comment created successfully",
// //       });
// //     } catch (err) {
// //       console.error(err);
// //       res.status(500).json({ message: "Error creating comment" });
// //     }
// //   }

// //   if (!["GET", "POST"].includes(req.method)) {
// //     res.status(405).json({ message: "Method not allowed" });
// //   }
// // }

// import { pool } from "@/lib/connect";
// import jwt from "jsonwebtoken";

// export default async function handler(req, res) {
//   if (req.method === "GET") {
//     try {
//       const { take = 5, skip = 0 } = req.query;
//       console.log("take", take, "skip", skip);

//       // Step 1: Get the parent comment IDs first
//       const [parentIds] = await pool.query(
//         `SELECT id
//          FROM comments
//          WHERE parentId IS NULL
//          ORDER BY createdAt DESC
//          LIMIT ? OFFSET ?`,
//         [parseInt(take), parseInt(skip)]
//       );

//       // If no parent comments found, return empty
//       if (parentIds.length === 0) {
//         return res.json({
//           comments: [],
//           total: 0,
//           totalLoaded: parseInt(skip),
//           limit: parseInt(take),
//           hasMore: false,
//         });
//       }

//       const parentIdsList = parentIds.map((row) => row.id);

//       // Step 2: Get ALL descendants (replies, replies to replies, etc.) recursively
//       const getAllDescendants = async (parentIds) => {
//         if (parentIds.length === 0) return [];

//         const placeholders = parentIds.map(() => "?").join(",");

//         const [directReplies] = await pool.query(
//           `SELECT
//             c.id,
//             c.text,
//             c.parentId,
//             c.createdAt,
//             c.updatedAt,
//             c.userId,
//             u.profile_pic as avatar,
//             u.firstname,
//             u.lastname
//           FROM comments c
//           JOIN users u ON c.userId = u.id
//           WHERE c.parentId IN (${placeholders})
//           ORDER BY c.createdAt ASC`,
//           parentIds
//         );

//         if (directReplies.length === 0) {
//           return [];
//         }

//         // Get IDs of direct replies to find their replies recursively
//         const replyIds = directReplies.map((reply) => reply.id);

//         // Recursively get replies to these replies
//         const nestedReplies = await getAllDescendants(replyIds);

//         return [...directReplies, ...nestedReplies];
//       };

//       // Step 3: Get parent comments
//       const parentPlaceholders = parentIdsList.map(() => "?").join(",");
//       const [parentComments] = await pool.query(
//         `SELECT
//           c.id,
//           c.text,
//           c.parentId,
//           c.createdAt,
//           c.updatedAt,
//           c.userId,
//           u.profile_pic as avatar,
//           u.firstname,
//           u.lastname
//         FROM comments c
//         JOIN users u ON c.userId = u.id
//         WHERE c.id IN (${parentPlaceholders})
//         ORDER BY c.createdAt DESC`,
//         parentIdsList
//       );
//       console.log("parentComments", parentComments);

//       // Step 4: Get all nested replies
//       const allReplies = await getAllDescendants(parentIdsList);
//       console.log("allReplies", allReplies);

//       // Step 5: Combine and sort results
//       const allComments = [...parentComments, ...allReplies];
//       console.log("allComments", allComments);

//       // Count total parent comments
//       const [[{ count }]] = await pool.query(
//         "SELECT COUNT(*) as count FROM comments WHERE parentId IS NULL"
//       );

//       console.log("count", count);

//       // Calculate if there are more parent comments to load
//       const loadedParentComments = parseInt(skip) + parentIds.length;
//       console.log("loadedParentComments", loadedParentComments);

//       const hasMore = loadedParentComments < count;

//       res.json({
//         comments: allComments,
//         total: count,
//         totalLoaded: loadedParentComments,
//         limit: parseInt(take),
//         hasMore: hasMore,
//       });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: "Error fetching comments" });
//     }
//   }

//   if (req.method === "POST") {
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) return res.status(401).json({ message: "Unauthorized" });

//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (err) {
//       return res.status(401).json({ message: "Invalid token" });
//     }

//     try {
//       const { text, parentId = null, userId } = req.body;

//       const [result] = await pool.query(
//         "INSERT INTO comments (text, parentId, userId) VALUES (?, ?, ?)",
//         [text, parentId, userId]
//       );

//       res.json({
//         id: result.insertId,
//         text,
//         parentId,
//         userId,
//         message: "Comment created successfully",
//       });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: "Error creating comment" });
//     }
//   }

//   if (!["GET", "POST"].includes(req.method)) {
//     res.status(405).json({ message: "Method not allowed" });
//   }
// }

import { pool } from "@/lib/connect";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { take = 5, skip = 0 } = req.query;
      console.log("Fetching comments - take:", take, "skip:", skip);

      // Step 1: Get parent comment IDs with proper ordering
      const [parentIds] = await pool.query(
        `SELECT id 
         FROM comments 
         WHERE parentId IS NULL 
         ORDER BY createdAt DESC
         LIMIT ? OFFSET ?`,
        [parseInt(take), parseInt(skip)]
      );

      // If no parent comments found, return empty
      if (parentIds.length === 0) {
        const [[{ count }]] = await pool.query(
          "SELECT COUNT(*) as count FROM comments WHERE parentId IS NULL"
        );

        return res.json({
          comments: [],
          total: count,
          totalLoaded: parseInt(skip),
          limit: parseInt(take),
          hasMore: false,
        });
      }

      const parentIdsList = parentIds.map((row) => row.id);

      // Step 2: Recursive function to get all descendants
      const getAllDescendants = async (parentIds) => {
        if (parentIds.length === 0) return [];

        const placeholders = parentIds.map(() => "?").join(",");

        const [directReplies] = await pool.query(
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
          WHERE c.parentId IN (${placeholders})
          ORDER BY c.createdAt ASC`,
          parentIds
        );

        if (directReplies.length === 0) {
          return [];
        }

        // Get IDs of direct replies to find their replies recursively
        const replyIds = directReplies.map((reply) => reply.id);

        // Recursively get replies to these replies
        const nestedReplies = await getAllDescendants(replyIds);

        return [...directReplies, ...nestedReplies];
      };

      // Step 3: Get parent comments with proper details
      const parentPlaceholders = parentIdsList.map(() => "?").join(",");
      const [parentComments] = await pool.query(
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
        WHERE c.id IN (${parentPlaceholders})
        ORDER BY c.createdAt DESC`,
        parentIdsList
      );

      // Step 4: Get all nested replies
      const allReplies = await getAllDescendants(parentIdsList);

      // Step 5: Combine all comments
      const allComments = [...parentComments, ...allReplies];

      // Count total parent comments
      const [[{ count }]] = await pool.query(
        "SELECT COUNT(*) as count FROM comments WHERE parentId IS NULL"
      );

      // Calculate pagination info
      const loadedParentComments = parseInt(skip) + parentIds.length;
      const hasMore = loadedParentComments < count;

      console.log("Returning:", {
        totalComments: allComments.length,
        parentComments: parentComments.length,
        replies: allReplies.length,
        totalParents: count,
        loadedParents: loadedParentComments,
        hasMore,
      });

      res.json({
        comments: allComments,
        total: count,
        totalLoaded: loadedParentComments,
        limit: parseInt(take),
        hasMore: hasMore,
      });
    } catch (err) {
      console.error("Error in GET /api/comment:", err);
      res.status(500).json({ message: "Error fetching comments" });
    }
  } else if (req.method === "POST") {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    try {
      const { text, parentId = null, userId } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({ message: "Comment text is required" });
      }

      const [result] = await pool.query(
        "INSERT INTO comments (text, parentId, userId) VALUES (?, ?, ?)",
        [text.trim(), parentId, userId]
      );

      // Return the created comment with user details
      const [newComment] = await pool.query(
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
        WHERE c.id = ?`,
        [result.insertId]
      );

      res.status(201).json({
        comment: newComment[0],
        message: "Comment created successfully",
      });
    } catch (err) {
      console.error("Error in POST /api/comment:", err);
      res.status(500).json({ message: "Error creating comment" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
