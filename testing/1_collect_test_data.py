#!/usr/bin/env python3
"""
USPTO Patent Data Collection Script - V2 (Updated API)
======================================================

Updated to use PatentsView API v2
New endpoint: https://search.patentsview.org/api/v1/patent/

Purpose: Download 150 issued patents and prepare blind test data
- Removes claims and classifications from specifications
- Stores ground truth separately for validation
- Stratified sampling across 5 technology areas

Usage:
    python 1_collect_test_data_v2.py
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

# PatentsView API v2 endpoint
API_BASE = "https://search.patentsview.org/api/v1/patent/"

# Target sample distribution (reduce to 10 each for faster testing)
TECHNOLOGY_AREAS = {
    "Software/ML": {
        "cpc_classes": ["G06F", "G06N"],
        "target_count": 10,  # Reduced from 30
        "description": "Primary market focus"
    },
    "Mechanical/Electrical": {
        "cpc_classes": ["F16", "H01", "H04"],
        "target_count": 10,
        "description": "Hardware accessories"
    },
    "Life Sciences": {
        "cpc_classes": ["A61K", "C07", "C12"],
        "target_count": 10,
        "description": "Potential expansion"
    },
    "Business Methods": {
        "cpc_classes": ["G06Q"],
        "target_count": 10,
        "description": "Mobile/software overlap"
    },
    "Chemistry": {
        "cpc_classes": ["C01", "C02", "C03"],
        "target_count": 10,
        "description": "Diversity testing"
    }
}


class USPTOPatentCollectorV2:
    """Collects patents using PatentsView API v2"""
    
    def __init__(self):
        self.collected_patents = []
        self.failed_patents = []
        
    def search_patents_by_cpc(self, cpc_class: str, limit: int = 20) -> List[Dict]:
        """
        Search PatentsView API v2 for patents by CPC class
        
        Args:
            cpc_class: CPC class code (e.g., "G06F")
            limit: Number of results to fetch
            
        Returns:
            List of patent dictionaries
        """
        print(f"  Searching for {cpc_class} patents...")
        
        # Build query for API v2
        query = {
            "cpc_subgroup_id": cpc_class + "*",  # Wildcard search
            "patent_date": "[2020-01-01 TO 2024-12-31]"
        }
        
        # Fields to return
        fields = [
            "patent_number",
            "patent_title",
            "patent_abstract",
            "patent_date",
            "cpc_current",
            "assignee_organization",
            "inventor_last_name"
        ]
        
        payload = {
            "q": query,
            "f": fields,
            "o": {
                "per_page": limit
            }
        }
        
        try:
            response = requests.post(
                API_BASE,
                json=payload,
                timeout=30,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            
            data = response.json()
            patents = data.get("patents", [])
            
            print(f"    Found {len(patents)} patents for {cpc_class}")
            return patents
            
        except requests.exceptions.HTTPError as e:
            print(f"    ERROR searching {cpc_class}: {e}")
            print(f"    Status: {response.status_code}")
            return []
        except Exception as e:
            print(f"    ERROR searching {cpc_class}: {e}")
            return []
    
    def prepare_blind_input(self, patent: Dict) -> Dict:
        """Create blind input file (no claims, no classifications)"""
        
        # Get abstract and title
        abstract = patent.get("patent_abstract", "")
        title = patent.get("patent_title", "")
        
        # Combine title and abstract as "specification"
        specification_text = f"{title}\n\n{abstract}"
        
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
        """Create ground truth file (examiner CPCs)"""
        
        # Extract CPC codes from new API format
        cpc_data = patent.get("cpc_current", [])
        cpc_codes = []
        
        if isinstance(cpc_data, list):
            for cpc_entry in cpc_data:
                if isinstance(cpc_entry, dict):
                    cpc_id = cpc_entry.get("cpc_subgroup_id", "")
                    if cpc_id:
                        cpc_codes.append(cpc_id)
                elif isinstance(cpc_entry, str):
                    cpc_codes.append(cpc_entry)
        
        # Primary CPC is first one
        primary_cpc = cpc_codes[0] if cpc_codes else ""
        additional_cpcs = cpc_codes[1:5] if len(cpc_codes) > 1 else []  # Up to 4 additional
        
        return {
            "patent_id": f"test_{patent['patent_number']}",
            "source_patent": patent["patent_number"],
            "issue_date": patent.get("patent_date", ""),
            "ground_truth": {
                "examiner_cpc_primary": primary_cpc,
                "examiner_cpc_additional": additional_cpcs,
                "independent_claims": [],  # Not available from API
                "assignee": patent.get("assignee_organization", [{}])[0].get("assignee_organization", "") if patent.get("assignee_organization") else "",
                "inventors": ", ".join([inv.get("inventor_last_name", "") for inv in patent.get("inventor_last_name", [])]) if patent.get("inventor_last_name") else ""
            }
        }
    
    def collect_stratified_sample(self) -> Dict[str, Any]:
        """Collect 50 patents across 5 technology areas (10 each)"""
        
        print("\n" + "="*60)
        print("USPTO Patent Data Collection (API v2)")
        print("="*60)
        print(f"Target: 50 patents (10 per technology area)")
        print(f"Date Range: 2020-2024")
        print(f"Patent Type: Utility patents")
        print("="*60 + "\n")
        
        stats = {
            "start_time": datetime.now().isoformat(),
            "target_count": 50,
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
                patents = self.search_patents_by_cpc(cpc_class, limit=20)
                
                # Add technology area label
                for p in patents:
                    p['technology_area'] = tech_area
                
                area_patents.extend(patents)
                time.sleep(1)  # Rate limiting
            
            # Remove duplicates
            seen = set()
            unique_patents = []
            for p in area_patents:
                patent_num = p['patent_number']
                if patent_num not in seen:
                    seen.add(patent_num)
                    unique_patents.append(p)
            
            # Random sample
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
                "sample_patents": [p['patent_number'] for p in sampled[:3]]
            }
            
            print(f"   ✅ Collected: {collected} patents")
        
        # Save metadata
        stats['end_time'] = datetime.now().isoformat()
        stats['total_collected'] = total_collected
        stats['total_failed'] = len(self.failed_patents)
        stats['success_rate'] = f"{(total_collected / 50) * 100:.1f}%"
        
        metadata_file = OUTPUT_DIR / "metadata.json"
        with open(metadata_file, 'w') as f:
            json.dump(stats, f, indent=2)
        
        print("\n" + "="*60)
        print("✅ Collection Complete")
        print("="*60)
        print(f"Total Collected: {total_collected} / 50")
        print(f"Success Rate: {stats['success_rate']}")
        print(f"Failed: {len(self.failed_patents)}")
        print(f"\nOutput Files: {total_collected * 2} files created")
        print("="*60 + "\n")
        
        return stats


def main():
    """Main execution"""
    print("\n🚀 Starting USPTO Patent Collection (API v2)\n")
    
    collector = USPTOPatentCollectorV2()
    stats = collector.collect_stratified_sample()
    
    print("\n📊 Sample Distribution:")
    for tech_area, data in stats['technology_areas'].items():
        print(f"  {tech_area}: {data['collected']} / {data['target']}")
    
    if stats['total_collected'] > 0:
        print("\n✅ Data collection successful!")
        print("\nNext Steps:")
        print("  1. Review test_data/metadata.json")
        print("  2. Inspect sample files in test_data/input/")
        print("  3. Run: python 2_batch_process.py")
    else:
        print("\n❌ No patents collected - check API status")
        print("   Try Solution 2 or 3 (manual test data)")
    print()


if __name__ == "__main__":
    main()
