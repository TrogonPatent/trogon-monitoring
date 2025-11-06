/**
 * Admin Delete Application (Hard Delete)
 * 
 * ADMIN ONLY: Permanently deletes application and all related data
 * Use only for testing/cleanup - NOT for production user access
 * 
 * Security: Check for admin email or API key
 */

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Only allow DELETE method
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const { applicationId, adminKey } = req.body;

    // ADMIN AUTH CHECK
    const validAdminKey = process.env.ADMIN_DELETE_KEY || 'trogon-admin-2025';
    
    if (adminKey !== validAdminKey) {
      console.warn('Unauthorized admin delete attempt');
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Admin authentication required'
      });
    }

    if (!applicationId) {
      return res.status(400).json({ error: 'Missing applicationId' });
    }

    console.log('ADMIN: Hard deleting application:', applicationId);

    // Get application info before deleting
    const app = await sql`
      SELECT id, title FROM applications WHERE id = ${applicationId}
    `;

    if (app.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Hard delete - PODs first (foreign key), then application
    await sql`
      DELETE FROM pod_definitions 
      WHERE application_id = ${applicationId}
    `;

    await sql`
      DELETE FROM applications 
      WHERE id = ${applicationId}
    `;

    console.log('ADMIN: Application permanently deleted:', app[0]);

    return res.status(200).json({
      success: true,
      message: 'Application permanently deleted',
      deleted: app[0],
      warning: 'This action cannot be undone. Use only for testing.'
    });

  } catch (error) {
    console.error('Error in admin delete:', error.message);
    
    return res.status(500).json({
      error: 'Failed to delete application',
      message: error.message
    });
  }
}
