const express = require("express");
const cors = require("cors");
const session = require("express-session");
const pool = require("./db");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

const app = express();

/* -------------------------------------------
   CLOUDINARY CONFIG
--------------------------------------------*/
cloudinary.config({
  cloud_name: "dppmsegnz",
  api_key:    "431821864442837",
  api_secret: "Q3vViNV7-48cSIMOC5GaRmelr8c"
});

/* -------------------------------------------
   MULTER (Memory storage, sending buffer)
--------------------------------------------*/
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 2MB
});


/* -------------------------------------------
   CORS
--------------------------------------------*/
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* -------------------------------------------
   BODY PARSERS
--------------------------------------------*/
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

/* -------------------------------------------
   SESSION
--------------------------------------------*/
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true, sameSite: "lax" },
  })
);


/* -------------------------------------------
   GOOGLE LOGIN
--------------------------------------------*/
app.post("/google-login", async (req, res) => {
  try {
    const body = req.body.user || req.body;

    const googleId = (body.googleId || body.uid || "").toString().trim();
    const email = (body.email || "").trim().toLowerCase();
    const name = (body.name || body.displayName || "").trim();
    const entry_no = email ? email.split("@")[0] : null;
// after successful /google-login response
//localStorage.setItem("googleId", res.data.user.google_id);

    if (!googleId || !name || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // CHECK USER EXISTS
    const existing = await pool.query(
      `SELECT * FROM users WHERE google_id = $1 OR email = $2 LIMIT 1`,
      [googleId, email]
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];

      const profileComplete =
        user.course &&
        user.batch &&
        user.hostel &&
        user.mess &&
        user.food_choice;

      return res.json({
        message: "User already exists",
        exists: true,
        profileComplete,
        user,
      });
    }

    // INSERT NEW USER
    const insert = await pool.query(
      `INSERT INTO users (google_id, name, email, entry_no, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [googleId, name, email, entry_no]
    );

    return res.status(201).json({
      message: "New user created",
      exists: false,
      user: insert.rows[0],
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


/* -------------------------------------------
   UPDATE PROFILE (WITH IMAGE)
--------------------------------------------*/
app.post("/update-profile", upload.single("avatar"), async (req, res) => {
  try {
    const {
      googleId,
      course,
      batch,
      hostel,
      mess,
      food_choice,
    } = req.body;

    if (!googleId) {
      return res.status(400).json({ success: false, message: "Missing googleId" });
    }

    let avatarUrl = null;

    // IMAGE UPLOAD (if file exists)
    if (req.file) {
      const b64 = req.file.buffer.toString("base64");
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const uploadRes = await cloudinary.uploader.upload(dataURI, {
        folder: "campus-portal/avatars",
        public_id: `user_${googleId}`,
        overwrite: true,
      });

      avatarUrl = uploadRes.secure_url;
    }

    // UPDATE USER
    const updateQuery = `
      UPDATE users
      SET 
        course = $1::course_enum,
        batch = $2::batch_enum,
        hostel = $3::hostel_enum,
        mess = $4::mess_enum,
        food_choice = $5::food_enum,
        avatar_url = COALESCE($6, avatar_url),
        status = 'pending'::user_status_enum
      WHERE google_id = $7
      RETURNING *;
    `;

    const values = [
      course,
      batch,
      hostel,
      mess,
      food_choice,
      avatarUrl,
      googleId,
    ];

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, user: result.rows[0] });

  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ success: false });
  }
});

app.get("/user/:googleId", async (req, res) => {
  try {
    const { googleId } = req.params;

    if (!googleId) {
      return res.status(400).json({ success: false, message: "Missing googleId" });
    }

    const result = await pool.query(
      `SELECT * FROM users WHERE google_id = $1 LIMIT 1`,
      [googleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("Get user error:", err);
    return res.status(500).json({ success: false });
  }
});


/* -------------------------------------------
   TEST ROUTES
--------------------------------------------*/
app.get("/test", (req, res) => {
  res.json({ message: "CORS OK" });
});


/* -------------------------------------------
   START SERVER
--------------------------------------------*/
app.listen(3000, "0.0.0.0", () =>
  console.log("🚀 Server running on port 3000")
);
