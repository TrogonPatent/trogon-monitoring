# trogon hunt Testing & Validation System

**Purpose:** Automated testing framework to validate POD extraction and CPC classification accuracy against real USPTO examiner decisions.

## Overview

This system implements a rigorous **blind testing methodology** to validate trogon hunt's AI-powered patent classification system:

1. **Collect** 150 issued patents from USPTO (stratified across 5 technology areas)
2. **Strip** claims and classifications to create "blind" specifications
3. **Process** through Trogon Hunt system (Claude API)
4. **Compare** predictions against USPTO examiner ground truth
5. **Calculate** comprehensive accuracy metrics

## Success Criteria

| Metric | Minimum | Target | Stretch |
|--------|---------|--------|---------|
| Primary CPC Accuracy | 60% | **75%** | 85% |
| Top-3 CPC Accuracy | 75% | **85%** | 95% |
| CPC Recall | 50% | **65%** | 80% |
| CPC Precision | 40% | **50%** | 70% |

**Target (75% Primary CPC):** Production-ready, competitive with commercial tools

## Quick Start

### Prerequisites

```bash
# Python 3.8+
python3 --version

# Install dependencies
pip install -r requirements.txt

# Set Claude API key
export ANTHROPIC_API_KEY='your-api-key-here'
```

### Run Complete Validation

```bash
# Step 1: Collect 150 patents from USPTO
python 1_collect_test_data.py

# Step 2: Process through Trogon Hunt (costs ~$4.50)
python 2_batch_process.py

# Step 3: Validate against ground truth
python 3_validate_accuracy.py
```

### Review Results

```bash
# Human-readable report
cat test_data/validation_report.md

# Machine-readable metrics
cat test_data/validation_report.json

# Per-patent details
open test_data/detailed_results.csv
```

## Scripts Overview

### 1. Data Collection (`1_collect_test_data.py`)

**Purpose:** Download and prepare test data

**What it does:**
- Queries USPTO PatentsView API for 150 issued patents
- Stratified sampling: 30 patents across 5 technology areas
- Removes claims and classifications (blind testing)
- Saves ground truth separately

**Output:**
```
test_data/
├── input/
│   ├── patent_US10234567_input.json
│   ├── patent_US10234568_input.json
│   └── ... (150 files)
├── ground_truth/
│   ├── patent_US10234567_truth.json
│   └── ... (150 files)
└── metadata.json
```

**Technology Areas:**
- Software/ML (G06F, G06N): 30 patents
- Mechanical/Electrical (F16, H01, H04): 30 patents  
- Life Sciences (A61K, C07, C12): 30 patents
- Business Methods (G06Q): 30 patents
- Chemistry (C01-C09): 30 patents

**Runtime:** ~10 minutes  
**Cost:** $0 (USPTO API is free)

### 2. Batch Processing (`2_batch_process.py`)

**Purpose:** Run patents through Trogon Hunt system

**What it does:**
- Loads blind specifications (no claims/CPCs visible)
- Calls Claude API for POD extraction + CPC classification
- Uses production Template 2 (from prior-art-prompt-templates.md)
- Saves predictions for validation

**Output:**
```
test_data/
├── predictions/
│   ├── test_US10234567_predictions.json
│   └── ... (150 files)
└── processing_log.json
```

**Runtime:** ~10 minutes (2s per patent + API time)  
**Cost:** ~$4.50 (150 patents × $0.03 each)

⚠️ **Important:** Rate-limited to 1 request per 2 seconds to avoid API throttling

### 3. Validation Analysis (`3_validate_accuracy.py`)

**Purpose:** Compare predictions vs ground truth

**What it does:**
- Matches predictions to examiner-assigned CPCs
- Calculates 5 core accuracy metrics
- Generates comprehensive reports
- Exports detailed CSV for analysis

**Metrics Calculated:**

**Primary CPC Accuracy:**
- Did we predict the examiner's primary CPC exactly?
- Most important metric for production readiness

**Top-3 CPC Accuracy:**
- Is examiner's primary in our top 3 predictions?
- Shows confidence range

**CPC Recall (Coverage):**
- How many of examiner's CPCs did we find?
- Measures comprehensiveness

**CPC Precision (Relevance):**
- How many of our predictions match examiner CPCs?
- Measures false positive rate

**Class-Level Accuracy:**
- Match at 4-character level (e.g., "G06F")
- Shows general technology domain accuracy

**Output:**
```
test_data/
├── validation_report.json      # Machine-readable
├── validation_report.md         # Human-readable
└── detailed_results.csv         # Per-patent analysis
```

**Runtime:** <1 minute  
**Cost:** $0

## File Structure

