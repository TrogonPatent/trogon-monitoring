/**
 * Phase A: Save Provisional - Store CPC Classifications & PODs
 * 
 * This endpoint:
 * 1. Updates applications table with CPC predictions and technology area
 * 2. Inserts approved PODs into pod_definitions table
 * 3. Marks application as ready for Phase B
 */

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const {
      applicationId,
      title,
      filingDate,
      isPreFiling,
      cpcPredictions,
      primaryCpc,
      technologyArea,
      approvedPods
    } = req.body;

    // Validate required fields
    if (!applicationId) {
      return res.status(400).json({ error: 'Missing applicationId' });
    }

    if (!approvedPods || !Array.isArray(approvedPods) || approvedPods.length < 3) {
      return res.status(400).json({ 
        error: 'At least 3 approved PODs required',
        podCount: approvedPods?.length || 0
      });
    }

    console.log('Saving provisional data:', {
      applicationId,
      title,
      primaryCpc,
      technologyArea,
      podCount: approvedPods.length,
      cpcCount: cpcPredictions.length
    });

    // Step 1: Update applications table with CPC data and AI-generated title
    await sql`
      UPDATE applications 
      SET 
        title = ${title},
        classifier_predictions = ${JSON.stringify(cpcPredictions)},
        predicted_primary_cpc = ${primaryCpc},
        technology_area = ${technologyArea},
        updated_at = NOW()
      WHERE id = ${applicationId}
    `;

    console.log('Applications table updated with CPC data');

    // Step 2: Insert approved PODs into pod_definitions table
    // Delete any existing PODs for this application first (in case of re-save)
    await sql`
      DELETE FROM pod_definitions 
      WHERE application_id = ${applicationId}
    `;

    console.log('Existing PODs deleted (if any)');

    // Insert each approved POD
    for (let i = 0; i < approvedPods.length; i++) {
      const pod = approvedPods[i];
      
      await sql`
        INSERT INTO pod_definitions (
          application_id,
          pod_text,
          pod_rationale,
          is_primary,
          suggested_by_system,
          user_approved,
          display_order
        ) VALUES (
          ${applicationId},
          ${pod.text},
          ${pod.rationale || 'User approved POD'},
          ${pod.isPrimary || false},
          ${pod.suggested || false},
          ${true},
          ${i + 1}
        )
      `;
    }

    console.log(`Inserted ${approvedPods.length} PODs into database`);

    // Step 3: Verify the data was saved
    const savedApp = await sql`
      SELECT 
        id,
        title,
        predicted_primary_cpc,
        technology_area,
        filing_date,
        publication_deadline,
        is_provisional
      FROM applications 
      WHERE id = ${applicationId}
    `;

    const savedPods = await sql`
      SELECT 
        id,
        pod_text,
        is_primary,
        display_order
      FROM pod_definitions 
      WHERE application_id = ${applicationId}
      ORDER BY display_order
    `;

    console.log('Save verification:', {
      applicationFound: savedApp.length > 0,
      podsFound: savedPods.length,
      primaryCpc: savedApp[0]?.predicted_primary_cpc
    });

    // Return success with saved data
    return res.status(200).json({
      success: true,
      message: 'Provisional application saved successfully',
      application: savedApp[0],
      pods: savedPods,
      summary: {
        applicationId: applicationId,
        title: savedApp[0]?.title,
        primaryCpc: savedApp[0]?.predicted_primary_cpc,
        technologyArea: savedApp[0]?.technology_area,
        podCount: savedPods.length,
        filingDate: savedApp[0]?.filing_date,
        publicationDeadline: savedApp[0]?.publication_deadline,
        isPreFiling: savedApp[0]?.is_provisional && !savedApp[0]?.filing_date
      }
    });

  } catch (error) {
    console.error('Error in save-provisional:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({
      error: 'Failed to save provisional data',
      message: error.message
    });
  }
}
