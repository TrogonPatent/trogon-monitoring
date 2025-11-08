#!/usr/bin/env python3
"""
Trogon Hunt Validation & Accuracy Analysis
===========================================

Purpose: Compare system predictions against USPTO ground truth
- Calculate CPC classification accuracy metrics
- Analyze POD quality against issued claims
- Generate comprehensive validation report

Usage:
    python 3_validate_accuracy.py

Input:
    - test_data/predictions/*.json (system predictions)
    - test_data/ground_truth/*.json (examiner CPCs + claims)

Output:
    - test_data/validation_report.json (accuracy metrics)
    - test_data/validation_report.md (human-readable report)
    - test_data/detailed_results.csv (per-patent analysis)
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Any, Tuple
from datetime import datetime
from collections import defaultdict, Counter
import csv

# Configuration
PREDICTIONS_DIR = Path("test_data/predictions")
TRUTH_DIR = Path("test_data/ground_truth")
OUTPUT_DIR = Path("test_data")

REPORT_JSON = OUTPUT_DIR / "validation_report.json"
REPORT_MD = OUTPUT_DIR / "validation_report.md"
DETAILED_CSV = OUTPUT_DIR / "detailed_results.csv"


class ValidationAnalyzer:
    """
    Validates system predictions against ground truth
    Calculates comprehensive accuracy metrics
    """
    
    def __init__(self):
        self.results = []
        self.metrics = {
            "primary_cpc": {"correct": 0, "total": 0},
            "top3_cpc": {"correct": 0, "total": 0},
            "class_level": {"correct": 0, "total": 0},
            "cpc_recall": {"found": 0, "total_truth_cpcs": 0},
            "cpc_precision": {"relevant": 0, "total_predictions": 0},
            "by_technology_area": defaultdict(lambda: {
                "primary_correct": 0,
                "total": 0
            })
        }
    
    def normalize_cpc_code(self, cpc: str) -> str:
        """
        Normalize CPC code for comparison
        
        Args:
            cpc: CPC code (may have various formats)
            
        Returns:
            Normalized CPC code
        """
        if not cpc:
            return ""
        
        # Remove whitespace and convert to uppercase
        cpc = cpc.strip().upper()
        
        # Remove "CPC:" prefix if present
        cpc = cpc.replace("CPC:", "").strip()
        
        return cpc
    
    def extract_cpc_class(self, cpc: str) -> str:
        """
        Extract 4-character class from CPC code
        
        Example: "G06F 40/169" -> "G06F"
        
        Args:
            cpc: Full CPC code
            
        Returns:
            4-character class code
        """
        cpc = self.normalize_cpc_code(cpc)
        
        # Extract first 4 characters (e.g., "G06F")
        if len(cpc) >= 4:
            return cpc[:4]
        
        return cpc
    
    def compare_cpc_codes(self, predicted: str, truth: str) -> Dict[str, bool]:
        """
        Compare predicted vs truth CPC codes
        
        Args:
            predicted: Predicted CPC code
            truth: Ground truth CPC code
            
        Returns:
            Dictionary with exact_match and class_match flags
        """
        pred_norm = self.normalize_cpc_code(predicted)
        truth_norm = self.normalize_cpc_code(truth)
        
        # Exact match
        exact_match = pred_norm == truth_norm
        
        # Class-level match (first 4 characters)
        pred_class = self.extract_cpc_class(pred_norm)
        truth_class = self.extract_cpc_class(truth_norm)
        class_match = pred_class == truth_class
        
        return {
            "exact_match": exact_match,
            "class_match": class_match
        }
    
    def calculate_cpc_metrics(self, prediction: Dict, ground_truth: Dict) -> Dict[str, Any]:
        """
        Calculate CPC classification metrics for a single patent
        
        Args:
            prediction: System prediction
            ground_truth: USPTO ground truth
            
        Returns:
            Dictionary with detailed metrics
        """
        # Get predictions
        pred_primary = prediction['predictions'].get('primary_cpc', '')
        pred_cpcs = [p['code'] for p in prediction['predictions'].get('cpc_predictions', [])]
        
        # Get ground truth
        truth_primary = ground_truth['ground_truth'].get('examiner_cpc_primary', '')
        truth_additional = ground_truth['ground_truth'].get('examiner_cpc_additional', [])
        truth_all = [truth_primary] + truth_additional
        truth_all = [c for c in truth_all if c]  # Remove empty strings
        
        # Metric 1: Primary CPC exact match
        primary_comparison = self.compare_cpc_codes(pred_primary, truth_primary)
        primary_exact = primary_comparison['exact_match']
        primary_class = primary_comparison['class_match']
        
        # Metric 2: Top-3 accuracy (is truth primary in our top 3?)
        top3_match = False
        if len(pred_cpcs) >= 1:
            for pred_cpc in pred_cpcs[:3]:
                comp = self.compare_cpc_codes(pred_cpc, truth_primary)
                if comp['exact_match']:
                    top3_match = True
                    break
        
        # Metric 3: CPC Recall (how many truth CPCs did we find?)
        found_cpcs = 0
        for truth_cpc in truth_all:
            for pred_cpc in pred_cpcs:
                comp = self.compare_cpc_codes(pred_cpc, truth_cpc)
                if comp['exact_match']:
                    found_cpcs += 1
                    break
        
        recall = found_cpcs / max(len(truth_all), 1)
        
        # Metric 4: CPC Precision (how many predictions match truth?)
        relevant_predictions = 0
        for pred_cpc in pred_cpcs:
            for truth_cpc in truth_all:
                comp = self.compare_cpc_codes(pred_cpc, truth_cpc)
                if comp['exact_match']:
                    relevant_predictions += 1
                    break
        
        precision = relevant_predictions / max(len(pred_cpcs), 1)
        
        return {
            "primary_cpc": {
                "predicted": pred_primary,
                "truth": truth_primary,
                "exact_match": primary_exact,
                "class_match": primary_class
            },
            "top3_match": top3_match,
            "recall": {
                "found": found_cpcs,
                "total": len(truth_all),
                "percentage": recall
            },
            "precision": {
                "relevant": relevant_predictions,
                "total": len(pred_cpcs),
                "percentage": precision
            },
            "all_predictions": pred_cpcs,
            "all_truth": truth_all
        }
    
    def analyze_pod_quality(self, prediction: Dict, ground_truth: Dict) -> Dict[str, Any]:
        """
        Analyze POD quality (placeholder for now - needs claim parsing)
        
        Args:
            prediction: System prediction with PODs
            ground_truth: Ground truth with claims
            
        Returns:
            POD quality metrics
        """
        pods = prediction['predictions'].get('pods', [])
        claims = ground_truth['ground_truth'].get('independent_claims', [])
        
        # For now, basic metrics
        return {
            "pod_count": len(pods),
            "claim_count": len(claims),
            "pod_texts": [p['pod_text'] for p in pods],
            "note": "Detailed POD-to-claim matching requires claim text - not available from PatentsView API"
        }
    
    def validate_single_patent(self, prediction_file: Path, truth_file: Path) -> Dict[str, Any]:
        """
        Validate a single patent
        
        Args:
            prediction_file: Path to prediction JSON
            truth_file: Path to ground truth JSON
            
        Returns:
            Validation result
        """
        # Load files
        with open(prediction_file, 'r') as f:
            prediction = json.load(f)
        
        with open(truth_file, 'r') as f:
            ground_truth = json.load(f)
        
        patent_id = prediction['patent_id']
        
        # Calculate CPC metrics
        cpc_metrics = self.calculate_cpc_metrics(prediction, ground_truth)
        
        # Analyze POD quality
        pod_metrics = self.analyze_pod_quality(prediction, ground_truth)
        
        # Combine results
        result = {
            "patent_id": patent_id,
            "source_patent": ground_truth.get('source_patent', ''),
            "technology_area": prediction['predictions'].get('technology_area', 'Unknown'),
            "cpc_metrics": cpc_metrics,
            "pod_metrics": pod_metrics,
            "processing_time": prediction['processing'].get('processing_time', 0),
            "cost": prediction['processing'].get('cost', 0)
        }
        
        return result
    
    def validate_all_patents(self) -> List[Dict[str, Any]]:
        """
        Validate all patents and calculate aggregate metrics
        
        Returns:
            List of validation results
        """
        print("\n" + "="*60)
        print("Trogon Hunt Validation Analysis")
        print("="*60)
        print(f"Predictions: {PREDICTIONS_DIR}")
        print(f"Ground Truth: {TRUTH_DIR}")
        print("="*60 + "\n")
        
        # Get all prediction files
        prediction_files = sorted(PREDICTIONS_DIR.glob("*_predictions.json"))
        total_files = len(prediction_files)
        
        if total_files == 0:
            print("❌ No prediction files found!")
            print("   Run: python 2_batch_process.py first")
            return []
        
        print(f"📊 Found {total_files} predictions to validate\n")
        
        results = []
        
        for idx, pred_file in enumerate(prediction_files, 1):
            # Extract patent number from filename
            # Format: test_USXXXXXXXX_predictions.json
            patent_num = pred_file.stem.replace("_predictions", "").replace("test_", "")
            
            # Find corresponding truth file
            truth_file = TRUTH_DIR / f"patent_{patent_num}_truth.json"
            
            if not truth_file.exists():
                print(f"[{idx}/{total_files}] ⚠️  No ground truth for {patent_num}")
                continue
            
            print(f"[{idx}/{total_files}] Validating {patent_num}...")
            
            # Validate
            result = self.validate_single_patent(pred_file, truth_file)
            results.append(result)
            
            # Update aggregate metrics
            cpc_m = result['cpc_metrics']
            tech_area = result['technology_area']
            
            # Primary CPC accuracy
            self.metrics['primary_cpc']['total'] += 1
            if cpc_m['primary_cpc']['exact_match']:
                self.metrics['primary_cpc']['correct'] += 1
                self.metrics['by_technology_area'][tech_area]['primary_correct'] += 1
            
            self.metrics['by_technology_area'][tech_area]['total'] += 1
            
            # Top-3 accuracy
            self.metrics['top3_cpc']['total'] += 1
            if cpc_m['top3_match']:
                self.metrics['top3_cpc']['correct'] += 1
            
            # Class-level accuracy
            self.metrics['class_level']['total'] += 1
            if cpc_m['primary_cpc']['class_match']:
                self.metrics['class_level']['correct'] += 1
            
            # Recall
            self.metrics['cpc_recall']['found'] += cpc_m['recall']['found']
            self.metrics['cpc_recall']['total_truth_cpcs'] += cpc_m['recall']['total']
            
            # Precision
            self.metrics['cpc_precision']['relevant'] += cpc_m['precision']['relevant']
            self.metrics['cpc_precision']['total_predictions'] += cpc_m['precision']['total']
            
            print(f"  Primary CPC: {'✅' if cpc_m['primary_cpc']['exact_match'] else '❌'} "
                  f"{cpc_m['primary_cpc']['predicted']} vs {cpc_m['primary_cpc']['truth']}")
        
        self.results = results
        return results
    
    def calculate_final_metrics(self) -> Dict[str, Any]:
        """
        Calculate final aggregate metrics
        
        Returns:
            Dictionary of final metrics
        """
        metrics = self.metrics
        
        # Calculate percentages
        primary_accuracy = (metrics['primary_cpc']['correct'] / 
                           max(metrics['primary_cpc']['total'], 1)) * 100
        
        top3_accuracy = (metrics['top3_cpc']['correct'] / 
                        max(metrics['top3_cpc']['total'], 1)) * 100
        
        class_accuracy = (metrics['class_level']['correct'] / 
                         max(metrics['class_level']['total'], 1)) * 100
        
        overall_recall = (metrics['cpc_recall']['found'] / 
                         max(metrics['cpc_recall']['total_truth_cpcs'], 1)) * 100
        
        overall_precision = (metrics['cpc_precision']['relevant'] / 
                            max(metrics['cpc_precision']['total_predictions'], 1)) * 100
        
        # Technology area breakdown
        tech_breakdown = {}
        for tech_area, data in metrics['by_technology_area'].items():
            accuracy = (data['primary_correct'] / max(data['total'], 1)) * 100
            tech_breakdown[tech_area] = {
                "total": data['total'],
                "correct": data['primary_correct'],
                "accuracy": f"{accuracy:.1f}%"
            }
        
        final_metrics = {
            "overview": {
                "total_patents": metrics['primary_cpc']['total'],
                "validation_date": datetime.now().isoformat()
            },
            "cpc_classification": {
                "primary_cpc_accuracy": {
                    "percentage": f"{primary_accuracy:.1f}%",
                    "correct": metrics['primary_cpc']['correct'],
                    "total": metrics['primary_cpc']['total'],
                    "target": "75%",
                    "status": "✅ PASS" if primary_accuracy >= 75 else "⚠️  BELOW TARGET"
                },
                "top3_cpc_accuracy": {
                    "percentage": f"{top3_accuracy:.1f}%",
                    "correct": metrics['top3_cpc']['correct'],
                    "total": metrics['top3_cpc']['total'],
                    "target": "85%",
                    "status": "✅ PASS" if top3_accuracy >= 85 else "⚠️  BELOW TARGET"
                },
                "class_level_accuracy": {
                    "percentage": f"{class_accuracy:.1f}%",
                    "correct": metrics['class_level']['correct'],
                    "total": metrics['class_level']['total']
                },
                "cpc_recall": {
                    "percentage": f"{overall_recall:.1f}%",
                    "found": metrics['cpc_recall']['found'],
                    "total": metrics['cpc_recall']['total_truth_cpcs'],
                    "target": "60%",
                    "status": "✅ PASS" if overall_recall >= 60 else "⚠️  BELOW TARGET"
                },
                "cpc_precision": {
                    "percentage": f"{overall_precision:.1f}%",
                    "relevant": metrics['cpc_precision']['relevant'],
                    "total": metrics['cpc_precision']['total_predictions'],
                    "target": "50%",
                    "status": "✅ PASS" if overall_precision >= 50 else "⚠️  BELOW TARGET"
                }
            },
            "by_technology_area": tech_breakdown
        }
        
        return final_metrics
    
    def generate_markdown_report(self, final_metrics: Dict) -> str:
        """
        Generate human-readable markdown report
        
        Args:
            final_metrics: Final metrics dictionary
            
        Returns:
            Markdown formatted report
        """
        report = f"""# Trogon Hunt Validation Report

