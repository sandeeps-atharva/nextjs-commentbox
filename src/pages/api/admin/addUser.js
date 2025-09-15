import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { pool } from "@/lib/connect";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { firstname, lastname, email, role_id, isSendEmail } = req.body;

      if (!firstname || !lastname || !email) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const [existingUsers] = await pool.query(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );

      if (existingUsers.length > 0) {
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      }

      // default role if not given
      const role = role_id ?? 9;
      const tempPassword = "Temp@12345";
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      if (isSendEmail) {
        const token = jwt.sign(
          { firstname, lastname, email, role },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );

        const inviteLink = `${
          process.env.NEXT_PUBLIC_BASE_URL || "http://192.168.30.243:3000"
        }/InvitePage?token=${token}`;

        const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "You’re Invited to CommentBox 🎉",
          html: `<p>Hey ${firstname},</p>
                 <p>You’ve been invited to join CommentBox. Click below (valid for 24 hours):</p>
                 <a href="${inviteLink}">${inviteLink}</a>`,
        });

        return res.json({
          message: "Invite sent successfully",
        });
      } else {
        await pool.query(
          "INSERT INTO users (firstname, lastname, email, role_id , password) VALUES (?, ?, ?, ? ,?)",
          [firstname, lastname, email, role, hashedPassword]
        );

        return res.json({
          message: "User added successfully without invite email",
        });
      }
    } catch (err) {
      console.error("Send invite error:", err);
      res.status(500).json({ message: "Error processing request" });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
