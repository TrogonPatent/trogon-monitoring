#!/usr/bin/env python3
"""
USPTO Patent Data Collection Script
====================================

Purpose: Download 150 issued patents and prepare blind test data
- Removes claims and classifications from specifications
- Stores ground truth separately for validation
- Stratified sampling across 5 technology areas

Usage:
    python 1_collect_test_data.py

Output:
    - test_data/input/patent_XXX_input.json (blind specs - no claims/classifications)
    - test_data/ground_truth/patent_XXX_truth.json (examiner CPCs + claims)
    - test_data/metadata.json (sample statistics)
"""

import requests
import json
import time
import random
import re
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

# Configuration
OUTPUT_DIR = Path("test_data")
INPUT_DIR = OUTPUT_DIR / "input"
TRUTH_DIR = OUTPUT_DIR / "ground_truth"

# Create directories
INPUT_DIR.mkdir(parents=True, exist_ok=True)
TRUTH_DIR.mkdir(parents=True, exist_ok=True)

# Target sample distribution (30 patents each)
TECHNOLOGY_AREAS = {
    "Software/ML": {
        "cpc_classes": ["G06F", "G06N"],
        "target_count": 30,
        "description": "Primary market focus"
    },
    "Mechanical/Electrical": {
        "cpc_classes": ["F16", "H01", "H04"],
        "target_count": 30,
        "description": "Hardware accessories"
    },
    "Life Sciences": {
        "cpc_classes": ["A61K", "C07", "C12"],
        "target_count": 30,
        "description": "Potential expansion"
    },
    "Business Methods": {
        "cpc_classes": ["G06Q"],
        "target_count": 30,
        "description": "Mobile/software overlap"
    },
    "Chemistry": {
        "cpc_classes": ["C01", "C02", "C03", "C04", "C05", "C06", "C07", "C08", "C09"],
        "target_count": 30,
        "description": "Diversity testing"
    }
}

