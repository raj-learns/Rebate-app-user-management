const express = require("express");
const cors = require("cors");
const session = require("express-session");
const pool = require("./db");

const app = express();

// -------------------------
// ✅ CORS (MUST be FIRST)
// -------------------------
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// -------------------------
// Body parsers
// -------------------------
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// -------------------------
// Session (needed only if you want cookies)
// -------------------------
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax"
    }
  })
);

// Temporary in-memory users store
let users = [];

// ---------------------------------------------------------
// ✅ GOOGLE LOGIN ROUTE — clean, safe, Express 5 compatible
// ---------------------------------------------------------
app.post("/google-login", async (req, res) => {
  try {
    console.log("Incoming /google-login body:", req.body);

    const body = req.body.user || req.body;

    const googleId = (body.googleId || body.uid || "").toString().trim();
    const email = (body.email || "").trim().toLowerCase();
    const name = (body.name || body.displayName || "").trim();

    // generate entry number from email prefix
    const entry_no = email ? email.split("@")[0] : null;

    if (!googleId || !name || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // -----------------------------
    // CHECK USER EXISTS
    // -----------------------------
    const findUserQuery = `
      SELECT * FROM users 
      WHERE google_id = $1 OR email = $2
      LIMIT 1
    `;

    const existing = await pool.query(findUserQuery, [googleId, email]);

    if (existing.rows.length > 0) {
      console.log("Existing user:", existing.rows[0]);
      return res.status(200).json({
        message: "User already exists",
        exists: true,
        user: existing.rows[0]
      });
    }

    // -----------------------------
    // INSERT NEW USER
    // -----------------------------
    const insertQuery = `
      INSERT INTO users (google_id, name, email, entry_no)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const insert = await pool.query(insertQuery, [
      googleId,
      name,
      email,
      entry_no
    ]);

    console.log("New user created:", insert.rows[0]);

    return res.status(201).json({
      message: "New user created",
      exists: false,
      user: insert.rows[0]
    });

  } catch (error) {
    console.error("Google Login Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// ---------------------------------------------------------
// Simple Test Route
// ---------------------------------------------------------
app.get("/test", (req, res) => {
  res.json({ message: "CORS OK" });
});

app.get("/all-users", (req, res) => {
  res.json({ users });
});

// Start server
app.listen(3000, "0.0.0.0", () =>
  console.log("🚀 Server running on port 3000")
);