```
trogon-hunt-testing/
│
├── 1_collect_test_data.py      # USPTO data collection
├── 2_batch_process.py           # Batch processing
├── 3_validate_accuracy.py       # Accuracy validation
├── requirements.txt             # Python dependencies
├── README.md                    # This file
│
└── test_data/                   # Generated during testing
    ├── input/                   # Blind specifications
    ├── ground_truth/            # Examiner CPCs + claims
    ├── predictions/             # System predictions
    ├── metadata.json            # Collection stats
    ├── processing_log.json      # Processing costs/errors
    ├── validation_report.json   # Accuracy metrics
    ├── validation_report.md     # Human-readable report
    └── detailed_results.csv     # Per-patent results
```

## Understanding the Output

### Validation Report (Markdown)

```markdown
# Trogon Hunt Validation Report

## Executive Summary

**Total Patents Validated:** 150

| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| Primary CPC Accuracy | **78.7%** | 75% | ✅ PASS |
| Top-3 CPC Accuracy | **89.3%** | 85% | ✅ PASS |
...
```

### Detailed CSV

Columns:
- `patent_id`: Test identifier
- `source_patent`: USPTO patent number
- `technology_area`: Software/ML, etc.
- `predicted_primary_cpc`: Our prediction
- `truth_primary_cpc`: Examiner's assignment
- `primary_exact_match`: TRUE/FALSE
- `recall_percentage`: Coverage score
- `pod_count`: Number of PODs extracted

**Use for:**
- Identifying failure patterns
- Technology-specific analysis
- Prompt refinement data

## Cost Breakdown

| Step | Cost | Time |
|------|------|------|
| 1. Data Collection | $0 | 10 min |
| 2. Batch Processing | **$4.50** | 10 min |
| 3. Validation | $0 | 1 min |
| **Total** | **$4.50** | **21 min** |

**Cost per patent:** $0.03 (Claude API)

Compare to manual validation:
- Patent attorney: $200/hr × 15hr = $3,000-4,500
- **Automated: $4.50** (1,000× cheaper!)

## Interpreting Results

### ✅ Production Ready (≥75% Primary CPC)

**What it means:**
- System is competitive with commercial tools
- Ready for beta customer deployment
- Validation metrics support investor pitch

**Next steps:**
- Proceed to Phase B (POD-based prior art search)
- Begin beta customer testing
- Use metrics in fundraising materials

### ⚠️ Needs Improvement (60-74%)

**What it means:**
- Proof-of-concept validated
- Requires prompt refinement
- Identify technology-specific weaknesses

**Next steps:**
- Analyze failure patterns by technology area
- Refine Claude API prompts
- Consider technology-specific prompt variations
- Re-run validation

### 🔴 Not Ready (<60%)

**What it means:**
- Fundamental approach may need revision
- Consider alternative classification methods
- May need supervised learning component

**Next steps:**
- Review classification methodology
- Consider USPTO classifier integration
- Expand training data
- Consult with patent classification experts

## Technology Area Analysis

The validation breaks down results by technology area:

**Software/ML (G06F, G06N):**
- Most critical for Trogon Mobile's target market
- Typically hardest to classify (crowded field)
- If below 70%, requires immediate attention

**Mechanical/Electrical:**
- Generally easier to classify
- Should achieve 75%+ accuracy
- Good benchmark for system capabilities

**Chemistry/Life Sciences:**
- Highly specialized terminology
- May require domain-specific prompts
- Lower priority for MVP

## Troubleshooting

### Issue: Data collection fails

**Error:** `No patents found for CPC class`

**Solution:**
- Check USPTO PatentsView API status
- Verify internet connection
- Try different date range (2022-2024)

### Issue: Batch processing timeouts

**Error:** `Claude API timeout`

**Solution:**
- Reduce batch size
- Increase rate limiting delay (3-4s)
- Check specification length (<100K chars)

### Issue: Low accuracy (<60%)

**Potential causes:**
1. **Specification quality:** PatentsView abstracts ≠ full specs
   - Solution: Use USPTO Bulk Data for full text
2. **Prompt engineering:** Template needs refinement
   - Solution: Review failures, adjust Template 2
3. **Technology-specific:** Some areas need custom prompts
   - Solution: Create area-specific prompt variations

## Advanced Usage

### Custom Sample Size

```python
# In 1_collect_test_data.py, modify:
TECHNOLOGY_AREAS = {
    "Software/ML": {
        "target_count": 50,  # Changed from 30
        ...
    }
}
```

### Custom Technology Areas

```python
TECHNOLOGY_AREAS = {
    "Medical Devices": {
        "cpc_classes": ["A61B", "A61M"],
        "target_count": 40,
        "description": "Custom focus area"
    }
}
```

### Re-run Failed Patents

```python
# Check processing_log.json for failed patents
# Edit 2_batch_process.py to retry specific files
```

## Integration with Trogon Hunt

