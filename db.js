// db.js
const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_e6GngoEc2Yyt@ep-steep-hat-ad8z3a1z-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

module.exports = pool;
