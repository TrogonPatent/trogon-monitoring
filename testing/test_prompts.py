# This script tests different prompt additions WITHOUT changing production
import subprocess
import sys

# Define the 3 variations
VARIATIONS = {
    'baseline': '',  # Current production prompt
    'mechanism': '''
CRITICAL POD EXTRACTION RULE:
Describe the MECHANISM before the function. Focus on HOW it works, not WHAT it does.
- Mechanical: Geometric relationships, linkage ratios, material interfaces
- Software: Specific operations (divides X by Y), not high-level functions (processes data)
- Ignore the application context (industry, use case). Focus only on the novel technical mechanism.
''',
    'claim_style': '''
EXTRACT PODs AS IF WRITING PATENT CLAIMS:
When describing each POD, use claim-style language:
1. Start with the structure/component, not its purpose
2. Use geometric terms (offset, ratio, angle) for mechanical features
3. Use precise operations (calculates ratio of X/Y, extracts bits 4-7) for algorithms
4. Avoid "the system does X" - instead say "component A configured to perform X"
5. Distinguish the application domain from the novel mechanism
''',
    'anti_context': '''
AVOID THESE COMMON POD EXTRACTION ERRORS:
1. ❌ Describing application context instead of mechanism
   Example: "Agricultural steering" → ✅ "Pivot offset creating non-linear ratio"
2. ❌ Gravitating to software when mechanical features exist
3. ❌ Functional language instead of structural
4. When in doubt: Ask "Could I build this from the POD alone?"
'''
}

# Run tests in parallel
for name, addition in VARIATIONS.items():
    print(f"Testing {name}...")
    # Would need to pass this to your API somehow
