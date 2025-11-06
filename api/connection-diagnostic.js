/**
 * DEBUG ENDPOINT - Show exact connection details
 * This will help us see if Vercel is connecting to the right database
 */
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Get full connection details
    const dbInfo = await sql`
      SELECT 
        current_database() as database,
        current_schema() as schema,
        current_user as user,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port,
        version() as pg_version
    `;
    
    // Parse the connection string to show branch/endpoint
    const connString = process.env.DATABASE_URL;
    const match = connString.match(/postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/([^\?]+)/);
    
    let parsedConnection = null;
    if (match) {
      parsedConnection = {
        user: match[1],
        host: match[3],  // This shows the Neon endpoint (branch indicator)
        database: match[4]
      };
    }
    
    // List actual tables in this connection
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    return res.status(200).json({
      success: true,
      connectedTo: {
        database: dbInfo[0].database,
        schema: dbInfo[0].schema,
        user: dbInfo[0].user,
        serverIp: dbInfo[0].server_ip,
        postgresVersion: dbInfo[0].pg_version
      },
      connectionStringInfo: parsedConnection,
      tablesInThisDatabase: tables.map(t => t.table_name),
      expectedTables: [
        'applications',
        'pod_definitions',
        'search_results',
        'classification_validations',
        'threshold_selections',
        'monitoring_cycles',
        'safety_net_events'
      ]
    });
    
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}
