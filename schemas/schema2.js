const pool = require("../db");

async function createTables() {
    try {
        // ENUMS
        await pool.query(`
      DO $$ BEGIN
        CREATE TYPE course_enum AS ENUM ('BTech', 'MTech', 'MSc', 'Other');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN
        CREATE TYPE batch_enum AS ENUM ('2020', '2021', '2022', '2023', '2024', '2025');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE hostel_enum AS ENUM ('Chenab', 'Beas', 'Sutlej', 'Ravi', 'Brahmputra', 'T6');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE mess_enum AS ENUM ('Anusha', 'Konark', 'Ideal');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE food_enum AS ENUM ('veg', 'nonveg');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

        await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS course course_enum;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS batch batch_enum;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS hostel hostel_enum;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS mess mess_enum;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS food_choice food_enum;
    `);

        console.log("✔ users table updated with all fields");
        process.exit();

    } catch (err) {
        console.error(" Error creating tables:", err);
        process.exit(1);
    }
}

createTables();

