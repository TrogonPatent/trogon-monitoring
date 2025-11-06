/**
 * Get Application Details
 * 
 * Fetches a single application with all related data:
 * - Application metadata
 * - CPC predictions
 * - PODs with rationale
 * - File information
 */

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Missing application ID' });
    }

    // Get application details
    const applications = await sql`
      SELECT 
        id,
        title,
        filing_date,
        publication_deadline,
        is_provisional,
        specification_text,
        file_url,
        file_name,
        classifier_predictions,
        predicted_primary_cpc,
        technology_area,
        created_at,
        updated_at,
        archived
      FROM applications
      WHERE id = ${id}
    `;

    if (applications.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = applications[0];

    // Get PODs for this application
    const pods = await sql`
      SELECT 
        id,
        pod_text,
        pod_rationale,
        is_primary,
        suggested_by_system,
        user_approved,
        display_order,
        created_at
      FROM pod_definitions
      WHERE application_id = ${id}
      ORDER BY display_order, created_at
    `;

    // Parse CPC predictions if stored as JSON string
    let cpcPredictions = [];
    if (application.classifier_predictions) {
      try {
        cpcPredictions = typeof application.classifier_predictions === 'string'
          ? JSON.parse(application.classifier_predictions)
          : application.classifier_predictions;
      } catch (e) {
        console.error('Error parsing CPC predictions:', e);
      }
    }

    // Calculate days until publication
    let daysUntilPublication = null;
    if (application.publication_deadline) {
      const deadline = new Date(application.publication_deadline);
      const today = new Date();
      const diffTime = deadline - today;
      daysUntilPublication = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    console.log(`Fetched application ${id}:`, {
      title: application.title,
      podCount: pods.length,
      cpcCount: cpcPredictions.length
    });

    return res.status(200).json({
      success: true,
      application: {
        ...application,
        cpcPredictions,
        isPreFiling: application.is_provisional && !application.filing_date,
        daysUntilPublication,
        specLength: application.specification_text?.length || 0
      },
      pods: pods.map(pod => ({
        id: pod.id,
        text: pod.pod_text,
        rationale: pod.pod_rationale,
        isPrimary: pod.is_primary,
        suggestedBySystem: pod.suggested_by_system,
        userApproved: pod.user_approved,
        displayOrder: pod.display_order,
        createdAt: pod.created_at
      })),
      summary: {
        podCount: pods.length,
        primaryPodCount: pods.filter(p => p.is_primary).length,
        cpcCount: cpcPredictions.length,
        hasSpecification: !!application.specification_text,
        hasFile: !!application.file_url
      }
    });

  } catch (error) {
    console.error('Error fetching application details:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({
      error: 'Failed to fetch application details',
      message: error.message
    });
  }
}
