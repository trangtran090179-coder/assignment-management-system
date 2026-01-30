import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  database: process.env.MYSQL_DB || 'assignment_db',
  password: process.env.MYSQL_PASS || '',
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