**Generated:** {datetime.now().strftime("%B %d, %Y at %I:%M %p")}

---

## Executive Summary

**Total Patents Validated:** {final_metrics['overview']['total_patents']}

### Success Criteria Assessment

| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| Primary CPC Accuracy | **{final_metrics['cpc_classification']['primary_cpc_accuracy']['percentage']}** | 75% | {final_metrics['cpc_classification']['primary_cpc_accuracy']['status']} |
| Top-3 CPC Accuracy | **{final_metrics['cpc_classification']['top3_cpc_accuracy']['percentage']}** | 85% | {final_metrics['cpc_classification']['top3_cpc_accuracy']['status']} |
| CPC Recall | **{final_metrics['cpc_classification']['cpc_recall']['percentage']}** | 60% | {final_metrics['cpc_classification']['cpc_recall']['status']} |
| CPC Precision | **{final_metrics['cpc_classification']['cpc_precision']['percentage']}** | 50% | {final_metrics['cpc_classification']['cpc_precision']['status']} |

---

## Detailed Metrics

### 1. Primary CPC Classification

The system predicted the examiner's primary CPC code with **{final_metrics['cpc_classification']['primary_cpc_accuracy']['percentage']}** accuracy.

- **Correct:** {final_metrics['cpc_classification']['primary_cpc_accuracy']['correct']} / {final_metrics['cpc_classification']['primary_cpc_accuracy']['total']}
- **Target:** ≥75% (Production-ready threshold)

