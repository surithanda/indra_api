import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'matrimony_services',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Execute stored procedure
export const executeProcedure = async (
  procedureName: string,
  params: any[] = []
): Promise<any> => {
  const connection = await pool.getConnection();
  try {
    const placeholders = params.map(() => '?').join(', ');
    const query = `CALL ${procedureName}(${placeholders})`;
    const [results] = await connection.execute(query, params);
    return results;
  } finally {
    connection.release();
  }
};

// Execute query
export const executeQuery = async (
  query: string,
  params: any[] = []
): Promise<any> => {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(query, params);
    return results;
  } finally {
    connection.release();
  }
};

// Get connection from pool
export const getConnection = async () => {
  return await pool.getConnection();
};

export default pool;
