// Database connection for Neon PostgreSQL
import { Pool } from 'pg';

// Debug: log if DATABASE_URL is set
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
});

export default pool;

// Helper function to run parameterized queries
export async function query<T>(text: string, params?: any[]): Promise<T[]> {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(text, params);
            return result.rows as T[];
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Database connection error:', error);
        console.error('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');
        throw error;
    }
}