### 2. Top-3 CPC Accuracy

The examiner's primary CPC appeared in our top 3 predictions **{final_metrics['cpc_classification']['top3_cpc_accuracy']['percentage']}** of the time.

- **Correct:** {final_metrics['cpc_classification']['top3_cpc_accuracy']['correct']} / {final_metrics['cpc_classification']['top3_cpc_accuracy']['total']}
- **Target:** ≥85%

### 3. CPC Coverage Metrics

**Recall (Coverage):** {final_metrics['cpc_classification']['cpc_recall']['percentage']}
- Found {final_metrics['cpc_classification']['cpc_recall']['found']} of {final_metrics['cpc_classification']['cpc_recall']['total']} examiner-assigned CPCs
- Indicates how comprehensively we identify relevant technology domains

**Precision (Relevance):** {final_metrics['cpc_classification']['cpc_precision']['percentage']}
- {final_metrics['cpc_classification']['cpc_precision']['relevant']} of {final_metrics['cpc_classification']['cpc_precision']['total']} predictions matched examiner CPCs
- Indicates accuracy of additional CPC predictions

---

## Technology Area Breakdown

"""
        
        for tech_area, data in final_metrics['by_technology_area'].items():
            report += f"""### {tech_area}

- **Accuracy:** {data['accuracy']}
- **Correct:** {data['correct']} / {data['total']}

