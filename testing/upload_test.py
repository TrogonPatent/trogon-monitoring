"""
Upload Test Patents to Trogon Hunt API

Usage:
python upload_test.py --api-url https://monitoring.trogonpatent.ai --dir test_patents
"""

import os
import sys
import json
import time
import requests
import argparse
from pathlib import Path

class TrogonUploader:
    def __init__(self, api_url, test_dir):
        self.api_url = api_url.rstrip('/')
        self.test_dir = Path(test_dir)
        self.results_dir = self.test_dir / "api_results"
        self.results_dir.mkdir(exist_ok=True)
        
        print(f"API: {self.api_url}")
        print(f"Test dir: {self.test_dir}")
    
    def load_manifest(self):
        """Load processing manifest"""
        manifest_path = self.test_dir / "processing_manifest.json"
        
        if not manifest_path.exists():
            print(f"✗ Manifest not found: {manifest_path}")
            print("Run download_and_parse.py first")
            sys.exit(1)
        
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
        
        print(f"✓ Loaded manifest: {len(manifest['processed'])} patents")
        return manifest['processed']
    
    def upload_patent(self, patent_info):
        """Upload single patent to API"""
        patent_num = patent_info['patent_number']
        spec_path = patent_info['spec_path']
        
        print(f"\nUploading {patent_num}...")
        
        try:
            # Step 1: Upload file
            with open(spec_path, 'rb') as f:
                files = {'file': (f'{patent_num}-spec.docx', f, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
                data = {
                    'filingDate': '',
                    'isPreFiling': 'true'
                }
                
                response = requests.post(
                    f"{self.api_url}/api/upload-provisional",
                    files=files,
                    data=data,
                    timeout=60
                )
                
                if response.status_code != 200:
                    raise Exception(f"Upload failed: {response.status_code} - {response.text}")
                
                upload_data = response.json()
                application_id = upload_data['id']
                extracted_text = upload_data.get('extractedText', '')
                
                print(f"  ✓ Uploaded → App ID: {application_id}")
            
            # Step 2: Classify
            time.sleep(1)  # Brief pause
            
            response = requests.post(
                f"{self.api_url}/api/classify-provisional",
                json={
                    'specText': extracted_text,
                    'title': upload_data.get('title', ''),
                    'applicationId': application_id
                },
                headers={'Content-Type': 'application/json'},
                timeout=120
            )
            
            if response.status_code != 200:
                raise Exception(f"Classification failed: {response.status_code} - {response.text}")
            
            classify_data = response.json()
            
            print(f"  ✓ Classified → Primary CPC: {classify_data.get('primaryCpc', 'N/A')}")
            
            # Save result
            result = {
                'patent_number': patent_num,
                'application_id': application_id,
                'upload_response': upload_data,
                'classify_response': classify_data,
                'timestamp': time.time()
            }
            
            result_path = self.results_dir / f"{patent_num}-result.json"
            with open(result_path, 'w') as f:
                json.dump(result, f, indent=2)
            
            return result
            
        except Exception as e:
            print(f"  ✗ Error: {e}")
            return {
                'patent_number': patent_num,
                'error': str(e),
                'timestamp': time.time()
            }
    
    def upload_all(self, patents, rate_limit=2.0):
        """Upload all patents with rate limiting"""
        results = []
        errors = []
        
        total = len(patents)
        
        for i, patent in enumerate(patents, 1):
            print(f"\n[{i}/{total}]", end=' ')
            
            result = self.upload_patent(patent)
            
            if 'error' in result:
                errors.append(result)
            else:
                results.append(result)
            
            # Rate limiting
            if i < total:
                time.sleep(rate_limit)
        
        # Save summary
        summary = {
            'total': total,
            'successful': len(results),
            'failed': len(errors),
            'results': results,
            'errors': errors
        }
        
        summary_path = self.results_dir / "upload_summary.json"
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        print("\n" + "=" * 60)
        print(f"✓ Upload complete")
        print(f"  Successful: {len(results)}/{total}")
        print(f"  Failed: {len(errors)}/{total}")
        print(f"  Results saved: {self.results_dir}")
        
        return summary

def main():
    parser = argparse.ArgumentParser(description='Upload patents to Trogon Hunt API')
    parser.add_argument('--api-url', required=True, help='API base URL')
    parser.add_argument('--dir', default='test_patents', help='Test directory')
    parser.add_argument('--rate-limit', type=float, default=2.0, help='Seconds between uploads (default: 2)')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Trogon Hunt API Upload Test")
    print("=" * 60)
    
    uploader = TrogonUploader(args.api_url, args.dir)
    manifest = uploader.load_manifest()
    
    # Upload all
    summary = uploader.upload_all(manifest, rate_limit=args.rate_limit)
    
    print("\nNext step: Run validate_all.py to compare results")

if __name__ == '__main__':
    main()
