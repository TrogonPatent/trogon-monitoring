/**
 * DEBUG ENDPOINT - Comprehensive database diagnostics
 * This will help us find where the tables actually are
 */
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // 1. Check connection basics
    const dbInfo = await sql`SELECT current_database(), current_schema(), current_user`;
    
    // 2. Check search_path setting
    const searchPath = await sql`SHOW search_path`;
    
    // 3. List ALL schemas in the database
    const schemas = await sql`
      SELECT schema_name 
      FROM information_schema.schemata 
      ORDER BY schema_name
    `;
    
    // 4. List ALL tables in ALL schemas
    const allTables = await sql`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name
    `;
    
    // 5. Try to find 'applications' table anywhere
    const applicationsTables = await sql`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'applications'
    `;
    
    // 6. Try to describe the applications table structure if it exists
    let applicationsColumns = [];
    if (applicationsTables.length > 0) {
      const schema = applicationsTables[0].table_schema;
      applicationsColumns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = ${schema}
        AND table_name = 'applications'
        ORDER BY ordinal_position
      `;
    }
    
    // 7. Check if we can access public.applications directly
    let publicApplicationsTest = null;
    try {
      await sql`SELECT 1 FROM public.applications LIMIT 1`;
      publicApplicationsTest = 'SUCCESS - public.applications is accessible';
    } catch (err) {
      publicApplicationsTest = `ERROR - ${err.message}`;
    }
    
    // 8. Check if we can access applications without schema prefix
    let unqualifiedTest = null;
    try {
      await sql`SELECT 1 FROM applications LIMIT 1`;
      unqualifiedTest = 'SUCCESS - applications (no schema) is accessible';
    } catch (err) {
      unqualifiedTest = `ERROR - ${err.message}`;
    }
    
    return res.status(200).json({
      success: true,
      connection: {
        database: dbInfo[0].current_database,
        schema: dbInfo[0].current_schema,
        user: dbInfo[0].current_user,
        searchPath: searchPath[0].search_path
      },
      schemas: schemas.map(s => s.schema_name),
      allTables: allTables,
      applicationsTables: applicationsTables,
      applicationsColumns: applicationsColumns,
      accessTests: {
        publicQualified: publicApplicationsTest,
        unqualified: unqualifiedTest
      },
      connectionStringPreview: process.env.DATABASE_URL?.substring(0, 50) + '...'
    });
    
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
      code: error.code
    });
  }
}
