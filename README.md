# Next.js CommentBox (MySQL)

> A simple, extendable comment box built with **Next.js 15**, **React 19**, and **MySQL** (mysql2). Includes JWT auth, Nodemailer for email, Cloudinary-ready uploads, and role-based access control (RBAC). This README walks you through setup step-by-step — from local dev to deployment.

---

## Table of contents

1. Project overview
2. Tech stack
3. Prerequisites
4. Quick start
5. Environment variables (`.env.example`)
6. Database: create + schema SQL
7. Dev setup: install, run, scripts
8. Database connection helper (example)
9. API routes (examples)
10. Auth flow (register / login / token)
11. File upload (Cloudinary) & Nodemailer (email)
12. Security
13. Contributing
14. License

---

## 1) Project overview

This repo contains a comment system: users can register/login, post comments (and replies), edit/delete their own comments, and the server stores data in MySQL. It also supports **roles and permissions** for RBAC, password reset, email verification, and profile fields.

## 2) Tech stack

- Next.js 15 (app router compatible)
- React 19
- mysql2 (promise API)
- bcryptjs (password hashing)
- jsonwebtoken (JWT)
- nodemailer (email notifications)
- cloudinary (optional file/image hosting)
- formidable / multer (file parsing on server)

## 3) Prerequisites

- Node.js >= 18
- npm or yarn
- MySQL server (local or remote)
- (Optional) Cloudinary account
- (Optional) SMTP credentials

## 4) Quick start

```bash
# 1. clone
git clone <repo-url>
cd <repo-folder>

# 2. install
npm install

# 3. copy .env example and edit
cp .env.example .env.local

# 4. create DB and run SQL in /db/schema.sql (example below)

# 5. start dev server
npm run dev

# open http://localhost:3000
```

## 5) Environment variables (`.env.example`)

```
# MySQL
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=changeme
MYSQL_DB=commentDB

# Email (Nodemailer)
EMAIL_USER=your@email.com
EMAIL_PASS=your-email-password-or-app-password

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT
JWT_SECRET=replace_this_with_a_long_random_secret

# Next.js
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 6) Database: create + schema SQL

Save this as `db/schema.sql` and run it against your `commentDB`.

```sql
CREATE DATABASE IF NOT EXISTS commentDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE commentDB;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  profile_pic VARCHAR(255) DEFAULT NULL,
  firstname VARCHAR(100) DEFAULT NULL,
  lastname VARCHAR(100) DEFAULT NULL,
  reset_token VARCHAR(255) DEFAULT NULL,
  reset_token_expiry DATETIME DEFAULT NULL,
  role_id INT UNSIGNED NOT NULL,
  is_verified TINYINT(1) DEFAULT 0,
  PRIMARY KEY (id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  text TEXT NOT NULL,
  parentId INT UNSIGNED DEFAULT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  userId INT UNSIGNED,
  PRIMARY KEY (id),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (parentId) REFERENCES comments(id) ON DELETE CASCADE
);

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id)
);

-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id)
);

-- Role Permissions (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
```

---

## 7) Dev setup: install, run, scripts

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

Run locally:

```bash
npm run dev
```

---

## 8) Database connection helper (example)

```js
// lib/db.js
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
```

---

## 9) API routes (examples)

- `/api/auth/register` — create user (bcrypt hash password)
- `/api/auth/login` — validate user, issue JWT
- `/api/comments` — CRUD for comments
- Middleware checks `Authorization: Bearer <token>` + verifies role/permissions

---

## 10) Auth flow

- Register → hash password, create user, set `is_verified = 0`
- Email verification → send token via Nodemailer, update `is_verified = 1`
- Login → compare password, issue JWT
- Reset password → generate `reset_token`, set expiry, send email link

---

## 11) File upload & Email

- **File upload** → use Cloudinary SDK (`cloudinary.v2.uploader.upload`)
- **Email** → configure `nodemailer.createTransport` with `EMAIL_USER` + `EMAIL_PASS`

---

## 12) Security

- Never commit `.env`
- Strong `JWT_SECRET`
- Hash passwords (`bcrypt`)
- Sanitize input to prevent XSS/SQL injection

---

## 13) Contributing

1. Fork
2. Create branch
3. Commit & push
4. Open PR

---

## 14) License

MIT