### Comparing Production vs Test

**Production system:**
- User uploads provisional spec
- Real-time classification
- Interactive POD review

**Test system:**
- Batch processing
- Predetermined ground truth
- Automated validation

**Key difference:** Test uses blind data (no claims) to measure AI accuracy objectively

### Applying Learnings

1. **Prompt refinement:**
   - Use failures to improve Template 2
   - Deploy improved prompts to production

2. **Threshold tuning:**
   - Accuracy metrics inform confidence thresholds
   - Adjust POD extraction sensitivity

3. **Technology-specific tuning:**
   - Create custom prompts for weak areas
   - Implement domain detection logic

## Continuous Improvement

### Validation Cadence

**Recommended schedule:**
- Initial: Validate with 150 patents
- After prompt changes: Re-validate with 30-patent subset
- Monthly: Full 150-patent validation
- Post-production: Compare against real user data

### A/B Testing

```python
# Test new prompt version
# 2_batch_process.py
POD_EXTRACTION_PROMPT_V2 = """..."""  # New prompt

# Run validation
# Compare V1 vs V2 results
```

### Training Data Generation

**Regardless of accuracy:**
- 150 labeled examples created
- Ground truth dataset for ML training
- Edge case documentation
- Future fine-tuning data

**Value:** Even if accuracy is low, data is valuable for improvement

## Next Steps After Validation

### If accuracy ≥75% (Production Ready)

1. **Phase B: POD-Based Prior Art Search**
   - Implement Google Patents API integration
   - Build scoring engine
   - 3-4 hours estimated

2. **Beta Customer Deployment**
   - Onboard 5-10 beta users
   - Monitor real-world accuracy
   - Collect user feedback

3. **Investor Pitch Integration**
   - Add validation metrics to pitch deck
   - "75% accuracy vs USPTO examiners"
   - Cost efficiency: $0.03 vs $200/hr attorney

### If accuracy <75% (Needs Work)

1. **Failure Analysis**
   - Run: `python analyze_failures.py` (to be created)
   - Identify common failure patterns
   - Technology-specific weaknesses

2. **Prompt Engineering Sprint**
   - Refine Template 2 based on failures
   - Test variations on subset
   - Re-validate

3. **Consider USPTO Classifier**
   - Integrate official USPTO automated classifier
   - Use Claude for POD extraction only
   - Combine predictions for best results

## Support

**Questions?**
- Review: TESTING-VALIDATION-STRATEGY-NOV7.md
- Check: prior-art-prompt-templates.md
- Contact: Brad Donovan (Patent Attorney, USPTO Reg. #58,483)

**Issues?**
- GitHub: [Create issue in trogon-monitoring repo]
- Logs: Check test_data/processing_log.json
- Errors: Review individual prediction files

---

## Appendix: Sample Output

### Input File (Blind Specification)

```json
{
  "patent_id": "test_US10234567",
  "title": "Machine Learning Patent Classification System",
  "specification_text": "A system for automated classification...",
  "metadata": {
    "source_patent": "US10234567B2",
    "technology_area": "Software/ML",
    "issue_date": "2023-01-24"
  }
}
```

### Ground Truth File

```json
{
  "patent_id": "test_US10234567",
  "source_patent": "US10234567B2",
  "ground_truth": {
    "examiner_cpc_primary": "G06F 40/169",
    "examiner_cpc_additional": ["G06N 3/08", "G06F 16/33"],
    "independent_claims": [],
    "assignee": "Tech Company Inc"
  }
}
```

### Prediction File

```json
{
  "patent_id": "test_US10234567",
  "predictions": {
    "primary_cpc": "G06F 40/169",
    "cpc_predictions": [
      {"code": "G06F 40/169", "confidence": 0.92},
      {"code": "G06N 3/08", "confidence": 0.87}
    ],
    "pods": [
      {
        "pod_text": "ML-based patent classification engine",
        "rationale": "Novel ML approach to classification",
        "is_primary": true
      }
    ],
    "technology_area": "Software/ML"
  },
  "processing": {
    "timestamp": "2025-11-07T10:30:00Z",
    "processing_time": 2.34,
    "cost": 0.0312,
    "model": "claude-sonnet-4-20250514"
  }
}
```

### Validation Result

```json
{
  "patent_id": "test_US10234567",
  "cpc_metrics": {
    "primary_cpc": {
      "predicted": "G06F 40/169",
      "truth": "G06F 40/169",
      "exact_match": true,
      "class_match": true
    },
    "top3_match": true,
    "recall": {"found": 2, "total": 3, "percentage": 0.67},
    "precision": {"relevant": 2, "total": 2, "percentage": 1.0}
  }
}
```

---

**Last Updated:** November 7, 2025  
**Version:** 1.0  
**Author:** Trogon Mobile Development Team
