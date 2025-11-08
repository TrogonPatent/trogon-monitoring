# Quick Reference Card - Trogon Hunt Testing

## One-Page Cheat Sheet

### 🚀 Quick Start (3 Commands)

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY='your-key'
./run_all.sh
```

---

### 📊 What Gets Tested

| Metric | Target | Production Ready? |
|--------|--------|------------------|
| Primary CPC Accuracy | 75% | This is the key metric |
| Top-3 CPC Accuracy | 85% | Shows confidence |
| CPC Recall | 60% | Coverage check |
| CPC Precision | 50% | Relevance check |

---

### 💰 Cost & Time

| Item | Value |
|------|-------|
| Setup Time | 5 minutes |
| Run Time | 21 minutes |
| Total Cost | $4.50 |
| Cost per Patent | $0.03 |

---

### 📁 Key Files

**Scripts:**
- `1_collect_test_data.py` - Get USPTO patents
- `2_batch_process.py` - Run through Claude
- `3_validate_accuracy.py` - Check accuracy
- `run_all.sh` - Run everything

**Results:**
- `test_data/validation_report.md` - READ THIS FIRST
- `test_data/detailed_results.csv` - Per-patent data
- `test_data/validation_report.json` - Machine readable

---

### ✅ Decision Tree

```
Run validation
     │
     ▼
≥75% accuracy?
     │
     ├─ YES → ✅ Production ready!
     │         └─ Proceed to Phase B
     │
     └─ NO  → ⚠️  Needs work
               ├─ 60-74%? Refine prompts
               └─ <60%? Rethink approach
```

---

### 🔧 Troubleshooting

**API Key Missing:**
```bash
export ANTHROPIC_API_KEY='sk-ant-...'
```

**Collection Fails:**
- Check USPTO API: https://api.patentsview.org
- Try different date range

**Processing Slow:**
- Normal: ~4s per patent
- Total: ~10 minutes for 150

**Low Accuracy:**
1. Review `detailed_results.csv`
2. Find failure patterns
3. Refine Template 2 prompt
4. Re-run on 30-patent subset

---

### 📈 Sample Output

```
Primary CPC Accuracy: 78.7% ✅
Top-3 CPC Accuracy: 89.3% ✅
CPC Recall: 70.5% ✅
CPC Precision: 86.4% ✅

Status: PRODUCTION READY
```

---

### 🎯 Next Steps

**If ≥75%:**
1. Add to investor pitch
2. Start Phase B
3. Deploy to beta

**If <75%:**
1. Analyze failures
2. Refine prompts
3. Re-validate

---

### 🆘 Help

**Docs:**
- Complete guide: `README.md`
- Visual guide: `WORKFLOW-DIAGRAM.md`
- Summary: `DELIVERABLES-SUMMARY.md`

**Strategy:**
- Testing methodology: `TESTING-VALIDATION-STRATEGY-NOV7.md`
- Prompts: `prior-art-prompt-templates.md`
- Phases: `implementation-phases.md`

---

### 💡 Remember

**This validates:**
✅ CPC classification accuracy  
✅ POD extraction quality  
✅ Production readiness  
✅ Investor pitch metrics  

**Against:**
✅ Real USPTO patents  
✅ Examiner ground truth  
✅ 150-patent sample  
✅ Blind testing methodology  

---

### 📞 Quick Commands

```bash
# Install
pip install -r requirements.txt

# Run all
./run_all.sh

# View report
cat test_data/validation_report.md

# Check CSV
open test_data/detailed_results.csv

# Re-run validation only
python 3_validate_accuracy.py
```

---

**Total Time:** 21 minutes  
**Total Cost:** $4.50  
**Files Generated:** 300+ (input, truth, predictions, reports)  
**Decision:** Production ready if ≥75%

---

**Print this card and keep it handy!**