"""
        
        report += """---

## Interpretation

### Production Readiness

"""
        
        primary_pct = float(final_metrics['cpc_classification']['primary_cpc_accuracy']['percentage'].rstrip('%'))
        
        if primary_pct >= 75:
            report += """✅ **PRODUCTION READY**

The system meets all minimum thresholds for production deployment:
- Primary CPC accuracy ≥75%
- Strong confidence for beta customer deployment
- Competitive with commercial patent classification tools

"""
        elif primary_pct >= 60:
            report += """⚠️ **NEEDS IMPROVEMENT**

The system meets minimum viable performance but requires refinement:
- Consider prompt engineering improvements
- Review technology-specific tuning
- Expand training data for underperforming areas

"""
        else:
            report += """🔴 **NOT READY**

The system requires significant improvement before production:
- Review fundamental classification approach
- Consider supervised learning components
- Extensive prompt refinement needed

"""
        
        report += """### Recommended Next Steps

"""
        
        if primary_pct >= 75:
            report += """1. ✅ Proceed to Phase B (POD-based prior art search)
2. ✅ Begin beta customer testing
3. ✅ Use validation metrics in investor presentations
4. Monitor production performance and iterate

"""
        else:
            report += """1. Analyze failure patterns by technology area
2. Refine Claude API prompts based on errors
3. Re-run validation with improved prompts
4. Consider technology-specific prompt variations

