#!/usr/bin/env python3
"""
Trogon Hunt Batch Processing Script
====================================

Purpose: Process blind test patents through Trogon Hunt system
- Calls Claude API for CPC classification
- Calls Claude API for POD extraction
- Stores predictions for validation

Usage:
    python 2_batch_process.py

Input:
    - test_data/input/*.json (blind specifications)

Output:
    - test_data/predictions/patent_XXX_predictions.json (CPC + PODs)
    - test_data/processing_log.json (costs, errors, timing)
"""

import json
import time
import os
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
import anthropic

# Configuration
INPUT_DIR = Path("test_data/input")
OUTPUT_DIR = Path("test_data/predictions")
LOG_FILE = Path("test_data/processing_log.json")

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Get Claude API key from environment
CLAUDE_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not CLAUDE_API_KEY:
    print("❌ ERROR: ANTHROPIC_API_KEY environment variable not set")
    print("   Set it with: export ANTHROPIC_API_KEY='your-key-here'")
    exit(1)


class TrogonHuntProcessor:
    """
    Processes patent specifications through Trogon Hunt system
    Uses same prompts as production system
    """
    
    # Template 2: POD Extraction (from prior-art-prompt-templates.md)
    POD_EXTRACTION_PROMPT = """You are a patent attorney analyzing a provisional patent specification to extract Points of Distinction (PODs) for prior art searching.

TASK: Identify 3-5 Points of Distinction that differentiate this invention from existing technology.

PROVISIONAL SPECIFICATION:
{spec_text}

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
{{
  "pods": [
    {{
      "pod_text": "The system uses machine learning to analyze patent claims in real-time during mobile filing, automatically suggesting amendments based on prior art similarity scores.",
      "rationale": "Combines mobile filing + ML claim analysis + real-time suggestions - not found in existing patent tools",
      "is_primary": true
    }},
    {{
      "pod_text": "...",
      "rationale": "...",
      "is_primary": true
    }}
  ],
  "technology_area": "Software/ML" | "Mechanical/Electrical" | "Chemical/Biotech",
  "primary_cpc_prediction": "G06F 40/169"
}}

OUTPUT ONLY VALID JSON - no markdown formatting or explanations."""
    
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)
        self.processed_count = 0
        self.failed_count = 0
        self.total_cost = 0.0
        self.processing_log = []
        
    def classify_specification(self, spec_text: str, patent_id: str) -> Dict[str, Any]:
        """
        Classify specification and extract PODs using Claude API
        
        Args:
            spec_text: Full specification text
            patent_id: Patent identifier
            
        Returns:
            Dictionary with CPC predictions and PODs
        """
        start_time = time.time()
        
        try:
            # Call Claude API
            prompt = self.POD_EXTRACTION_PROMPT.format(spec_text=spec_text)
            
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                temperature=0.0,  # Deterministic for testing
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Parse JSON response
            response_text = response.content[0].text
            
            # Strip markdown if present
            response_text = response_text.replace("```json", "").replace("```", "").strip()
            
            result = json.loads(response_text)
            
            # Calculate cost (approximate)
            # Input: ~2K tokens (prompt) + spec_text length
            # Output: ~500 tokens
            input_tokens = len(prompt) // 4  # Rough estimate
            output_tokens = len(response_text) // 4
            
            # Claude Sonnet 4 pricing: $3/M input, $15/M output (approximate)
            cost = (input_tokens / 1_000_000 * 3) + (output_tokens / 1_000_000 * 15)
            self.total_cost += cost
            
            processing_time = time.time() - start_time
            
            # Log processing
            self.processing_log.append({
                "patent_id": patent_id,
                "status": "success",
                "processing_time": f"{processing_time:.2f}s",
                "cost": f"${cost:.4f}",
                "pods_extracted": len(result.get("pods", [])),
                "primary_cpc": result.get("primary_cpc_prediction", "")
            })
            
            self.processed_count += 1
            
            return {
                "patent_id": patent_id,
                "predictions": {
                    "primary_cpc": result.get("primary_cpc_prediction", ""),
                    "cpc_predictions": [
                        {
                            "code": result.get("primary_cpc_prediction", ""),
                            "confidence": 0.92  # Mock confidence
                        }
                    ],
                    "pods": result.get("pods", []),
                    "technology_area": result.get("technology_area", "Unknown")
                },
                "processing": {
                    "timestamp": datetime.now().isoformat(),
                    "processing_time": processing_time,
                    "cost": cost,
                    "model": "claude-sonnet-4-20250514"
                }
            }
            
        except json.JSONDecodeError as e:
            print(f"   ❌ JSON parsing error for {patent_id}: {e}")
            print(f"      Response: {response_text[:200]}...")
            
            self.failed_count += 1
            self.processing_log.append({
                "patent_id": patent_id,
                "status": "failed",
                "error": f"JSON parsing: {str(e)}"
            })
            
            return None
            
        except Exception as e:
            print(f"   ❌ Error processing {patent_id}: {e}")
            
            self.failed_count += 1
            self.processing_log.append({
                "patent_id": patent_id,
                "status": "failed",
                "error": str(e)
            })
            
            return None
    
    def process_all_inputs(self) -> Dict[str, Any]:
        """
        Process all patent input files
        
        Returns:
            Processing statistics
        """
        print("\n" + "="*60)
        print("Trogon Hunt Batch Processing")
        print("="*60)
        print(f"Input Directory: {INPUT_DIR}")
        print(f"Output Directory: {OUTPUT_DIR}")
        print("="*60 + "\n")
        
        # Get all input files
        input_files = sorted(INPUT_DIR.glob("patent_*_input.json"))
        total_files = len(input_files)
        
        if total_files == 0:
            print("❌ No input files found!")
            print("   Run: python 1_collect_test_data.py first")
            return {}
        
        print(f"📊 Found {total_files} patents to process\n")
        
        # Process each file
        for idx, input_file in enumerate(input_files, 1):
            # Load input
            with open(input_file, 'r') as f:
                input_data = json.load(f)
            
            patent_id = input_data['patent_id']
            spec_text = input_data['specification_text']
            
            print(f"[{idx}/{total_files}] Processing {patent_id}...")
            print(f"  Spec length: {len(spec_text)} characters")
            
            # Process through system
            prediction = self.classify_specification(spec_text, patent_id)
            
            if prediction:
                # Save prediction
                output_file = OUTPUT_DIR / f"{patent_id}_predictions.json"
                with open(output_file, 'w') as f:
                    json.dump(prediction, f, indent=2)
                
                print(f"  ✅ Primary CPC: {prediction['predictions']['primary_cpc']}")
                print(f"  ✅ PODs: {len(prediction['predictions']['pods'])}")
                print(f"  ✅ Cost: ${prediction['processing']['cost']:.4f}")
            
            # Rate limiting (1 request per 2 seconds to be safe)
            if idx < total_files:
                time.sleep(2)
        
        # Save processing log
        log_data = {
            "timestamp": datetime.now().isoformat(),
            "total_files": total_files,
            "processed": self.processed_count,
            "failed": self.failed_count,
            "total_cost": f"${self.total_cost:.2f}",
            "average_cost_per_patent": f"${self.total_cost / max(self.processed_count, 1):.4f}",
            "processing_log": self.processing_log
        }
        
        with open(LOG_FILE, 'w') as f:
            json.dump(log_data, f, indent=2)
        
        # Print summary
        print("\n" + "="*60)
        print("✅ Batch Processing Complete")
        print("="*60)
        print(f"Total Files: {total_files}")
        print(f"Processed: {self.processed_count}")
        print(f"Failed: {self.failed_count}")
        print(f"Success Rate: {(self.processed_count / total_files) * 100:.1f}%")
        print(f"Total Cost: ${self.total_cost:.2f}")
        print(f"Avg Cost/Patent: ${self.total_cost / max(self.processed_count, 1):.4f}")
        print(f"\nLog File: {LOG_FILE}")
        print(f"Predictions: {OUTPUT_DIR}")
        print("="*60 + "\n")
        
        return log_data


