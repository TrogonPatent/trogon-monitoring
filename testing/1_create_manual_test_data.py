#!/usr/bin/env python3
"""
Manual Test Data Generator
===========================

Creates 15 sample patents with known specifications and CPC codes
Perfect for testing the validation system when APIs are unavailable

Usage:
    python 1_create_manual_test_data.py
"""

import json
from pathlib import Path
from datetime import datetime

OUTPUT_DIR = Path("test_data")
INPUT_DIR = OUTPUT_DIR / "input"
TRUTH_DIR = OUTPUT_DIR / "ground_truth"

INPUT_DIR.mkdir(parents=True, exist_ok=True)
TRUTH_DIR.mkdir(parents=True, exist_ok=True)

# Sample patent data with known specifications and CPCs
SAMPLE_PATENTS = [
    # Software/ML Patents
    {
        "patent_number": "11234567",
        "title": "Machine Learning Patent Classification System",
        "abstract": "A system for automated patent classification using machine learning algorithms. The system analyzes patent specifications and predicts CPC codes using natural language processing and neural networks. The method includes training a model on historical patent data and applying the model to new patent applications.",
        "primary_cpc": "G06F 40/169",
        "additional_cpcs": ["G06N 3/08", "G06F 16/33"],
        "technology_area": "Software/ML"
    },
    {
        "patent_number": "11234568",
        "title": "Neural Network for Image Recognition in Mobile Devices",
        "abstract": "A mobile device implementing a convolutional neural network for real-time image recognition. The system uses optimized inference algorithms to reduce power consumption while maintaining accuracy. Applications include augmented reality, object detection, and facial recognition.",
        "primary_cpc": "G06N 3/08",
        "additional_cpcs": ["G06F 18/214", "H04N 5/225"],
        "technology_area": "Software/ML"
    },
    {
        "patent_number": "11234569",
        "title": "Cloud-Based Patent Analytics Platform",
        "abstract": "A cloud computing platform for patent portfolio analysis using distributed machine learning. The system provides competitive intelligence, citation analysis, and technology trend prediction. Features include automated report generation and visualization dashboards.",
        "primary_cpc": "G06F 40/169",
        "additional_cpcs": ["G06Q 10/10", "H04L 67/10"],
        "technology_area": "Software/ML"
    },
    
    # Mechanical/Electrical Patents
    {
        "patent_number": "11345678",
        "title": "Smartphone Mount with Quick Release Mechanism",
        "abstract": "A mounting system for mobile devices featuring a quick-release mechanism with elastomeric grip pads. The mount includes a ball joint for angle adjustment and a standard 1/4-20 threaded insert for tripod compatibility. The design eliminates the need for adhesives or permanent modifications.",
        "primary_cpc": "F16M 11/04",
        "additional_cpcs": ["F16M 13/02", "H04M 1/04"],
        "technology_area": "Mechanical/Electrical"
    },
    {
        "patent_number": "11345679",
        "title": "Wireless Charging Coil with Improved Efficiency",
        "abstract": "A wireless power transfer system using optimized coil geometry to improve energy efficiency. The system includes active cooling, foreign object detection, and adaptive charging algorithms. Compatible with Qi standard and backward compatible with existing devices.",
        "primary_cpc": "H02J 50/10",
        "additional_cpcs": ["H01F 38/14", "H02J 7/00"],
        "technology_area": "Mechanical/Electrical"
    },
    {
        "patent_number": "11345680",
        "title": "LED Display with Flexible Substrate",
        "abstract": "A flexible LED display using a polymer substrate for bendable electronic devices. The display includes integrated touch sensing, low power consumption, and high contrast ratio. Applications include wearable devices, curved screens, and rollable displays.",
        "primary_cpc": "H01L 51/52",
        "additional_cpcs": ["G09G 3/32", "H05B 33/12"],
        "technology_area": "Mechanical/Electrical"
    },
    
    # Business Methods Patents
    {
        "patent_number": "11456789",
        "title": "Mobile Payment Authentication System",
        "abstract": "A method for secure mobile payment authentication using biometric verification and tokenization. The system generates single-use tokens for each transaction, reducing fraud risk. Features include multi-factor authentication, real-time fraud detection, and encrypted data transmission.",
        "primary_cpc": "G06Q 20/32",
        "additional_cpcs": ["G06Q 20/40", "H04L 9/32"],
        "technology_area": "Business Methods"
    },
    {
        "patent_number": "11456790",
        "title": "Blockchain-Based Supply Chain Tracking",
        "abstract": "A distributed ledger system for tracking products through supply chain using blockchain technology. The system provides immutable records, real-time visibility, and smart contract automation. Applications include pharmaceutical verification, food safety, and logistics optimization.",
        "primary_cpc": "G06Q 10/08",
        "additional_cpcs": ["H04L 9/00", "G06F 16/27"],
        "technology_area": "Business Methods"
    },
    {
        "patent_number": "11456791",
        "title": "AI-Powered Customer Service Chatbot",
        "abstract": "An artificial intelligence system for automated customer service using natural language processing. The chatbot learns from interactions, escalates complex issues to human agents, and integrates with existing CRM systems. Features include sentiment analysis, multi-language support, and analytics dashboard.",
        "primary_cpc": "G06Q 30/015",
        "additional_cpcs": ["G06F 40/35", "G06N 3/08"],
        "technology_area": "Business Methods"
    },
    
    # Life Sciences Patents
    {
        "patent_number": "11567890",
        "title": "CRISPR-Based Gene Editing Method",
        "abstract": "A method for precise genome editing using CRISPR-Cas9 technology with improved specificity. The system reduces off-target effects through modified guide RNA design and optimized delivery vectors. Applications include therapeutic gene correction and agricultural crop improvement.",
        "primary_cpc": "C12N 15/10",
        "additional_cpcs": ["C12N 9/22", "A01H 1/00"],
        "technology_area": "Life Sciences"
    },
    {
        "patent_number": "11567891",
        "title": "Monoclonal Antibody for Cancer Treatment",
        "abstract": "A therapeutic antibody targeting specific cancer cell surface proteins. The antibody demonstrates high specificity, low immunogenicity, and effective tumor cell killing. Pharmaceutical compositions and treatment methods are described for various cancer types.",
        "primary_cpc": "C07K 16/28",
        "additional_cpcs": ["A61K 39/395", "A61P 35/00"],
        "technology_area": "Life Sciences"
    },
    {
        "patent_number": "11567892",
        "title": "mRNA Vaccine Platform Technology",
        "abstract": "A platform for rapid vaccine development using messenger RNA technology. The system includes lipid nanoparticle delivery, optimized coding sequences, and stabilization methods. The platform enables quick response to emerging pathogens and reduced manufacturing time.",
        "primary_cpc": "A61K 39/39",
        "additional_cpcs": ["C12N 15/88", "A61P 31/00"],
        "technology_area": "Life Sciences"
    },
    
    # Chemistry Patents
    {
        "patent_number": "11678901",
        "title": "High-Capacity Lithium Battery Electrolyte",
        "abstract": "An electrolyte composition for lithium-ion batteries with improved energy density and cycle life. The formulation includes novel additives that prevent dendrite formation and enhance thermal stability. Applications include electric vehicles, grid storage, and portable electronics.",
        "primary_cpc": "H01M 10/0569",
        "additional_cpcs": ["H01M 10/42", "C01B 25/37"],
        "technology_area": "Chemistry"
    },
    {
        "patent_number": "11678902",
        "title": "Biodegradable Polymer for Packaging",
        "abstract": "A biodegradable polymer composition derived from renewable resources. The material exhibits strength comparable to conventional plastics while decomposing within months in natural environments. Manufacturing methods and applications in food packaging are described.",
        "primary_cpc": "C08L 67/04",
        "additional_cpcs": ["B65D 65/46", "C08J 5/18"],
        "technology_area": "Chemistry"
    },
    {
        "patent_number": "11678903",
        "title": "Catalyst for Carbon Dioxide Reduction",
        "abstract": "A heterogeneous catalyst for converting carbon dioxide to useful chemicals using renewable energy. The catalyst demonstrates high selectivity, stability, and efficiency in electrochemical reduction reactions. Applications include carbon capture, fuel synthesis, and chemical manufacturing.",
        "primary_cpc": "C25B 3/26",
        "additional_cpcs": ["B01J 23/89", "C07C 29/151"],
        "technology_area": "Chemistry"
    }
]


