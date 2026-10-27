
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== PATHS ====================

const frontendPath = path.join(__dirname, "..", "frontend");
const databasePath = path.join(
  __dirname,
  "..",
  "database",
  "enquiries.db"
);

// Create the database folder if it does not exist.
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

// ==================== DATABASE ====================

const db = new Database(databasePath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    program TEXT,
    message TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// ==================== MIDDLEWARE ====================

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));

// Check that admin credentials are configured.
if (
  !process.env.ADMIN_USERNAME ||
  !process.env.ADMIN_PASSWORD ||
  !process.env.SESSION_SECRET
) {
  throw new Error(
    "Missing ADMIN_USERNAME, ADMIN_PASSWORD or SESSION_SECRET in backend/.env"
  );
}

// Admin session configuration.
app.use(
  session({
    name: "skillpulse.admin",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 60 * 1000
    }
  })
);

// Serve website files.
app.use(express.static(frontendPath));

// ==================== HEALTH CHECK ====================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Skill Pulse server is running."
  });
});

// ==================== CONTACT ENQUIRY ====================

app.post("/api/enquiries", (req, res) => {
  try {
    const { name, email, phone, program, message } = req.body || {};

    // Validate required fields.
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof program !== "string" ||
      typeof message !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !program.trim() ||
      !message.trim()
    ) {
      return res.status(400).json({
        message: "Please complete all required fields."
      });
    }

    if (
      name.length > 150 ||
      email.length > 254 ||
      (typeof phone === "string" && phone.length > 30) ||
      program.length > 150 ||
      message.length > 5000
    ) {
      return res.status(400).json({
        message: "One or more fields are too long."
      });
    }

    const insertEnquiry = db.prepare(`
      INSERT INTO enquiries
        (name, email, phone, program, message)
      VALUES
        (?, ?, ?, ?, ?)
    `);

    const result = insertEnquiry.run(
      name.trim(),
      email.trim(),
      typeof phone === "string" ? phone.trim() : "",
      program.trim(),
      message.trim()
    );

    return res.status(201).json({
      message: "Your enquiry has been submitted successfully.",
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error("Enquiry submission error:", error);

    return res.status(500).json({
      message: "Unable to submit your enquiry. Please try again."
    });
  }
});

// ==================== ADMIN LOGIN ====================

// Login using the credentials stored in backend/.env.
app.post("/api/admin/login", (req, res, next) => {
  const { username, password } = req.body || {};

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      message: "Invalid username or password."
    });
  }

  // Regenerate the session after successful authentication.
  req.session.regenerate((error) => {
    if (error) {
      return next(error);
    }

    req.session.isAdmin = true;

    req.session.save((saveError) => {
      if (saveError) {
        return next(saveError);
      }

      return res.json({
        message: "Login successful."
      });
    });
  });
});

// ==================== CHECK ADMIN SESSION ====================

app.get("/api/admin/session", (req, res) => {
  res.json({
    authenticated: req.session.isAdmin === true
  });
});

// ==================== GET ALL ENQUIRIES ====================

app.get("/api/admin/enquiries", (req, res) => {
  // Only authenticated admins can view enquiries.
  if (req.session.isAdmin !== true) {
    return res.status(401).json({
      message: "Please log in as admin."
    });
  }

  try {
    const enquiries = db
      .prepare(`
        SELECT
          id,
          name,
          email,
          phone,
          program,
          message,
          created_at
        FROM enquiries
        ORDER BY id DESC
      `)
      .all();

    return res.json({
      total: enquiries.length,
      enquiries
    });
  } catch (error) {
    console.error("Unable to fetch enquiries:", error);

    return res.status(500).json({
      message: "Unable to load enquiries."
    });
  }
});

// ==================== ADMIN LOGOUT ====================

app.post("/api/admin/logout", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie("skillpulse.admin", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production"
    });

    return res.json({
      message: "Logged out successfully."
    });
  });
});

// ==================== ERROR HANDLER ====================

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    message: "An unexpected server error occurred."
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`Skill Pulse is running at http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin.html`);
});

// Close database connection when the process exits.
function shutdown() {
  try {
    db.close();
  } catch (error) {
    console.error("Database close error:", error);
  }

  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
