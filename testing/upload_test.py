#!/usr/bin/env python3
"""
Upload test patents to Trogon Hunt API with prompt variation support

Usage:
  python upload_test.py --count 25 --prompt-variation mechanism
  python upload_test.py --api-url https://monitoring.trogonpatent.ai --count 20 --prompt-variation baseline

Prompt variations:
  baseline      - Current production prompt (no additions)
  mechanism     - Mechanism-first guidance (geometric, structural focus)
  claim_style   - Claim-style language guidance
  anti_context  - Anti-context-bias guidance
"""

import os
import json
import time
import argparse
from pathlib import Path
import requests
from docx import Document

# Default API configuration
DEFAULT_API_URL = 'https://monitoring.trogonpatent.ai'
DEFAULT_RATE_LIMIT = 2  # seconds between requests

def load_specification(spec_path):
    """Load specification text from DOCX file"""
    doc = Document(spec_path)
    spec_text = '\n'.join([para.text for para in doc.paragraphs if para.text.strip()])
    return spec_text

def load_ground_truth(ground_truth_path):
    """Load ground truth data (title, claims, CPCs)"""
    with open(ground_truth_path, 'r') as f:
        return json.load(f)

def call_classify_api(api_url, spec_text, title, application_id, prompt_variation='baseline'):
    """Call the classification API with prompt variation"""
    endpoint = f"{api_url}/api/classify-provisional"
    
    payload = {
        'specText': spec_text,
        'title': title,
        'applicationId': application_id,
        'promptVariation': prompt_variation  # NEW: Pass variation to API
    }
    
    try:
        response = requests.post(endpoint, json=payload, timeout=60)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"  ❌ API call failed: {e}")
        return None

def save_api_result(result, output_path):
    """Save API response to JSON file"""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(result, f, indent=2)

def process_patent(patent_dir, api_url, prompt_variation, rate_limit):
    """Process a single patent through the API"""
    patent_name = os.path.basename(patent_dir)
    
    # Paths
    spec_path = os.path.join(patent_dir, 'specifications', f'{patent_name}.docx')
    ground_truth_path = os.path.join(patent_dir, 'ground_truth', f'{patent_name}.json')
    api_result_path = os.path.join(patent_dir, 'api_results', f'{patent_name}.json')
    
    # Check if files exist
    if not os.path.exists(spec_path):
        print(f"  ⚠️  Specification not found: {spec_path}")
        return False
    
    if not os.path.exists(ground_truth_path):
        print(f"  ⚠️  Ground truth not found: {ground_truth_path}")
        return False
    
    # Check if already processed
    if os.path.exists(api_result_path):
        print(f"  ⏭️  Already processed, skipping")
        return True
    
    # Load data
    try:
        spec_text = load_specification(spec_path)
        ground_truth = load_ground_truth(ground_truth_path)
        title = ground_truth.get('title', 'Unknown Title')
        
        print(f"  📄 Spec length: {len(spec_text)} chars")
        print(f"  🎯 Prompt variation: {prompt_variation}")
        
        # Call API
        print(f"  🔄 Calling classification API...")
        result = call_classify_api(api_url, spec_text, title, patent_name, prompt_variation)
        
        if result:
            # Save result
            save_api_result(result, api_result_path)
            
            if result.get('success'):
                print(f"  ✅ Success! PODs: {len(result.get('pods', []))}, Primary CPC: {result.get('primaryCpc', 'N/A')}")
            else:
                print(f"  ⚠️  API returned error: {result.get('error', 'Unknown error')}")
            
            # Rate limiting
            time.sleep(rate_limit)
            return True
        else:
            print(f"  ❌ API call failed")
            return False
            
    except Exception as e:
        print(f"  ❌ Error processing patent: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(
        description='Upload test patents to Trogon Hunt API with prompt variation support'
    )
    parser.add_argument(
        '--api-url',
        default=DEFAULT_API_URL,
        help=f'API base URL (default: {DEFAULT_API_URL})'
    )
    parser.add_argument(
        '--dir',
        default='test_patents',
        help='Directory containing test patents (default: test_patents)'
    )
    parser.add_argument(
        '--count',
        type=int,
        help='Number of patents to process (default: all)'
    )
    parser.add_argument(
        '--rate-limit',
        type=float,
        default=DEFAULT_RATE_LIMIT,
        help=f'Seconds to wait between API calls (default: {DEFAULT_RATE_LIMIT})'
    )
    parser.add_argument(
        '--prompt-variation',
        choices=['baseline', 'mechanism', 'claim_style', 'anti_context'],
        default='baseline',
        help='Prompt variation to test (default: baseline)'
    )
    parser.add_argument(
        '--output-dir',
        help='Optional: Override test_patents directory for this run (e.g., test_mechanism)'
    )
    
    args = parser.parse_args()
    
    # Determine test directory
    if args.output_dir:
        test_dir = args.output_dir
        # Create directory structure
        os.makedirs(test_dir, exist_ok=True)
        os.makedirs(os.path.join(test_dir, 'api_results'), exist_ok=True)
        print(f"\n📁 Output directory: {test_dir}")
    else:
        test_dir = args.dir
    
    # Find all patent directories
    spec_dir = os.path.join(test_dir, 'specifications')
    
    if not os.path.exists(spec_dir):
        print(f"❌ Specifications directory not found: {spec_dir}")
        print(f"   Make sure you've run download_and_parse.py first")
        return
    
    # Get list of patents
    patent_files = [f for f in os.listdir(spec_dir) if f.endswith('.docx')]
    patent_names = [os.path.splitext(f)[0] for f in patent_files]
    
    if not patent_names:
        print(f"❌ No patents found in {spec_dir}")
        return
    
    # Limit count if specified
    if args.count:
        patent_names = patent_names[:args.count]
    
    print(f"\n🧪 Trogon Hunt API Test - Prompt Variation: {args.prompt_variation.upper()}")
    print(f"=" * 70)
    print(f"API URL: {args.api_url}")
    print(f"Test directory: {test_dir}")
    print(f"Patents to process: {len(patent_names)}")
    print(f"Rate limit: {args.rate_limit} seconds")
    print(f"Prompt variation: {args.prompt_variation}")
    print(f"=" * 70)
    
    # Process each patent
    success_count = 0
    fail_count = 0
    
    for i, patent_name in enumerate(patent_names, 1):
        print(f"\n[{i}/{len(patent_names)}] Processing {patent_name}...")
        
        if process_patent(test_dir, args.api_url, args.prompt_variation, args.rate_limit):
            success_count += 1
        else:
            fail_count += 1
    
    # Summary
    print(f"\n" + "=" * 70)
    print(f"📊 Upload Complete - Prompt Variation: {args.prompt_variation.upper()}")
    print(f"=" * 70)
    print(f"✅ Successful: {success_count}")
    print(f"❌ Failed: {fail_count}")
    print(f"📁 Results saved to: {test_dir}/api_results/")
    print(f"\nNext step:")
    print(f"  python detailed_pod_analysis.py --dir {test_dir} --output {args.prompt_variation}_results.md")

if __name__ == '__main__':
    main()
