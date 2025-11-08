"""
Automated Detailed POD vs. Claims Analysis

Uses Claude API to perform qualitative assessment of POD quality
by comparing extracted PODs to actual patent claims.

Usage:
python detailed_pod_analysis.py --dir test_patents --anthropic-key YOUR_KEY --output analysis.md
"""

import os
import sys
import json
import argparse
from pathlib import Path
import requests
import time

class DetailedPODAnalyzer:
    def __init__(self, test_dir, anthropic_key, output_file):
        self.test_dir = Path(test_dir)
        self.ground_truth_dir = self.test_dir / "ground_truth"
        self.results_dir = self.test_dir / "api_results"
        self.anthropic_key = anthropic_key
        self.output_file = output_file
        
        self.analyses = []
        self.stats = {
            'excellent': 0,
            'partial': 0,
            'poor': 0
        }
    
    def analyze_all(self):
        """Analyze all patents"""
        result_files = list(self.results_dir.glob("*-result.json"))
        
        print(f"Analyzing {len(result_files)} patents...")
        
        for i, result_file in enumerate(result_files, 1):
            patent_num = result_file.stem.replace('-result', '')
            
            print(f"\n[{i}/{len(result_files)}] Analyzing {patent_num}...")
            
            analysis = self.analyze_patent(patent_num)
            if analysis:
                self.analyses.append(analysis)
                
                # Update stats
                if analysis['score'] >= 70:
                    self.stats['excellent'] += 1
                elif analysis['score'] >= 50:
                    self.stats['partial'] += 1
                else:
                    self.stats['poor'] += 1
            
            # Rate limiting
            if i < len(result_files):
                time.sleep(2)
        
        # Generate report
        self.generate_report()
    
    def analyze_patent(self, patent_num):
        """Analyze single patent using Claude API"""
        # Load ground truth
        gt_path = self.ground_truth_dir / f"{patent_num}-ground-truth.json"
        if not gt_path.exists():
            print(f"  ⚠️  Ground truth not found")
            return None
        
        with open(gt_path, 'r') as f:
            ground_truth = json.load(f)
        
        # Load API results
        result_path = self.results_dir / f"{patent_num}-result.json"
        if not result_path.exists():
            print(f"  ⚠️  API results not found")
            return None
        
        with open(result_path, 'r') as f:
            api_result = json.load(f)
        
        # Extract data
        title = ground_truth['title']
        claims = ground_truth['ground_truth_claims']['all_claims']
        
        if 'classify_response' not in api_result:
            print(f"  ⚠️  No classification response")
            return None
        
        pods = api_result['classify_response'].get('pods', [])
        
        if not claims or not pods:
            print(f"  ⚠️  Missing claims or PODs")
            return None
        
        # Get independent claims (or first claim if none marked)
        independent_claims = ground_truth['ground_truth_claims'].get('independent_claims', [])
        if not independent_claims:
            independent_claims = [claims[0]]
        
        # Call Claude for detailed analysis
        try:
            analysis = self.call_claude_for_analysis(title, pods, independent_claims[0])
            
            return {
                'patent_number': patent_num,
                'title': title,
                'pods': [p.get('pod_text', '') for p in pods],
                'claim_1': independent_claims[0][:500] + '...' if len(independent_claims[0]) > 500 else independent_claims[0],
                **analysis
            }
        
        except Exception as e:
            print(f"  ✗ Analysis failed: {e}")
            return None
    
    def call_claude_for_analysis(self, title, pods, claim_1):
        """Call Claude API for detailed POD vs. Claim analysis"""
        
        pod_texts = [p.get('pod_text', '') for p in pods]
        
        prompt = f"""You are a patent attorney evaluating whether extracted Points of Distinction (PODs) adequately capture the patentable subject matter claimed in a patent.

PATENT TITLE: {title}

EXTRACTED PODs (from specification, WITHOUT seeing claims):
{json.dumps(pod_texts, indent=2)}

ACTUAL CLAIM 1 (what was actually patented):
{claim_1}

TASK: Evaluate how well the PODs captured the claimed invention.

ANALYSIS FRAMEWORK:
1. **What's the core novelty in Claim 1?** (in 1-2 sentences)
2. **Did the PODs capture this core novelty?** (yes/partial/no)
3. **What specific elements from Claim 1 are PRESENT in the PODs?**
4. **What specific elements from Claim 1 are MISSING from the PODs?**
5. **Overall Assessment:** Would these PODs help find relevant prior art?

SCORING RUBRIC:
- 80-100: PODs capture core novelty and key structural/functional elements
- 50-79: PODs capture general concept but miss important specifics
- 0-49: PODs miss core novelty or focus on wrong aspects

OUTPUT FORMAT (JSON only):
{{
  "core_novelty": "Brief description of what Claim 1 actually claims as novel",
  "pods_captured_core": "yes" | "partial" | "no",
  "elements_present": ["element 1", "element 2"],
  "elements_missing": ["missing element 1", "missing element 2"],
  "assessment": "1-2 sentence overall assessment",
  "would_help_search": "yes" | "maybe" | "no",
  "score": 0-100,
  "category": "excellent" | "partial" | "poor"
}}

OUTPUT ONLY VALID JSON - no markdown, no code blocks."""

        response = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'x-api-key': self.anthropic_key,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            json={
                'model': 'claude-sonnet-4-20250514',
                'max_tokens': 1000,
                'messages': [{'role': 'user', 'content': prompt}]
            },
            timeout=30
        )
        
        if response.status_code != 200:
            raise Exception(f"Claude API error: {response.status_code}")
        
        content = response.json()['content'][0]['text']
        
        # Strip markdown if present
        content = content.strip()
        if content.startswith('```'):
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:]
        
        return json.loads(content)
    
    def generate_report(self):
        """Generate markdown report"""
        total = len(self.analyses)
        
        report = f"""# Detailed POD vs. Claims Analysis Report

## Summary Statistics
- **Total Patents Analyzed:** {total}
- **Excellent Match (70-100):** {self.stats['excellent']} ({self.stats['excellent']/total*100:.1f}%)
- **Partial Match (50-69):** {self.stats['partial']} ({self.stats['partial']/total*100:.1f}%)
- **Poor Match (0-49):** {self.stats['poor']} ({self.stats['poor']/total*100:.1f}%)
- **Average Score:** {sum(a['score'] for a in self.analyses)/total:.1f}/100

---

## Detailed Patent-by-Patent Analysis

"""
        
        # Sort by score descending
        sorted_analyses = sorted(self.analyses, key=lambda x: x['score'], reverse=True)
        
        for analysis in sorted_analyses:
            category_emoji = {
                'excellent': '✅',
                'partial': '⚠️',
                'poor': '❌'
            }
            
            emoji = category_emoji.get(analysis['category'], '❓')
            
            report += f"""### {emoji} {analysis['patent_number']} - {analysis['title']}
**Score:** {analysis['score']}/100 | **Category:** {analysis['category'].upper()}

**Core Novelty in Claim 1:**
{analysis['core_novelty']}

**PODs Extracted:**
"""
            for i, pod in enumerate(analysis['pods'], 1):
                report += f"{i}. {pod}\n"
            
            report += f"""
**Elements Present in PODs:** {', '.join(analysis['elements_present']) if analysis['elements_present'] else 'None'}

**Elements Missing from PODs:** {', '.join(analysis['elements_missing']) if analysis['elements_missing'] else 'None'}

**Overall Assessment:**
{analysis['assessment']}

**Would Help Prior Art Search?** {analysis['would_help_search'].upper()}

**Claim 1 (excerpt):**
```
{analysis['claim_1']}
```

---

"""
        
        # Add patterns section
        report += """## Key Patterns Identified

### High-Scoring Patents (70+)
Common characteristics of PODs that scored well...

### Low-Scoring Patents (<50)
Common failure modes...

---

*Generated by automated POD analysis system*
*Date: """ + time.strftime('%Y-%m-%d') + "*\n"
        
        # Save report
        with open(self.output_file, 'w') as f:
            f.write(report)
        
        print(f"\n✓ Report saved: {self.output_file}")
        print(f"\nSummary:")
        print(f"  Excellent: {self.stats['excellent']}/{total}")
        print(f"  Partial: {self.stats['partial']}/{total}")
        print(f"  Poor: {self.stats['poor']}/{total}")

def main():
    parser = argparse.ArgumentParser(description='Detailed POD vs. Claims analysis')
    parser.add_argument('--dir', default='test_patents', help='Test directory')
    parser.add_argument('--anthropic-key', required=True, help='Anthropic API key')
    parser.add_argument('--output', default='detailed_pod_analysis.md', help='Output file')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Detailed POD vs. Claims Analysis")
    print("=" * 60)
    
    analyzer = DetailedPODAnalyzer(args.dir, args.anthropic_key, args.output)
    analyzer.analyze_all()
    
    print("\n✓ Complete!")

if __name__ == '__main__':
    main()