class USPTOPatentCollector:
    """Collects patents from USPTO PatentsView API"""
    
    BASE_URL = "https://api.patentsview.org/patents/query"
    
    def __init__(self):
        self.collected_patents = []
        self.failed_patents = []
        
    def search_patents_by_cpc(self, cpc_class: str, limit: int = 50) -> List[Dict]:
        """
        Search USPTO PatentsView API for patents by CPC class
        
        Args:
            cpc_class: CPC class code (e.g., "G06F")
            limit: Number of results to fetch
            
        Returns:
            List of patent dictionaries
        """
        print(f"  Searching for {cpc_class} patents...")
        
        # Build query for PatentsView API
        query = {
            "_and": [
                {"cpc_subgroup_id": {"_begins": cpc_class}},
                {"patent_date": {"_gte": "2020-01-01", "_lte": "2024-12-31"}},
                {"patent_type": "utility"}
            ]
        }
        
        fields = [
            "patent_number",
            "patent_title", 
            "patent_abstract",
            "patent_date",
            "cpc_subgroup_id",
            "cpc_group_id",
            "inventor_last_name",
            "assignee_organization"
        ]
        
        params = {
            "q": json.dumps(query),
            "f": json.dumps(fields),
            "o": json.dumps({"per_page": limit})
        }
        
        try:
            response = requests.get(self.BASE_URL, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            patents = data.get("patents", [])
            
            print(f"    Found {len(patents)} patents for {cpc_class}")
            return patents
            
        except Exception as e:
            print(f"    ERROR searching {cpc_class}: {e}")
            return []
    
    def fetch_full_patent_text(self, patent_number: str) -> Dict[str, Any]:
        """
        Fetch full patent text from USPTO
        
        Note: PatentsView doesn't provide full specification text.
        This is a placeholder - you'll need to use USPTO Bulk Data or Google Patents API
        
        For now, we'll simulate by using abstract as specification
        """
        # In production, you would:
        # 1. Use USPTO Bulk Data XML files
        # 2. Or use Google Patents API
        # 3. Or scrape USPTO.gov (not recommended)
        
        # For testing purposes, we'll use a mock specification
        return {
            "patent_number": patent_number,
            "full_text_available": False,
            "note": "Full text fetch requires USPTO Bulk Data or Google Patents API"
        }
    
    def extract_independent_claims(self, claims_text: str) -> List[Dict]:
        """
        Extract independent claims from claims section
        
        Args:
            claims_text: Full claims text
            
        Returns:
            List of independent claims with parsed limitations
        """
        if not claims_text:
            return []
        
        # Pattern: "1. A method/system/apparatus..."
        independent_claim_pattern = r'^\s*(\d+)\.\s+(A\s+(?:method|system|apparatus|device|computer|process)[^.]+(?:\.|;).*?)(?=^\s*\d+\.|$)'
        
        claims = re.findall(independent_claim_pattern, claims_text, re.MULTILINE | re.DOTALL)
        
        parsed_claims = []
        for claim_num, claim_text in claims:
            # Extract limitations (split by semicolons, colons, "wherein")
            limitations = re.split(r'[;:]|\bwherein\b', claim_text)
            limitations = [l.strip() for l in limitations if l.strip()]
            
            parsed_claims.append({
                "claim_number": int(claim_num),
                "claim_text": claim_text.strip(),
                "limitations": limitations[:10]  # First 10 limitations
            })
        
        return parsed_claims
    
    def prepare_blind_input(self, patent: Dict) -> Dict:
        """
        Create blind input file (no claims, no classifications)
        
        Args:
            patent: Full patent data
            
        Returns:
            Dictionary for input file
        """
        # For testing, we'll use abstract as "specification"
        # In production, use full specification text from USPTO
        specification_text = patent.get("patent_abstract", "")
        
        # Add title as first line (mimics provisional format)
        title = patent.get("patent_title", "")
        if title:
            specification_text = f"{title}\n\n{specification_text}"
        
        return {
            "patent_id": f"test_{patent['patent_number']}",
            "title": title,
            "specification_text": specification_text,
            "metadata": {
                "source_patent": patent["patent_number"],
                "technology_area": patent.get("technology_area", "Unknown"),
                "issue_date": patent.get("patent_date", "")
            }
        }
    
    def prepare_ground_truth(self, patent: Dict) -> Dict:
        """
        Create ground truth file (examiner CPCs + claims)
        
        Args:
            patent: Full patent data
            
        Returns:
            Dictionary for ground truth file
        """
        # Extract CPC codes
        cpc_codes = []
        if "cpc_subgroup_id" in patent:
            cpc_list = patent["cpc_subgroup_id"]
            if isinstance(cpc_list, list):
                cpc_codes = cpc_list
            elif isinstance(cpc_list, str):
                cpc_codes = [cpc_list]
        
        # Primary CPC is first one
        primary_cpc = cpc_codes[0] if cpc_codes else ""
        additional_cpcs = cpc_codes[1:] if len(cpc_codes) > 1 else []
        
        # NOTE: PatentsView doesn't provide claims text
        # In production, extract from USPTO XML or Google Patents
        independent_claims = []  # Placeholder
        
        return {
            "patent_id": f"test_{patent['patent_number']}",
            "source_patent": patent["patent_number"],
            "issue_date": patent.get("patent_date", ""),
            "ground_truth": {
                "examiner_cpc_primary": primary_cpc,
                "examiner_cpc_additional": additional_cpcs,
                "independent_claims": independent_claims,
                "assignee": patent.get("assignee_organization", ""),
                "inventors": patent.get("inventor_last_name", "")
            }
        }
    
    def collect_stratified_sample(self) -> Dict[str, Any]:
        """
        Collect 150 patents across 5 technology areas (30 each)
        
        Returns:
            Dictionary with collection statistics
        """
        print("\n" + "="*60)
        print("USPTO Patent Data Collection")
        print("="*60)
        print(f"Target: 150 patents (30 per technology area)")
        print(f"Date Range: 2020-2024")
        print(f"Patent Type: Utility patents only")
        print("="*60 + "\n")
        
        stats = {
            "start_time": datetime.now().isoformat(),
            "target_count": 150,
            "technology_areas": {}
        }
        
        total_collected = 0
        
        for tech_area, config in TECHNOLOGY_AREAS.items():
            print(f"\n📊 {tech_area} ({config['description']})")
            print(f"   Target: {config['target_count']} patents")
            print(f"   CPC Classes: {', '.join(config['cpc_classes'])}")
            
            area_patents = []
            
            # Collect from each CPC class
            for cpc_class in config['cpc_classes']:
                # Fetch patents
                patents = self.search_patents_by_cpc(cpc_class, limit=50)
                
                # Add technology area label
                for p in patents:
                    p['technology_area'] = tech_area
                
                area_patents.extend(patents)
                
                time.sleep(0.5)  # Rate limiting
            
            # Remove duplicates by patent number
            seen = set()
            unique_patents = []
            for p in area_patents:
                if p['patent_number'] not in seen:
                    seen.add(p['patent_number'])
                    unique_patents.append(p)
            
            # Random sample to hit target
            target = config['target_count']
            if len(unique_patents) >= target:
                sampled = random.sample(unique_patents, target)
            else:
                print(f"   ⚠️  WARNING: Only found {len(unique_patents)} unique patents (target: {target})")
                sampled = unique_patents
            
            # Process each patent
            for patent in sampled:
                patent_num = patent['patent_number']
                
                try:
                    # Create blind input
                    input_data = self.prepare_blind_input(patent)
                    input_file = INPUT_DIR / f"patent_{patent_num}_input.json"
                    with open(input_file, 'w') as f:
                        json.dump(input_data, f, indent=2)
                    
                    # Create ground truth
                    truth_data = self.prepare_ground_truth(patent)
                    truth_file = TRUTH_DIR / f"patent_{patent_num}_truth.json"
                    with open(truth_file, 'w') as f:
                        json.dump(truth_data, f, indent=2)
                    
                    self.collected_patents.append({
                        "patent_number": patent_num,
                        "technology_area": tech_area,
                        "primary_cpc": truth_data["ground_truth"]["examiner_cpc_primary"]
                    })
                    
                except Exception as e:
                    print(f"   ❌ Failed to process {patent_num}: {e}")
                    self.failed_patents.append({
                        "patent_number": patent_num,
                        "error": str(e)
                    })
            
            collected = len(sampled)
            total_collected += collected
            
            stats['technology_areas'][tech_area] = {
                "target": target,
                "collected": collected,
                "cpc_classes": config['cpc_classes'],
                "sample_patents": [p['patent_number'] for p in sampled[:5]]  # First 5 as examples
            }
            
            print(f"   ✅ Collected: {collected} patents")
        
        # Final statistics
        stats['end_time'] = datetime.now().isoformat()
        stats['total_collected'] = total_collected
        stats['total_failed'] = len(self.failed_patents)
        stats['success_rate'] = f"{(total_collected / 150) * 100:.1f}%"
        
        # Save metadata
        metadata_file = OUTPUT_DIR / "metadata.json"
        with open(metadata_file, 'w') as f:
            json.dump(stats, f, indent=2)
        
        print("\n" + "="*60)
        print("✅ Collection Complete")
        print("="*60)
        print(f"Total Collected: {total_collected} / 150")
        print(f"Success Rate: {stats['success_rate']}")
        print(f"Failed: {len(self.failed_patents)}")
        print(f"\nOutput Directories:")
        print(f"  Input Files:  {INPUT_DIR}")
        print(f"  Ground Truth: {TRUTH_DIR}")
        print(f"  Metadata:     {metadata_file}")
        print("="*60 + "\n")
        
        return stats


def main():
    """Main execution"""
    print("\n🚀 Starting USPTO Patent Collection\n")
    
    collector = USPTOPatentCollector()
    stats = collector.collect_stratified_sample()
    
    print("\n📊 Sample Distribution:")
    for tech_area, data in stats['technology_areas'].items():
        print(f"  {tech_area}: {data['collected']} / {data['target']}")
    
    if stats['total_failed'] > 0:
        print(f"\n⚠️  {stats['total_failed']} patents failed - check logs")
    
    print("\n✅ Data collection complete!")
    print("\nNext Steps:")
    print("  1. Review test_data/metadata.json for statistics")
    print("  2. Inspect sample files in test_data/input/")
    print("  3. Run: python 2_batch_process.py")
    print()


if __name__ == "__main__":
    main()
