#!/bin/bash
# Trogon Hunt Complete Validation Pipeline
# Runs all 3 steps sequentially

set -e  # Exit on any error

echo ""
echo "============================================================"
echo "Trogon Hunt Automated Testing & Validation Pipeline"
echo "============================================================"
echo ""
echo "This script will:"
echo "  1. Collect 150 patents from USPTO (~10 min)"
echo "  2. Process through Trogon Hunt (~10 min, ~\$4.50)"
echo "  3. Validate against ground truth (~1 min)"
echo ""
echo "Total time: ~21 minutes"
echo "Total cost: ~\$4.50"
echo ""
echo "============================================================"
echo ""

# Check for API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ERROR: ANTHROPIC_API_KEY not set"
    echo ""
    echo "Set your API key:"
    echo "  export ANTHROPIC_API_KEY='your-key-here'"
    echo ""
    exit 1
fi

echo "✅ API key found"
echo ""

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "🐍 Python version: $python_version"
echo ""

# Check if dependencies installed
if ! python3 -c "import anthropic" 2>/dev/null; then
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
    echo ""
fi

echo "✅ Dependencies installed"
echo ""

# Confirmation
read -p "Ready to start? This will cost ~\$4.50 in Claude API calls. (yes/no): " confirm
if [[ ! "$confirm" =~ ^[Yy]es$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting validation pipeline..."
echo ""

# Step 1: Collect data
echo "============================================================"
echo "STEP 1/3: Collecting USPTO Patent Data"
echo "============================================================"
echo ""

python3 1_collect_test_data.py

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Data collection failed"
    exit 1
fi

echo ""
echo "✅ Step 1 complete"
echo ""

# Step 2: Batch process
echo "============================================================"
echo "STEP 2/3: Processing Patents Through Trogon Hunt"
echo "============================================================"
echo ""

python3 2_batch_process.py

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Batch processing failed"
    exit 1
fi

echo ""
echo "✅ Step 2 complete"
echo ""

# Step 3: Validate
echo "============================================================"
echo "STEP 3/3: Validating Accuracy"
echo "============================================================"
echo ""

python3 3_validate_accuracy.py

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Validation failed"
    exit 1
fi

echo ""
echo "✅ Step 3 complete"
echo ""

# Final summary
echo "============================================================"
echo "✅ VALIDATION PIPELINE COMPLETE"
echo "============================================================"
echo ""
echo "📊 Results:"
echo "  - Validation Report: test_data/validation_report.md"
echo "  - Detailed Metrics: test_data/validation_report.json"
echo "  - Per-Patent Data: test_data/detailed_results.csv"
echo ""
echo "📖 Next steps:"
echo "  1. Review the validation report:"
echo "     cat test_data/validation_report.md"
echo ""
echo "  2. If accuracy ≥75%:"
echo "     - ✅ Production ready!"
echo "     - Proceed to Phase B (POD-based search)"
echo ""
echo "  3. If accuracy <75%:"
echo "     - ⚠️  Review failures in detailed_results.csv"
echo "     - Refine prompts and re-run validation"
echo ""
echo "============================================================"
echo ""
