const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require("express-session");

dotenv.config();

const app = express();
const allowedOrigins = [
  "http://localhost:5173"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));

// 🚀 Local array to store users temporarily
let users = [];

// google-login-via-firebase
// google-login-via-firebase
app.post("/google-login", (req, res) => {
  try {
    // DEBUG: log the incoming body to inspect what's being sent
    console.log("Incoming /google-login body:", req.body);

    let { googleId, name, email } = req.body || {};

    // Normalize/trim values
    if (googleId && typeof googleId !== "string") googleId = String(googleId);
    if (googleId) googleId = googleId.trim();
    if (email && typeof email === "string") email = email.trim().toLowerCase();
    if (name && typeof name === "string") name = name.trim();

    if (!googleId || !name || !email) {
      console.log("Missing fields:", { googleId, name, email });
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 🔍 Find user by googleId first, then by email as fallback
    let user = users.find((u) => {
      if (!u) return false;
      // normalize stored user fields for safe comparison
      const storedGoogleId = (u.googleId || "").toString().trim();
      const storedEmail = (u.email || "").toString().trim().toLowerCase();
      return storedGoogleId === googleId || storedEmail === email;
    });

    console.log("Found user:", user);

    if (!user) {
      // generate unique username
      const base = name.toLowerCase().replace(/\s+/g, "");
      let username = base;
      let suffix = 0;

      while (users.find((u) => (u.username || "") === username)) {
        suffix++;
        username = `${base}${suffix}`;
      }

      // Create user object
      user = {
        googleId,
        name,
        email,
        username,
      };

      // Store in local memory array
      users.push(user);
      console.log("New user created:", user);
      console.log("All users:", users);
    } else {
      console.log("Returning existing user.");
    }

    return res.status(200).json({
      message: "User authenticated",
      user,
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
console.log(users)
app.listen(3000, "0.0.0.0", () => console.log("🚀 Server running on port 3000"));
