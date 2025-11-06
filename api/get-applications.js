/**
 * Get Applications - Fetch all provisional applications with POD counts
 * 
 * Returns applications sorted by most recent first
 */

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Get query parameter for showing archived (admin only)
    const showArchived = req.query?.showArchived === 'true';

    // Get all applications (filter archived unless requested)
    let applications;
    
    if (showArchived) {
      // Admin view: show everything
      applications = await sql`
        SELECT 
          id,
          title,
          filing_date,
          publication_deadline,
          is_provisional,
          predicted_primary_cpc,
          technology_area,
          archived,
          archived_at,
          archived_by,
          created_at,
          updated_at
        FROM applications
        ORDER BY created_at DESC
      `;
    } else {
      // User view: hide archived
      applications = await sql`
        SELECT 
          id,
          title,
          filing_date,
          publication_deadline,
          is_provisional,
          predicted_primary_cpc,
          technology_area,
          created_at,
          updated_at
        FROM applications
        WHERE archived = false OR archived IS NULL
        ORDER BY created_at DESC
      `;
    }

    // For each application, get POD count
    const applicationsWithPods = await Promise.all(
      applications.map(async (app) => {
        const podCount = await sql`
          SELECT COUNT(*) as count
          FROM pod_definitions
          WHERE application_id = ${app.id}
        `;

        const primaryPodCount = await sql`
          SELECT COUNT(*) as count
          FROM pod_definitions
          WHERE application_id = ${app.id}
            AND is_primary = true
        `;

        return {
          ...app,
          podCount: parseInt(podCount[0].count),
          primaryPodCount: parseInt(primaryPodCount[0].count),
          isPreFiling: app.is_provisional && !app.filing_date,
          daysUntilPublication: app.publication_deadline 
            ? calculateDaysUntil(app.publication_deadline)
            : null
        };
      })
    );

    console.log(`Fetched ${applicationsWithPods.length} applications`);

    return res.status(200).json({
      success: true,
      applications: applicationsWithPods,
      count: applicationsWithPods.length
    });

  } catch (error) {
    console.error('Error fetching applications:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({
      error: 'Failed to fetch applications',
      message: error.message
    });
  }
}

/**
 * Calculate days until a future date
 */
function calculateDaysUntil(dateString) {
  if (!dateString) return null;
  
  const targetDate = new Date(dateString);
  const today = new Date();
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}
