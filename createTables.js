const pool = require("./db");

async function createTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id TEXT UNIQUE,
        name TEXT,
        email TEXT UNIQUE,
        entry_no TEXT UNIQUE
      );
    `);

    console.log("✔ users table created / already exists");

    process.exit(); // Close script
  } catch (err) {
    console.error("❌ Error creating tables:", err);
    process.exit(1);
  }
}

createTables();