def create_test_data():
    """Generate test data files"""
    
    print("\n" + "="*60)
    print("Manual Test Data Generator")
    print("="*60)
    print(f"Creating {len(SAMPLE_PATENTS)} test patents")
    print("="*60 + "\n")
    
    stats = {
        "start_time": datetime.now().isoformat(),
        "total_patents": len(SAMPLE_PATENTS),
        "technology_areas": {}
    }
    
    # Count by technology area
    tech_counts = {}
    for patent in SAMPLE_PATENTS:
        tech_area = patent['technology_area']
        tech_counts[tech_area] = tech_counts.get(tech_area, 0) + 1
    
    created_count = 0
    
    for patent in SAMPLE_PATENTS:
        patent_num = patent['patent_number']
        tech_area = patent['technology_area']
        
        print(f"Creating {patent_num} ({tech_area})...")
        
        # Create blind input (no CPC codes)
        input_data = {
            "patent_id": f"test_{patent_num}",
            "title": patent['title'],
            "specification_text": f"{patent['title']}\n\n{patent['abstract']}",
            "metadata": {
                "source_patent": f"US{patent_num}B2",
                "technology_area": tech_area,
                "issue_date": "2023-01-15"
            }
        }
        
        input_file = INPUT_DIR / f"patent_{patent_num}_input.json"
        with open(input_file, 'w') as f:
            json.dump(input_data, f, indent=2)
        
        # Create ground truth (with CPC codes)
        truth_data = {
            "patent_id": f"test_{patent_num}",
            "source_patent": f"US{patent_num}B2",
            "issue_date": "2023-01-15",
            "ground_truth": {
                "examiner_cpc_primary": patent['primary_cpc'],
                "examiner_cpc_additional": patent['additional_cpcs'],
                "independent_claims": [],
                "assignee": "Test Company Inc",
                "inventors": "Smith, John"
            }
        }
        
        truth_file = TRUTH_DIR / f"patent_{patent_num}_truth.json"
        with open(truth_file, 'w') as f:
            json.dump(truth_data, f, indent=2)
        
        created_count += 1
        print(f"  ✅ Primary CPC: {patent['primary_cpc']}")
    
    # Save statistics by technology area
    for tech_area, count in tech_counts.items():
        stats['technology_areas'][tech_area] = {
            "count": count,
            "percentage": f"{(count / len(SAMPLE_PATENTS)) * 100:.1f}%"
        }
    
    stats['end_time'] = datetime.now().isoformat()
    stats['files_created'] = created_count * 2
    
    metadata_file = OUTPUT_DIR / "metadata.json"
    with open(metadata_file, 'w') as f:
        json.dump(stats, f, indent=2)
    
    print("\n" + "="*60)
    print("✅ Test Data Created")
    print("="*60)
    print(f"Patents Created: {created_count}")
    print(f"Total Files: {created_count * 2}")
    print(f"\nBreakdown:")
    for tech_area, data in stats['technology_areas'].items():
        print(f"  {tech_area}: {data['count']} patents ({data['percentage']})")
    print("\n" + "="*60)
    print("\nNext Steps:")
    print("  1. Review test_data/input/ for blind specifications")
    print("  2. Review test_data/ground_truth/ for examiner CPCs")
    print("  3. Run: python 2_batch_process.py")
    print("="*60 + "\n")


if __name__ == "__main__":
    create_test_data()
