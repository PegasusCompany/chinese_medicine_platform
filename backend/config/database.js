const { Pool } = require('pg');

// Configure SSL for AWS RDS
const isProduction = process.env.NODE_ENV === 'production';
let poolConfig = {
  connectionString: process.env.DATABASE_URL,
};

// Add SSL configuration for production (AWS RDS)
if (isProduction && process.env.DATABASE_URL && process.env.DATABASE_URL.includes('amazonaws.com')) {
  // Parse the DATABASE_URL and add SSL parameters
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('sslmode', 'require');
  
  poolConfig = {
    connectionString: url.toString(),
    ssl: {
      rejectUnauthorized: false, // For AWS RDS
    }
  };
}

const pool = new Pool(poolConfig);

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};