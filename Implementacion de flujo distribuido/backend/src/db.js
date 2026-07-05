const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'sakila',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = {
  get: async (sql, params = []) => {
    const [rows] = await pool.execute(sql, params);
    return rows[0];
  },
  all: async (sql, params = []) => {
    const [rows] = await pool.execute(sql, params);
    return rows;
  },
  run: async (sql, params = []) => {
    const [result] = await pool.execute(sql, params);
    return result;
  },
  pool
};