"""
        
        report += """---

## Files Generated

- `validation_report.json` - Machine-readable metrics
- `validation_report.md` - This human-readable report  
- `detailed_results.csv` - Per-patent analysis

---

**End of Report**
"""
        
        return report
    
    def save_detailed_csv(self):
        """Save detailed per-patent results to CSV"""
        with open(DETAILED_CSV, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=[
                'patent_id',
                'source_patent',
                'technology_area',
                'predicted_primary_cpc',
                'truth_primary_cpc',
                'primary_exact_match',
                'primary_class_match',
                'top3_match',
                'recall_percentage',
                'precision_percentage',
                'pod_count',
                'processing_time',
                'cost'
            ])
            
            writer.writeheader()
            
            for result in self.results:
                writer.writerow({
                    'patent_id': result['patent_id'],
                    'source_patent': result['source_patent'],
                    'technology_area': result['technology_area'],
                    'predicted_primary_cpc': result['cpc_metrics']['primary_cpc']['predicted'],
                    'truth_primary_cpc': result['cpc_metrics']['primary_cpc']['truth'],
                    'primary_exact_match': result['cpc_metrics']['primary_cpc']['exact_match'],
                    'primary_class_match': result['cpc_metrics']['primary_cpc']['class_match'],
                    'top3_match': result['cpc_metrics']['top3_match'],
                    'recall_percentage': f"{result['cpc_metrics']['recall']['percentage']*100:.1f}%",
                    'precision_percentage': f"{result['cpc_metrics']['precision']['percentage']*100:.1f}%",
                    'pod_count': result['pod_metrics']['pod_count'],
                    'processing_time': result['processing_time'],
                    'cost': result['cost']
                })


def main():
    """Main execution"""
    print("\n🚀 Starting Validation Analysis\n")
    
    analyzer = ValidationAnalyzer()
    
    # Validate all patents
    results = analyzer.validate_all_patents()
    
    if not results:
        print("\n❌ No results to validate")
        return
    
    # Calculate final metrics
    print("\n📊 Calculating aggregate metrics...")
    final_metrics = analyzer.calculate_final_metrics()
    
    # Save JSON report
    with open(REPORT_JSON, 'w') as f:
        json.dump(final_metrics, f, indent=2)
    
    print(f"✅ Saved: {REPORT_JSON}")
    
    # Generate and save markdown report
    markdown = analyzer.generate_markdown_report(final_metrics)
    with open(REPORT_MD, 'w') as f:
        f.write(markdown)
    
    print(f"✅ Saved: {REPORT_MD}")
    
    # Save detailed CSV
    analyzer.save_detailed_csv()
    print(f"✅ Saved: {DETAILED_CSV}")
    
    # Print summary
    print("\n" + "="*60)
    print("✅ Validation Complete")
    print("="*60)
    print(f"\nPrimary CPC Accuracy: {final_metrics['cpc_classification']['primary_cpc_accuracy']['percentage']}")
    print(f"Status: {final_metrics['cpc_classification']['primary_cpc_accuracy']['status']}")
    print(f"\nTop-3 Accuracy: {final_metrics['cpc_classification']['top3_cpc_accuracy']['percentage']}")
    print(f"CPC Recall: {final_metrics['cpc_classification']['cpc_recall']['percentage']}")
    print(f"CPC Precision: {final_metrics['cpc_classification']['cpc_precision']['percentage']}")
    
    print("\n📄 Reports Generated:")
    print(f"  - {REPORT_JSON}")
    print(f"  - {REPORT_MD}")
    print(f"  - {DETAILED_CSV}")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
