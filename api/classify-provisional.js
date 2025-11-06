/**
 * Phase A: Classification & POD Extraction
 * 
 * This endpoint uses Claude API to:
 * 1. Predict CPC classifications from specification text
 * 2. Extract Points of Distinction (PODs)
 * 
 * Cost: ~$0.03 per application
 */

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { specText, title, applicationId } = req.body;

    // Validate input
    if (!specText || !title) {
      return res.status(400).json({ 
        error: 'Missing required fields: specText and title' 
      });
    }

    console.log('Starting classification and POD extraction:', {
      applicationId,
      title,
      textLength: specText.length
    });

    // Call Claude API using Template 2
    const claudeResponse = await callClaudeAPI(specText, title);

    console.log('Claude raw response (first 200 chars):', claudeResponse.substring(0, 200));

    // Strip markdown code blocks if present
    const cleanedResponse = stripMarkdownCodeBlocks(claudeResponse);

    console.log('Cleaned response (first 200 chars):', cleanedResponse.substring(0, 200));

    // Parse Claude's JSON response
    let result;
    try {
      result = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Attempted to parse:', cleanedResponse.substring(0, 500));
      throw new Error(`Failed to parse Claude response: ${parseError.message}`);
    }

    // Validate response structure
    if (!result.pods || !Array.isArray(result.pods) || result.pods.length === 0) {
      throw new Error('Claude did not return valid PODs');
    }

    // Extract CPC predictions from PODs
    // Claude gives us primary_cpc_prediction, we'll generate additional predictions
    const primaryCpc = result.primary_cpc_prediction || 'G06F 40/169';
    const technologyArea = result.technology_area || 'Software/Computing';

    // Generate CPC predictions based on technology area and primary CPC
    const cpcPredictions = generateCpcPredictions(primaryCpc, technologyArea);

    console.log('Classification and POD extraction successful:', {
      primaryCpc,
      technologyArea,
      podCount: result.pods.length,
      cpcCount: cpcPredictions.length
    });

    // Return combined results
    return res.status(200).json({
      success: true,
      primaryCpc,
      technologyArea,
      cpcPredictions,
      pods: result.pods
    });

  } catch (error) {
    console.error('Error in classify-provisional:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({
      error: 'Classification failed',
      message: error.message
    });
  }
}

/**
 * Strip markdown code blocks from Claude's response
 * Claude sometimes wraps JSON in ```json ... ``` even when told not to
 */
function stripMarkdownCodeBlocks(text) {
  // Remove ```json at start and ``` at end
  let cleaned = text.trim();
  
  // Check if it starts with ```json or ```
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7); // Remove ```json
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3); // Remove ```
  }
  
  // Check if it ends with ```
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  
  return cleaned.trim();
}

/**
 * Call Claude API with Template 2 prompt
 */
async function callClaudeAPI(specText, title) {
  const apiKey = process.env.CLAUDE_API_KEY;
  
  if (!apiKey) {
    throw new Error('CLAUDE_API_KEY not configured in environment variables');
  }

  // Build the prompt from Template 2
  const prompt = buildTemplate2Prompt(specText, title);

  // Call Claude API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  
  // Extract the text content from Claude's response
  const content = data.content[0].text;
  
  return content;
}

/**
 * Build Template 2 prompt for POD extraction and CPC prediction
 */