def estimate_costs(num_patents: int = 150):
    """
    Estimate processing costs
    
    Args:
        num_patents: Number of patents to process
    """
    cost_per_patent = 0.03  # $0.03 per patent (approximate)
    total_cost = num_patents * cost_per_patent
    
    print("\n💰 Cost Estimate")
    print("="*60)
    print(f"Patents to Process: {num_patents}")
    print(f"Cost per Patent: ${cost_per_patent:.3f}")
    print(f"Total Estimated Cost: ${total_cost:.2f}")
    print("="*60)
    print()


def main():
    """Main execution"""
    print("\n🚀 Starting Batch Processing\n")
    
    # Check for API key
    if not CLAUDE_API_KEY:
        return
    
    # Show cost estimate
    input_files = list(INPUT_DIR.glob("patent_*_input.json"))
    if input_files:
        estimate_costs(len(input_files))
        
        response = input("Continue with processing? (yes/no): ")
        if response.lower() not in ['yes', 'y']:
            print("Cancelled.")
            return
    
    # Process all patents
    processor = TrogonHuntProcessor()
    stats = processor.process_all_inputs()
    
    if stats:
        print("\n✅ Batch processing complete!")
        print("\nNext Steps:")
        print("  1. Review test_data/processing_log.json")
        print("  2. Inspect predictions in test_data/predictions/")
        print("  3. Run: python 3_validate_accuracy.py")
        print()


if __name__ == "__main__":
    main()
