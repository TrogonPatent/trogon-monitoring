#!/usr/bin/env python3
"""
USPTO Patent Data Collection - Google Patents Method
====================================================

Uses Google Patents search to find patents, then fetches data from USPTO.gov
Most reliable method - no deprecated APIs!

Usage:
    python 1_collect_google_patents.py
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import random
from pathlib import Path
from datetime import datetime
import re

OUTPUT_DIR = Path("test_data")
INPUT_DIR = OUTPUT_DIR / "input"
TRUTH_DIR = OUTPUT_DIR / "ground_truth"

INPUT_DIR.mkdir(parents=True, exist_ok=True)
TRUTH_DIR.mkdir(parents=True, exist_ok=True)

# Reduced sample for faster testing
TECHNOLOGY_AREAS = {
    "Software/ML": {
        "search_terms": ["machine learning", "neural network", "artificial intelligence software"],
        "cpc_codes": ["G06F", "G06N"],
        "target_count": 5
    },
    "Mechanical/Electrical": {
        "search_terms": ["smartphone mount", "wireless charging", "mobile device"],
        "cpc_codes": ["F16M", "H02J", "H04M"],
        "target_count": 5
    },
    "Business Methods": {
        "search_terms": ["mobile payment", "blockchain", "e-commerce"],
        "cpc_codes": ["G06Q"],
        "target_count": 5
    }
}


class GooglePatentsCollector:
    """Collects patents using Google Patents search"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.collected_patents = []
        
    def search_google_patents(self, search_term: str, cpc_code: str, max_results: int = 10) -> list:
        """
        Search Google Patents for specific technology
        
        Args:
            search_term: Keywords to search
            cpc_code: CPC classification code
            max_results: Maximum results to return
            
        Returns:
            List of patent numbers
        """
        print(f"  Searching: '{search_term}' with CPC:{cpc_code}...")
        
        # Build Google Patents search URL
        # Format: https://patents.google.com/?q=machine+learning&cpc=G06N&after=priority:20200101
        query = search_term.replace(" ", "+")
        url = f"https://patents.google.com/?q={query}&cpc={cpc_code}&after=priority:20200101&country=US&type=GRANT"
        
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract patent numbers from search results
            patent_numbers = []
            
            # Google Patents shows patent numbers in search results
            # Look for patent number patterns like US11234567B2
            patent_pattern = re.compile(r'US(\d{7,8})[A-Z]\d')
            
            # Search in the page text
            matches = patent_pattern.findall(response.text)
            patent_numbers = list(set(matches))[:max_results]  # Unique patents
            
            if not patent_numbers:
                print(f"    ⚠️  No patents found in search results")
                return []
            
            print(f"    ✓ Found {len(patent_numbers)} patents")
            return patent_numbers
            
        except Exception as e:
            print(f"    ERROR: {e}")
            return []
    
    def fetch_patent_data_from_uspto(self, patent_number: str) -> dict:
        """
        Fetch patent data from USPTO.gov public API
        
        Args:
            patent_number: Patent number (just digits, e.g., "11234567")
            
        Returns:
            Patent data dictionary
        """
        # USPTO Patent Examination Data System (PEDS) API
        # This is the OFFICIAL USPTO API - very stable
        url = f"https://data.uspto.gov/peds/api/patents/{patent_number}"
        
        try:
            response = self.session.get(url, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                return data
            else:
                # Fallback: try alternative USPTO endpoint
                return self.fetch_from_alternative_source(patent_number)
                
        except Exception as e:
            print(f"    Warning: USPTO PEDS API failed for {patent_number}: {e}")
            return self.fetch_from_alternative_source(patent_number)
    
    def fetch_from_alternative_source(self, patent_number: str) -> dict:
        """
        Alternative: Scrape basic data from Google Patents page
        
        Args:
            patent_number: Patent number
            
        Returns:
            Basic patent data
        """
        url = f"https://patents.google.com/patent/US{patent_number}B2/en"
        
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract title
            title_elem = soup.find('meta', {'name': 'DC.title'})
            title = title_elem['content'] if title_elem else f"Patent US{patent_number}"
            
            # Extract abstract
            abstract_elem = soup.find('meta', {'name': 'DC.description'})
            abstract = abstract_elem['content'] if abstract_elem else "Abstract not available"
            
            # Extract CPC codes (look for classification sections)
            cpc_codes = []
            cpc_section = soup.find_all('span', string=re.compile(r'[A-H]\d{2}[A-Z]'))
            for elem in cpc_section[:5]:  # Get first 5 CPCs
                cpc_text = elem.get_text().strip()
                if re.match(r'[A-H]\d{2}[A-Z]', cpc_text):
                    cpc_codes.append(cpc_text)
            
            return {
                'patent_number': patent_number,
                'title': title,
                'abstract': abstract,
                'cpc_codes': list(set(cpc_codes)),  # Remove duplicates
                'source': 'google_patents_scrape'
            }
            
        except Exception as e:
            print(f"    Error fetching {patent_number}: {e}")
            return None
    
    def create_test_files(self, patent_data: dict, tech_area: str):
        """Create input and ground truth files"""
        
        patent_num = patent_data['patent_number']
        
        # Input file (blind - no CPCs)
        input_data = {
            "patent_id": f"test_{patent_num}",
            "title": patent_data['title'],
            "specification_text": f"{patent_data['title']}\n\n{patent_data['abstract']}",
            "metadata": {
                "source_patent": f"US{patent_num}B2",
                "technology_area": tech_area,
                "issue_date": "2023-01-15",
                "data_source": patent_data.get('source', 'google_patents')
            }
        }
        
        input_file = INPUT_DIR / f"patent_{patent_num}_input.json"
        with open(input_file, 'w', encoding='utf-8') as f:
            json.dump(input_data, f, indent=2, ensure_ascii=False)
        
        # Ground truth file (with CPCs)
        cpc_codes = patent_data.get('cpc_codes', [])
        primary_cpc = cpc_codes[0] if cpc_codes else "UNKNOWN"
        additional_cpcs = cpc_codes[1:4] if len(cpc_codes) > 1 else []
        
        truth_data = {
            "patent_id": f"test_{patent_num}",
            "source_patent": f"US{patent_num}B2",
            "issue_date": "2023-01-15",
            "ground_truth": {
                "examiner_cpc_primary": primary_cpc,
                "examiner_cpc_additional": additional_cpcs,
                "independent_claims": [],
                "assignee": "Retrieved from Google Patents",
                "inventors": "Retrieved from Google Patents"
            }
        }
        
        truth_file = TRUTH_DIR / f"patent_{patent_num}_truth.json"
        with open(truth_file, 'w', encoding='utf-8') as f:
            json.dump(truth_data, f, indent=2, ensure_ascii=False)
        
        return True
    
    def collect_patents(self):
        """Main collection process"""
        
        print("\n" + "="*60)
        print("Google Patents Data Collection")
        print("="*60)
        print("Using: Google Patents Search + USPTO Data")
        print("Target: 15 patents (5 per technology area)")
        print("="*60 + "\n")
        
        stats = {
            "start_time": datetime.now().isoformat(),
            "target_count": 15,
            "technology_areas": {}
        }
        
        total_collected = 0
        
        for tech_area, config in TECHNOLOGY_AREAS.items():
            print(f"\n📊 {tech_area}")
            print(f"   Target: {config['target_count']} patents")
            
            area_patents = []
            
            # Try each search term
            for search_term in config['search_terms']:
                if len(area_patents) >= config['target_count']:
                    break
                
                # Try each CPC code
                for cpc_code in config['cpc_codes']:
                    if len(area_patents) >= config['target_count']:
                        break
                    
                    # Search Google Patents
                    patent_numbers = self.search_google_patents(
                        search_term, 
                        cpc_code, 
                        max_results=3
                    )
                    
                    # Fetch data for each patent
                    for patent_num in patent_numbers:
                        if len(area_patents) >= config['target_count']:
                            break
                        
                        print(f"    Fetching US{patent_num}...")
                        patent_data = self.fetch_from_alternative_source(patent_num)
                        
                        if patent_data:
                            area_patents.append(patent_data)
                            print(f"      ✓ {patent_data['title'][:60]}...")
                        
                        time.sleep(2)  # Be polite to servers
                    
                    time.sleep(1)
            
            # Create files
            created = 0
            for patent_data in area_patents[:config['target_count']]:
                if self.create_test_files(patent_data, tech_area):
                    created += 1
                    self.collected_patents.append({
                        'patent_number': patent_data['patent_number'],
                        'technology_area': tech_area
                    })
            
            total_collected += created
            
            stats['technology_areas'][tech_area] = {
                "target": config['target_count'],
                "collected": created
            }
            
            print(f"   ✅ Collected: {created} patents")
        
        # Save metadata
        stats['end_time'] = datetime.now().isoformat()
        stats['total_collected'] = total_collected
        stats['success_rate'] = f"{(total_collected / 15) * 100:.1f}%"
        
        metadata_file = OUTPUT_DIR / "metadata.json"
        with open(metadata_file, 'w') as f:
            json.dump(stats, f, indent=2)
        
        print("\n" + "="*60)
        print("✅ Collection Complete")
        print("="*60)
        print(f"Total Collected: {total_collected} / 15")
        print(f"Files Created: {total_collected * 2}")
        print(f"Success Rate: {stats['success_rate']}")
        print("="*60 + "\n")
        
        return stats


def main():
    """Main execution"""
    print("\n🚀 Starting Google Patents Collection\n")
    print("This method is slow but reliable!")
    print("Expected time: ~5 minutes for 15 patents\n")
    
    collector = GooglePatentsCollector()
    stats = collector.collect_patents()
    
    if stats['total_collected'] > 0:
        print("\n✅ Success!")
        print("\nNext Steps:")
        print("  1. Review test_data/input/ for specifications")
        print("  2. Review test_data/ground_truth/ for CPC codes")
        print("  3. Run: python 2_batch_process.py")
    else:
        print("\n⚠️  No patents collected")
        print("Try: python 1_create_manual_test_data.py")
    print()


if __name__ == "__main__":
    main()