function buildTemplate2Prompt(specText, title) {
  // Truncate spec text if too long (keep first 8000 chars for context)
  const truncatedSpec = specText.length > 8000 
    ? specText.substring(0, 8000) + '\n\n[... specification truncated for API call ...]'
    : specText;

  return `You are a patent attorney analyzing a provisional patent specification to extract Points of Distinction (PODs) for prior art searching.

TASK: Identify 3-5 Points of Distinction that differentiate this invention from existing technology.

PROVISIONAL SPECIFICATION:
Title: ${title}

${truncatedSpec}

DEFINITION OF POD:
A Point of Distinction is a technical feature, method step, or system component that:
1. Is explicitly described in the specification
2. Appears to be novel or non-obvious
3. Contributes to solving the stated problem
4. Can be used as a search term or filter
5. Is specific enough to narrow search results

REQUIREMENTS:
1. Extract 3-5 PODs (prefer 4-5 for better coverage)
2. Each POD should be 1-3 sentences
3. Use technical language from the specification
4. Focus on WHAT makes it different, not WHY it's better
5. Avoid marketing language or value judgments
6. Prioritize concrete features over abstract concepts

FORMAT YOUR RESPONSE AS JSON:
{
  "pods": [
    {
      "pod_text": "The system uses machine learning to analyze patent claims in real-time during mobile filing, automatically suggesting amendments based on prior art similarity scores.",
      "rationale": "Combines mobile filing + ML claim analysis + real-time suggestions - not found in existing patent tools",
      "is_primary": true
    },
    {
      "pod_text": "...",
      "rationale": "...",
      "is_primary": true
    }
  ],
  "technology_area": "Software/ML" | "Mechanical/Electrical" | "Chemical/Biotech",
  "primary_cpc_prediction": "G06F 40/169"
}

OUTPUT ONLY VALID JSON - no markdown formatting, no code blocks, no explanations.
Your response must start with { and end with }.`;
}

/**
 * Generate additional CPC predictions based on primary CPC and technology area
 */
function generateCpcPredictions(primaryCpc, technologyArea) {
  // Extract the prefix from primary CPC (e.g., "G06F" from "G06F 40/169")
  const prefix = primaryCpc.substring(0, 4);
  
  // Map of common related CPCs by technology area
  const relatedCpcs = {
    'Software/ML': [
      { code: 'G06F 40/169', description: 'Document processing and analysis' },
      { code: 'G06N 3/08', description: 'Neural networks and machine learning' },
      { code: 'G06F 16/33', description: 'Query processing and search' },
      { code: 'G06Q 50/18', description: 'Legal services and intellectual property' },
      { code: 'H04L 51/00', description: 'User-to-user messaging systems' }
    ],
    'Software/Computing': [
      { code: 'G06F 40/169', description: 'Document processing and analysis' },
      { code: 'G06F 16/00', description: 'Information retrieval and databases' },
      { code: 'G06F 9/00', description: 'Computing arrangements' },
      { code: 'G06Q 10/00', description: 'Administration and management systems' }
    ],
    'Mechanical/Electrical': [
      { code: 'F16', description: 'Engineering elements and units' },
      { code: 'H01', description: 'Basic electric elements' },
      { code: 'H04', description: 'Electric communication technique' },
      { code: 'G01', description: 'Measuring and testing' }
    ],
    'Chemical/Biotech': [
      { code: 'A61K', description: 'Preparations for medical, dental, or toilet purposes' },
      { code: 'C07', description: 'Organic chemistry' },
      { code: 'C12', description: 'Biochemistry, microbiology, enzymology' },
      { code: 'A61P', description: 'Therapeutic activity of chemical compounds' }
    ]
  };

  // Get related CPCs for this technology area
  let cpcs = relatedCpcs[technologyArea] || relatedCpcs['Software/Computing'];
  
  // Build predictions array, ensuring primary CPC is first with highest confidence
  const predictions = [];
  
  // Add primary CPC first
  const primaryDescription = cpcs.find(c => c.code === primaryCpc)?.description 
    || 'Primary technology classification';
  
  predictions.push({
    code: primaryCpc,
    confidence: 0.92,
    description: primaryDescription
  });

  // Add related CPCs with decreasing confidence
  let confidence = 0.87;
  for (const cpc of cpcs) {
    if (cpc.code !== primaryCpc && predictions.length < 4) {
      predictions.push({
        code: cpc.code,
        confidence: confidence,
        description: cpc.description
      });
      confidence -= 0.06;
    }
  }

  return predictions;
}
