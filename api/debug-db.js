/**
 * DEBUG ENDPOINT - Check database connection
 * Temporary file to diagnose the issue
 */

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Check connection
    const dbInfo = await sql`SELECT current_database(), current_schema()`;
    
    // List all tables
    const tables = await sql`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    return res.status(200).json({
      success: true,
      database: dbInfo[0].current_database,
      schema: dbInfo[0].current_schema,
      tables: tables,
      connectionString: process.env.DATABASE_URL?.substring(0, 50) + '...'
    });
    
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}
