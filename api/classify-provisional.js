/**
 * Phase A: Classification & POD Extraction
 * 
 * This endpoint uses Claude API to:
 * 1. Predict CPC classifications from specification text
 * 2. Extract Points of Distinction (PODs)
 * 
 * Cost: ~$0.03 per application
 * 
 * MODIFIED: Supports prompt variations for testing
 */

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { specText, title, applicationId, promptVariation } = req.body;

    // Validate input
    if (!specText || !title) {
      return res.status(400).json({ 
        error: 'Missing required fields: specText and title' 
      });
    }

    console.log('Starting classification and POD extraction:', {
      applicationId,
      title,
      textLength: specText.length,
      promptVariation: promptVariation || 'baseline'
    });

    // Call Claude API with prompt variation
    const claudeResponse = await callClaudeAPI(specText, title, promptVariation);

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

    if (!result.primary_cpc_prediction) {
      throw new Error('Claude did not return primary CPC prediction');
    }

    // Extract CPC predictions from Claude's response
    const primaryCpc = result.primary_cpc_prediction;
    const technologyArea = result.technology_area || 'General Technology';
    const secondaryCpcs = result.secondary_cpc_predictions || [];

    // Build CPC predictions array
    const cpcPredictions = [];
    
    // Primary CPC (highest confidence)
    cpcPredictions.push({
      code: primaryCpc,
      confidence: 0.92,
      description: 'Primary technology classification'
    });

    // Secondary CPCs (decreasing confidence)
    let confidence = 0.87;
    for (const code of secondaryCpcs.slice(0, 4)) {
      cpcPredictions.push({
        code: code,
        confidence: confidence,
        description: 'Secondary classification'
      });
      confidence -= 0.06;
    }

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
 */
function stripMarkdownCodeBlocks(text) {
  let cleaned = text.trim();
  
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  
  return cleaned.trim();
}

/**
 * Call Claude API with prompt variation support
 */
async function callClaudeAPI(specText, title, promptVariation = 'baseline') {
  const apiKey = process.env.CLAUDE_API_KEY;
  
  if (!apiKey) {
    throw new Error('CLAUDE_API_KEY not configured in environment variables');
  }

  const prompt = buildTemplate2Prompt(specText, title, promptVariation);

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
  return data.content[0].text;
}

/**
 * Build updated prompt with variation support for testing
 */
function buildTemplate2Prompt(specText, title, promptVariation = 'baseline') {
  const truncatedSpec = specText.length > 8000 
    ? specText.substring(0, 8000) + '\n\n[... specification truncated for API call ...]'
    : specText;

  // Base prompt (current production)
  const basePrompt = `You are a patent attorney analyzing a provisional patent specification to extract Points of Distinction (PODs) for prior art searching AND predict CPC classifications.

TASK: 
1. Identify 3-5 Points of Distinction that differentiate this invention
2. Predict the primary CPC classification code
3. Predict 2-4 secondary CPC classification codes

PROVISIONAL SPECIFICATION:
Title: ${title}

${truncatedSpec}

DEFINITION OF POD:
A Point of Distinction is a technical feature, method step, or system component that:
1. Is explicitly described in the specification
2. Appears to be novel or non-obvious
3. Contributes to solving the stated problem
4. Can be used as a search term or filter
5. Is specific enough to narrow search results`;

  // Prompt variation additions (inserted after POD definition)
  const variations = {
    baseline: '',  // No addition - current production prompt
    
    mechanism: `

CRITICAL POD EXTRACTION RULE:
Describe the MECHANISM before the function. Focus on HOW it works, not WHAT it does.
- Mechanical: Geometric relationships, linkage ratios, material interfaces
- Software: Specific operations (divides X by Y), not high-level functions (processes data)
- Ignore the application context (industry, use case). Focus only on the novel technical mechanism.`,

    claim_style: `

EXTRACT PODs AS IF WRITING PATENT CLAIMS:
When describing each POD, use claim-style language:
1. Start with the structure/component, not its purpose
2. Use geometric terms (offset, ratio, angle) for mechanical features
3. Use precise operations (calculates ratio of X/Y, extracts bits 4-7) for algorithms
4. Avoid "the system does X" - instead say "component A configured to perform X"
5. Distinguish the application domain from the novel mechanism`,

    anti_context: `

AVOID THESE COMMON POD EXTRACTION ERRORS:
1. ❌ Describing application context instead of mechanism
   Example: "Agricultural steering" → ✅ "Pivot offset creating non-linear ratio"
2. ❌ Gravitating to software when mechanical features exist - check for geometric novelty FIRST
3. ❌ Functional language instead of structural
4. When in doubt: Ask "Could I build this from the POD description alone?" If no, add structural detail`
  };

  const cpcAndFormatGuidance = `

CPC CLASSIFICATION GUIDANCE:
- Use the most specific CPC code possible (e.g., G06F 40/169, not just G06F)
- Primary CPC should match the main invention concept
- Secondary CPCs should cover related aspects or alternative implementations
- Use standard CPC format: LETTER+NUMBERS+SPACE+NUMBERS/NUMBERS (e.g., "G06F 40/169", "B60Q 1/085")

FORMAT YOUR RESPONSE AS JSON:
{
  "pods": [
    {
      "pod_text": "The system uses machine learning to analyze patent claims in real-time during mobile filing, automatically suggesting amendments based on prior art similarity scores.",
      "rationale": "Combines mobile filing + ML claim analysis + real-time suggestions - not found in existing patent tools",
      "is_primary": true
    }
  ],
  "technology_area": "Software/ML" | "Mechanical/Electrical" | "Chemical/Biotech" | "Medical Devices",
  "primary_cpc_prediction": "G06F 40/169",
  "secondary_cpc_predictions": [
    "G06N 3/08",
    "G06Q 50/18",
    "H04L 51/00"
  ]
}

CRITICAL: 
- Use specific CPC codes with proper formatting (include the space and slash)
- Secondary CPCs must be relevant to THIS invention, not generic fallbacks
- Output ONLY valid JSON - no markdown, no code blocks, no explanations
- Your response must start with { and end with }`;

  // Construct final prompt with variation
  const variationText = variations[promptVariation] || variations.baseline;
  
  return basePrompt + variationText + cpcAndFormatGuidance;
}
