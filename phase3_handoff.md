# Phase 3 Handoff — Remaining Work to Complete OCR + Extraction

## Project Location
```
d:\HACKATHONS\SIH_2026\PS-26018\Prototype\ILRDVS\
├── Backend\    (FastAPI + Python)
├── Frontend\   (Next.js — NO changes needed, already supports real data)
```

## What Is DONE (Code Written, Not Tested)

All Phase 3 Python source files are written and wired into the API:

| File | Purpose |
|------|---------|
| `Backend/app/services/document_quality/layout_classifier.py` | Classifies doc as simple_form / complex_table / handwritten_register |
| `Backend/app/services/document_quality/pipeline.py` | Already integrated layout_classifier into quality pipeline |
| `Backend/app/services/ocr_engine/ocr_base.py` | Abstract OCR interface (BaseOCREngine, OCRResult, TextBlock) |
| `Backend/app/services/ocr_engine/paddle_ocr_engine.py` | PaddleOCR adapter — Hindi first, English fallback, CPU-only, lazy-load |
| `Backend/app/services/ocr_engine/table_structure_engine.py` | PP-StructureV3 for tables → Khata-centric hierarchical JSON |
| `Backend/app/services/ocr_engine/ocr_router.py` | Routes: handwritten→HTR mode, simple_form→printed OCR, complex_table→OCR+PPStructure |
| `Backend/app/services/field_extractor/land_record_fields.py` | MP-specific Hindi field taxonomy + configurable STATE_PATTERN_REGISTRY |
| `Backend/app/services/field_extractor/field_matcher.py` | Two-pass extraction: regex patterns first, alias fuzzy fallback |
| `Backend/app/services/field_extractor/confidence_scorer.py` | Weighted scoring: OCR(50%) + Match(30%) + Context(20%) |
| `Backend/app/services/extraction_pipeline.py` | Master orchestrator: OCR → fields → confidence → summary |
| `Backend/app/models/document.py` | ExtractionResultModel added to DB |
| `Backend/app/api/documents.py` | Upload runs extraction after quality, analysis/status endpoints return real fields |
| `Backend/app/schemas/document.py` | UploadResponse has fieldsExtracted field |
| `Backend/requirements.txt` | paddlepaddle, paddleocr, thefuzz, python-Levenshtein added |

## What Is NOT Done — Exact Steps to Complete

### Step 1: Install PaddleOCR packages
```powershell
cd d:\HACKATHONS\SIH_2026\PS-26018\Prototype\ILRDVS\Backend
.venv\Scripts\python.exe -m pip install paddlepaddle>=2.6.0,<3.0 paddleocr>=2.9.0,<3.0
```
- This is ~500MB download. CPU-only build.
- First OCR call will also auto-download Hindi recognition model (~100-200MB).
- If install fails on Windows, try: `pip install paddlepaddle==2.6.2 paddleocr==2.9.1`

### Step 2: Delete old SQLite database (new table needed)
```powershell
Remove-Item d:\HACKATHONS\SIH_2026\PS-26018\Prototype\ILRDVS\Backend\storage\bhoomiverify.db -ErrorAction SilentlyContinue
```
The `extraction_results` table does not exist in the old DB. Deleting the DB file lets SQLAlchemy recreate all tables on startup.

### Step 3: Start the backend server
```powershell
cd d:\HACKATHONS\SIH_2026\PS-26018\Prototype\ILRDVS\Backend
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Watch for import errors. If any import fails, fix it before proceeding.

### Step 4: Start the frontend (if not already running)
```powershell
cd d:\HACKATHONS\SIH_2026\PS-26018\Prototype\ILRDVS\Frontend
npm run dev
```
Frontend runs on http://localhost:3000

### Step 5: End-to-end test
1. Open http://localhost:3000/upload
2. Upload any Hindi land record image/PDF
3. Watch processing screen — all 9 stages should complete
4. On analysis page verify:
   - Extracted fields appear in categorized grid (owner, identification, details, location)
   - Each field has real confidence % with high/medium/low badge
   - Low-confidence fields trigger amber warning alert
   - "View Evidence" drawer shows bounding box info
   - Summary metrics show real extraction confidence and field counts
5. If upload returns status "failed" with OCR error → PaddleOCR not installed properly

### Step 6: Fix any runtime bugs
Things that might break:
- **Import errors**: Check all `from .xxx import yyy` paths are correct
- **PaddleOCR model download timeout**: First run takes time, be patient
- **Field regex not matching**: If no fields extract from a real document, check the OCR raw text output and adjust regex patterns in `land_record_fields.py`
- **Type errors**: `FieldCandidate.bbox` uses `Tuple[int,int,int,int]` — needs Python 3.9+ or `from __future__ import annotations`

## Architecture Flow (for understanding)
```
Upload → Quality Pipeline (Phase 2, DONE & WORKING)
  → layout_classifier detects: simple_form / complex_table / handwritten_register
  → enhanced images saved to storage/processed/{doc_id}/

If not REJECTED:
  → Extraction Pipeline (Phase 3, CODE DONE, NOT TESTED)
    → OCR Router picks engine based on document_type
      → PaddleOCR (Hindi first, English fallback)
      → PP-StructureV3 for tables (+ Khata hierarchy builder)
    → Field Matcher (MP Hindi regex patterns → alias fuzzy fallback)
    → Confidence Scorer (weighted 50/30/20)
    → ExtractionResultModel saved to DB
    → API returns real fields to frontend
```

## Key Design Decisions (Don't Change)
- **No fake/mock data ever** — if OCR fails, status = EXTRACTION_FAILED, fields = empty
- **Hindi first, English fallback** — not simultaneous
- **CPU-only PaddleOCR** — no GPU
- **State patterns configurable** — add new state by creating patterns in land_record_fields.py
- **Lazy model loading** — PaddleOCR models load on first use, not on server startup
- **Frontend needs ZERO changes** — all components already handle real data vs empty state
