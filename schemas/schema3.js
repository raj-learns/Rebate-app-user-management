const pool = require("../db");

async function createTables() {
    try {
        await pool.query(`
  CREATE TABLE IF NOT EXISTS rebates (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    total_days INT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
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
