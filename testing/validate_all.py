"""
Validate Trogon Hunt Results Against Ground Truth

Usage:
python validate_all.py --dir test_patents --anthropic-key YOUR_KEY
"""

import os
import sys
import json
import argparse
from pathlib import Path
from collections import defaultdict
import requests

class TrogonValidator:
    def __init__(self, test_dir, anthropic_key=None):
        self.test_dir = Path(test_dir)
        self.ground_truth_dir = self.test_dir / "ground_truth"
        self.results_dir = self.test_dir / "api_results"
        self.validation_dir = self.test_dir / "validation"
        self.validation_dir.mkdir(exist_ok=True)
        
        self.anthropic_key = anthropic_key or os.getenv('ANTHROPIC_API_KEY')
        
        if not self.anthropic_key:
            print("⚠️  No Anthropic API key provided")
            print("POD-claim scoring will be skipped")
            print("Set --anthropic-key or ANTHROPIC_API_KEY env var")
    
    def load_results(self):
        """Load all API results"""
        results = {}
        
        result_files = list(self.results_dir.glob("*-result.json"))
        
        for result_file in result_files:
            with open(result_file, 'r') as f:
                result = json.load(f)
                patent_num = result['patent_number']
                results[patent_num] = result
        
        print(f"✓ Loaded {len(results)} API results")
        return results
    
    def load_ground_truth(self, patent_num):
        """Load ground truth for patent"""
        gt_path = self.ground_truth_dir / f"{patent_num}-ground-truth.json"
        
        if not gt_path.exists():
            return None
        
        with open(gt_path, 'r') as f:
            return json.load(f)
    
    def validate_cpc(self, result, ground_truth):
        """Compare CPC predictions to ground truth"""
        classify = result.get('classify_response', {})
        
        predicted_primary = classify.get('primaryCpc', '')
        predicted_all = [p['code'] for p in classify.get('cpcPredictions', [])]
        
        gt_primary = ground_truth['ground_truth_cpc']['primary']
        gt_all = [c['code'] for c in ground_truth['ground_truth_cpc']['all_codes']]
        
        validation = {
            'ground_truth_primary': gt_primary,
            'predicted_primary': predicted_primary,
            'primary_match': predicted_primary == gt_primary,
            'primary_match_normalized': self.normalize_cpc(predicted_primary) == self.normalize_cpc(gt_primary),
            'top3_contains_primary': gt_primary in predicted_all[:3],
            'predicted_all': predicted_all,
            'ground_truth_all': gt_all
        }
        
        return validation
    
    def normalize_cpc(self, code):
        """Normalize CPC code for comparison (remove spaces)"""
        return code.replace(' ', '').strip()
    
    def score_pod_claim_coverage(self, pods, claims):
        """Use Claude API to score POD-claim coverage"""
        if not self.anthropic_key:
            return None
        
        try:
            prompt = f"""You are a patent attorney evaluating whether extracted Points of Distinction (PODs) adequately cover the key elements of patent claims.

EXTRACTED PODs:
{json.dumps([p['pod_text'] for p in pods], indent=2)}

PATENT CLAIMS:
{json.dumps(claims[:5], indent=2)}  # First 5 claims

TASK: Score how well the PODs capture the key inventive concepts from the claims.

Return ONLY a JSON object (no markdown):
{{
  "coverage_score": 0-100,
  "rationale": "brief explanation",
  "missing_elements": ["list", "of", "missing", "concepts"]
}}"""

            response = requests.post(
                'https://api.anthropic.com/v1/messages',
                headers={
                    'x-api-key': self.anthropic_key,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                json={
                    'model': 'claude-sonnet-4-20250514',
                    'max_tokens': 500,
                    'messages': [{'role': 'user', 'content': prompt}]
                },
                timeout=30
            )
            
            if response.status_code != 200:
                return None
            
            content = response.json()['content'][0]['text']
            
            # Parse JSON from response
            content = content.strip()
            if content.startswith('```'):
                content = content.split('```')[1]
                if content.startswith('json'):
                    content = content[4:]
            
            score_data = json.loads(content)
            return score_data
            
        except Exception as e:
            print(f"  ⚠️  POD scoring error: {e}")
            return None
    
    def validate_patent(self, patent_num, result, ground_truth):
        """Validate single patent"""
        validation = {
            'patent_number': patent_num,
            'cpc_validation': self.validate_cpc(result, ground_truth)
        }
        
        # POD-claim scoring
        classify = result.get('classify_response', {})
        pods = classify.get('pods', [])
        claims = ground_truth['ground_truth_claims']['all_claims']
        
        if self.anthropic_key and pods and claims:
            pod_score = self.score_pod_claim_coverage(pods, claims)
            validation['pod_claim_coverage'] = pod_score
        else:
            validation['pod_claim_coverage'] = None
        
        return validation
    
    def validate_all(self, results):
        """Validate all results"""
        validations = []
        errors = []
        
        # CPC statistics
        primary_matches = 0
        top3_matches = 0
        total = 0
        
        # By technology area
        by_area = defaultdict(lambda: {'total': 0, 'primary_match': 0, 'top3_match': 0})
        
        print("\nValidating results...")
        
        for patent_num, result in results.items():
            if 'error' in result:
                errors.append({'patent': patent_num, 'error': result['error']})
                continue
            
            ground_truth = self.load_ground_truth(patent_num)
            if not ground_truth:
                errors.append({'patent': patent_num, 'error': 'Ground truth not found'})
                continue
            
            validation = self.validate_patent(patent_num, result, ground_truth)
            validations.append(validation)
            
            # Update statistics
            cpc_val = validation['cpc_validation']
            if cpc_val['primary_match'] or cpc_val['primary_match_normalized']:
                primary_matches += 1
            if cpc_val['top3_contains_primary']:
                top3_matches += 1
            total += 1
            
            # Technology area stats
            gt_primary = cpc_val['ground_truth_primary']
            area = self.get_tech_area(gt_primary)
            by_area[area]['total'] += 1
            if cpc_val['primary_match'] or cpc_val['primary_match_normalized']:
                by_area[area]['primary_match'] += 1
            if cpc_val['top3_contains_primary']:
                by_area[area]['top3_match'] += 1
            
            if len(validations) % 50 == 0:
                print(f"  Validated {len(validations)} patents...")
        
        # Calculate POD coverage average
        pod_scores = [v['pod_claim_coverage']['coverage_score'] 
                     for v in validations 
                     if v.get('pod_claim_coverage') and 'coverage_score' in v['pod_claim_coverage']]
        avg_pod_score = sum(pod_scores) / len(pod_scores) if pod_scores else None
        
        # Calculate by-area accuracy
        area_stats = {}
        for area, stats in by_area.items():
            if stats['total'] > 0:
                area_stats[area] = {
                    'total': stats['total'],
                    'primary_accuracy': stats['primary_match'] / stats['total'],
                    'top3_accuracy': stats['top3_match'] / stats['total']
                }
        
        # Compile results
        summary = {
            'test_metadata': {
                'total_tested': total,
                'errors': len(errors)
            },
            'cpc_accuracy': {
                'primary_match_rate': primary_matches / total if total > 0 else 0,
                'top3_match_rate': top3_matches / total if total > 0 else 0,
                'primary_matches': primary_matches,
                'top3_matches': top3_matches
            },
            'pod_claim_coverage': {
                'average_score': avg_pod_score,
                'scored_patents': len(pod_scores)
            },
            'by_technology_area': area_stats,
            'detailed_validations': validations,
            'errors': errors
        }
        
        # Save results
        results_path = self.validation_dir / "validation_results.json"
        with open(results_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\n✓ Validation complete: {results_path}")
        
        return summary
    
    def get_tech_area(self, cpc_code):
        """Determine technology area from CPC code"""
        if not cpc_code:
            return 'Unknown'
        
        prefix = cpc_code[:3]
        areas = {
            'A61': 'Medical',
            'A63': 'Sports',
            'B60': 'Vehicles',
            'B62': 'Vehicles',
            'C07': 'Chemistry',
            'C12': 'Biotech',
            'E05': 'Mechanical',
            'F16': 'Mechanical',
            'G06': 'Software',
            'G16': 'Software',
            'H01': 'Electrical',
            'H04': 'Communication'
        }
        return areas.get(prefix, 'Other')
    
    def print_summary(self, summary):
        """Print validation summary"""
        print("\n" + "=" * 60)
        print("VALIDATION RESULTS")
        print("=" * 60)
        
        print(f"\nTotal Tested: {summary['test_metadata']['total_tested']}")
        print(f"Errors: {summary['test_metadata']['errors']}")
        
        cpc = summary['cpc_accuracy']
        print(f"\nCPC Classification Accuracy:")
        print(f"  Primary Match: {cpc['primary_match_rate']:.1%} ({cpc['primary_matches']}/{summary['test_metadata']['total_tested']})")
        print(f"  Top-3 Match: {cpc['top3_match_rate']:.1%} ({cpc['top3_matches']}/{summary['test_metadata']['total_tested']})")
        
        if summary['pod_claim_coverage']['average_score']:
            pod = summary['pod_claim_coverage']
            print(f"\nPOD-Claim Coverage:")
            print(f"  Average Score: {pod['average_score']:.1f}/100")
            print(f"  Scored Patents: {pod['scored_patents']}")
        
        if summary['by_technology_area']:
            print(f"\nBy Technology Area:")
            for area, stats in sorted(summary['by_technology_area'].items()):
                print(f"  {area}: {stats['primary_accuracy']:.1%} primary, {stats['top3_accuracy']:.1%} top-3 ({stats['total']} patents)")

def main():
    parser = argparse.ArgumentParser(description='Validate Trogon Hunt results')
    parser.add_argument('--dir', default='test_patents', help='Test directory')
    parser.add_argument('--anthropic-key', help='Anthropic API key (or set ANTHROPIC_API_KEY)')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Trogon Hunt Validation")
    print("=" * 60)
    
    validator = TrogonValidator(args.dir, args.anthropic_key)
    
    results = validator.load_results()
    summary = validator.validate_all(results)
    validator.print_summary(summary)
    
    print("\n✓ Complete!")

if __name__ == '__main__':
    main()
