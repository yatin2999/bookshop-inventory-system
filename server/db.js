import mysql from 'mysql2/promise';
import { ApiError } from './validate.js';

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

export const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT || 3306),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  connectionLimit: 10,
  dateStrings: true,
  charset: 'UTF8MB4_0900_AI_CI',
});

export async function withTransaction(work) {
  const connection = await pool.getConnection();
  let reusable = true;
  try {
    let result;
    try {
      await connection.beginTransaction();
      result = await work(connection);
    } catch (error) {
      await connection.rollback().catch(() => {
        reusable = false;
      });
      throw error;
    }
    try {
      await connection.commit();
    } catch {
      reusable = false;
      throw new ApiError(503, 'OUTCOME_UNKNOWN', 'The connection failed while saving, so the change may have been recorded.');
    }
    return result;
  } finally {
    if (reusable) {
      connection.release();
    } else {
      connection.destroy();
    }
  }
}
