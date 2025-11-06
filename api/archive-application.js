/**
 * Archive Application (Soft Delete)
 * 
 * User-facing: Archives application from dashboard view
 * Legal: Maintains complete audit trail for IDS compliance
 */

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const { applicationId, userEmail } = req.body;

    if (!applicationId) {
      return res.status(400).json({ error: 'Missing applicationId' });
    }

    console.log('Archiving application:', { applicationId, userEmail });

    // Soft delete - set archived flag
    const result = await sql`
      UPDATE applications 
      SET 
        archived = true,
        archived_at = NOW(),
        archived_by = ${userEmail || 'unknown'}
      WHERE id = ${applicationId}
      RETURNING id, title, archived
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    console.log('Application archived successfully:', result[0]);

    return res.status(200).json({
      success: true,
      message: 'Application archived successfully',
      application: result[0],
      note: 'Application hidden from dashboard but retained for legal audit trail'
    });

  } catch (error) {
    console.error('Error archiving application:', error.message);
    
    return res.status(500).json({
      error: 'Failed to archive application',
      message: error.message
    });
  }
}
