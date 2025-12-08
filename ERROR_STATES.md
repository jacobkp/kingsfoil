# Error States and UI Handling Documentation

This document outlines all error states in the Medical Bill Analyzer application and how they are handled in the UI.

## Overview

The application has comprehensive error handling with user-friendly messages that hide technical details. All errors are logged to the console for debugging purposes.

---

## Error States by Feature

### 1. Document Upload (app/page.tsx)

#### Error: File Too Large
- **Trigger**: File size > 10MB
- **User Message**: "File must be under 10MB"
- **UI Display**: Red banner above upload area
- **Console Log**: None (client-side validation)
- **Recovery**: User must select a smaller file

#### Error: Invalid File Type
- **Trigger**: File type not in ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
- **User Message**: "Please upload a PDF, JPEG, or PNG file"
- **UI Display**: Red banner above upload area
- **Console Log**: None (client-side validation)
- **Recovery**: User must select a valid file type

---

### 2. Bill Extraction (app/api/extract/route.ts)

#### Error: No File Provided
- **Trigger**: FormData doesn't contain a file
- **User Message**: "No file provided"
- **HTTP Status**: 400
- **Console Log**: `[API /extract] ERROR: No file provided`
- **UI Display**: "Analysis Failed" with error message
- **Recovery**: User clicks "Try another bill" to return to upload page

#### Error: Vision API Failure
- **Trigger**: Claude Vision API call fails or returns non-text content
- **User Message**: "We encountered an issue reading your bill. Please try again or try a different image."
- **HTTP Status**: 500
- **Console Log**:
  - `Extract API error: [error details]`
  - `[API /extract] JSON parsing error: [details]` (if JSON parsing fails)
  - `[API /extract] Raw response: [first 500 chars]` (if JSON parsing fails)
- **UI Display**: "Analysis Failed" with error message
- **Recovery**: User clicks "Try another bill" to return to upload page

#### Successful Extraction
- **Trigger**: Vision API successfully extracts document data
- **Console Log**:
  - `[API /extract] Successfully extracted bill data. Line items: X`
  - `[API /extract] Document header text length: Y chars` (NEW - preserves EOB indicators)
- **Data Returned**:
  - `extracted_text`: Combines `document_header_text` + full OCR text for classification
  - This ensures EOB indicators in headers/footers are preserved for classification

#### Error: No Line Items Extracted
- **Trigger**: Extracted bill data has no line items or empty line_items array
- **User Message**: "We could not extract line items from this document. This may not be a valid medical bill. Please try a different document."
- **HTTP Status**: N/A (handled in frontend)
- **Console Log**: `[Step 1/5] ERROR: No line items found in extraction`
- **UI Display**: "Analysis Failed" with error message
- **Recovery**: User clicks "Try another bill" to return to upload page

---

### 3. Document Classification (app/api/classify/route.ts)

#### Error: No Extracted Text
- **Trigger**: Request body doesn't contain extracted_text
- **User Message**: "No extracted text provided"
- **HTTP Status**: 400
- **Console Log**: `[API /classify] ERROR: No extracted text provided`
- **UI Display**: "Analysis Failed" with error message
- **Recovery**: User clicks "Try another bill" to return to upload page

#### Classification Result: INVALID (Non-Medical Document)
- **Trigger**:
  - 2+ invalid indicators found (construction, ISBN, restaurant, etc.)
  - OR medical content score < 3/4 categories
- **User Message**:
  - "This does not appear to be a medical document. Please upload a medical bill or statement from your healthcare provider."
  - OR "This document does not contain enough medical billing information. Please upload a complete medical bill or statement."
- **HTTP Status**: 200 (successful classification)
- **Console Log**:
  - `[API /classify] Result: INVALID (invalid indicators found: X)`
  - OR `[API /classify] Result: INVALID (insufficient medical content - score: X/4)`
- **UI Display**: "Analysis Failed" with user_message
- **Recovery**: User clicks "Try another bill" to return to upload page
- **can_analyze**: false

#### Classification Result: EOB (Explanation of Benefits)
- **Trigger**:
  - EOB score >= 2
  - OR document contains "explanation of benefits"
  - **IMPORTANT**: Classification now uses `document_header_text` from extraction to preserve EOB indicators
- **User Message**: "This appears to be an Explanation of Benefits (EOB) from your insurance company. For best results, upload the actual medical bill from your provider. You can continue with this EOB, but analysis may be less accurate."
- **HTTP Status**: 200 (successful classification)
- **Console Log**:
  - `[API /extract] Document header text length: X chars`
  - `[API /classify] Result: EOB (confidence: 85%)`
- **UI Display**: Amber warning modal with two options:
  1. "Upload Medical Bill Instead" → Returns to upload page
  2. "Continue with EOB Anyway" → Continues processing
- **Recovery**: User chooses action
- **can_analyze**: true
- **Note**: If user continues, persistent amber badge shows "Analyzing EOB - Results may be limited" with hover tooltip explaining what an EOB is

#### Classification Result: MEDICAL_BILL
- **Trigger**: Medical content score >= 3/4 and not EOB
- **User Message**: "Medical bill detected. Proceeding with analysis..."
- **HTTP Status**: 200 (successful classification)
- **Console Log**: `[API /classify] Result: MEDICAL_BILL (confidence: 85-95%)`
- **UI Display**: Processing continues automatically
- **can_analyze**: true

---

### 4. Line Item Explanation (app/api/explain/route.ts)

#### Error: No Line Items Provided
- **Trigger**: Request body doesn't contain line_items, or line_items is not an array, or empty array
- **User Message**: "No line items provided"
- **HTTP Status**: 400
- **Console Log**: `[API /explain] ERROR: No line items provided or empty array`
- **UI Display**: "Analysis Failed" → "No line items provided"
- **Recovery**: User clicks "Try another bill" to return to upload page

#### Error: Explanation API Failure
- **Trigger**: Claude API call fails or returns invalid JSON
- **User Message**: "We encountered an issue explaining the line items. Please try again."
- **HTTP Status**: 500
- **Console Log**:
  - `Explain API error: [error details]`
  - `[API /explain] JSON parsing error: [details]`
  - `[API /explain] Raw response: [first 500 chars]`
- **UI Display**: "Analysis Failed" with error message
- **Recovery**: User clicks "Try another bill" to return to upload page

#### Error: Explanation Count Mismatch
- **Trigger**: Number of explanations doesn't match number of line items
- **User Message**: "We encountered an issue explaining the line items. Please try again."
- **HTTP Status**: 500
- **Console Log**: `[API /explain] Explanation count mismatch: Expected X but got Y`
- **UI Display**: "Analysis Failed" with error message
- **Recovery**: User clicks "Try another bill" to return to upload page

---

### 5. Bill Analysis (app/api/analyze/route.ts)

#### Error: No Bill Data Provided
- **Trigger**: Request body doesn't contain extracted_bill
- **User Message**: "No bill data provided"
- **HTTP Status**: 400
- **Console Log**: `[API /analyze] ERROR: No bill data provided`
- **UI Display**: "Analysis Failed" with error message
- **Recovery**: User clicks "Try another bill" to return to upload page

#### Error: Analysis API Failure
- **Trigger**: Claude API call fails or returns invalid JSON
- **User Message**: "We encountered an issue analyzing your bill. Please try again."
- **HTTP Status**: 500
- **Console Log**:
  - `Analyze API error: [error details]`
  - `[API /analyze] JSON parsing error: [details]`
  - `[API /analyze] Raw response: [first 500 chars]`
- **UI Display**: "Analysis Failed" with error message
- **Recovery**: User clicks "Try another bill" to return to upload page

#### Error: Invalid Analysis Structure
- **Trigger**: Analysis result missing required fields (line_items_with_errors, cross_line_errors, all_errors, summary)
- **User Message**: "We encountered an issue analyzing your bill. Please try again."
- **HTTP Status**: 500
- **Console Log**: `[API /analyze] Invalid structure in analysis result`
- **UI Display**: "Analysis Failed" with error message
- **Recovery**: User clicks "Try another bill" to return to upload page

---

### 6. Rate Limiting (All API Routes)

#### Error: Rate Limit Exceeded
- **Trigger**: 429 status from Anthropic API
- **User Message**: Transparent to user - automatically retries
- **HTTP Status**: Retried automatically, or 500 if all retries exhausted
- **Console Log**: `Rate limit hit. Retrying in X seconds... (Attempt Y/3)`
- **UI Display**:
  - User sees normal processing UI
  - If all retries fail: "Analysis Failed" with generic error message
- **Recovery**: Automatic retry up to 3 times with exponential backoff
- **Retry Logic**: Uses retry-after header value (or defaults to 60 seconds)

---

## Console Logging Structure

All console logs follow a consistent format for easy debugging:

### Format: `[Location] Message`

**Examples:**
- `[API /extract] Request received`
- `[API /extract] File received: example.pdf (2.34 MB, application/pdf)`
- `[API /classify] Classifying document (text length: 5432 chars)`
- `[Step 1/5] Extracting bill data...`
- `[Step 1/5] Extraction complete. Line items found: 15`
- `[Processing] Complete! Navigating to results page...`

### Log Levels:
- **Info**: Regular operation logs (console.log)
- **Warning**: EOB detection, non-critical issues (console.warn)
- **Error**: Failures, validation errors (console.error)

### What is Logged:

#### Frontend (app/analyzing/page.tsx)
- Processing start/completion
- Each step's progress (1/5 through 5/5)
- Extraction results (line item count)
- Classification results (type and confidence)
- Explanation counts
- Analysis results (error count)
- All errors with details

#### Backend (API routes)
- Request received
- File information (name, size, type)
- Document classification details (scores, indicators)
- Processing steps (extracting, classifying, explaining, analyzing)
- Success/failure status
- Error details (JSON parsing errors, validation failures)
- Result summaries (line items found, errors detected, etc.)

---

## UI Error Display Patterns

### 1. Red Error Banner (Upload Page)
```tsx
<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
  <p className="text-sm text-red-700">{error}</p>
</div>
```
**Used for**: File validation errors

### 2. Analysis Failed Error (Analyzing Page)
```tsx
<div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
  <p className="text-sm text-red-700 font-medium mb-2">Analysis Failed</p>
  <p className="text-sm text-red-600">{error}</p>
  <button onClick={() => router.push('/')} className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
    ← Try another bill
  </button>
</div>
```
**Used for**: API failures, extraction errors, classification errors

### 3. EOB Warning Modal (Analyzing Page)
```tsx
<div className="mt-6 p-5 bg-amber-50 border-2 border-amber-300 rounded-lg">
  {/* Warning icon, message, explanation, and two action buttons */}
</div>
```
**Used for**: EOB detection (user must choose to continue or upload different file)

### 4. EOB Analysis Indicator (Analyzing Page Header)
```tsx
<div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-lg group relative">
  <span className="text-xs font-medium text-amber-800">
    Analyzing EOB - Results may be limited
  </span>
  {/* Tooltip with EOB explanation */}
</div>
```
**Used for**: Persistent indicator during EOB analysis

---

## Error Recovery Flows

### Flow 1: Invalid Document
1. User uploads non-medical document
2. Extraction may succeed or fail
3. Classification returns INVALID with can_analyze: false
4. Error shown: "This does not appear to be a medical document..."
5. User clicks "Try another bill"
6. Returns to upload page

### Flow 2: EOB Document
1. User uploads EOB
2. Extraction succeeds
3. Classification returns EOB with can_analyze: true
4. Warning modal appears
5. User chooses:
   - **Option A**: "Upload Medical Bill Instead" → Returns to upload page
   - **Option B**: "Continue with EOB Anyway" → Continues with persistent warning badge

### Flow 3: Extraction Failure
1. User uploads document
2. Extraction fails (bad image, corrupted PDF, etc.)
3. Error shown: "We encountered an issue reading your bill..."
4. User clicks "Try another bill"
5. Returns to upload page

### Flow 4: No Line Items
1. User uploads document
2. Extraction succeeds but no line items found
3. Error shown: "We could not extract line items from this document..."
4. User clicks "Try another bill"
5. Returns to upload page

### Flow 5: Rate Limit
1. Processing starts normally
2. Rate limit hit on any API call
3. Automatic retry after N seconds (from retry-after header)
4. Up to 3 retry attempts
5. If successful: continues normally (user never knows)
6. If all retries fail: shows generic error message

---

## Testing Error States

### Manual Testing Checklist:

- [ ] Upload file > 10MB
- [ ] Upload unsupported file type (.txt, .doc, etc.)
- [ ] Upload random non-medical document (recipe, invoice, book page)
- [ ] Upload EOB document
- [ ] Upload medical bill with no line items (header page only)
- [ ] Upload corrupted/unreadable image
- [ ] Trigger rate limit (upload same bill multiple times quickly)
- [ ] Upload bill with future-dated services
- [ ] Test EOB warning: click "Upload Medical Bill Instead"
- [ ] Test EOB warning: click "Continue with EOB Anyway"

### Console Log Verification:

For each test, verify console logs show:
1. Request received
2. Processing steps
3. Appropriate error/success messages
4. No leaked sensitive data
5. Consistent formatting

---

## Best Practices

1. **Never expose internal errors to users**
   - Always use friendly, actionable messages
   - Log technical details to console only

2. **Provide clear recovery actions**
   - Every error has a "Try another bill" button
   - EOB warning has clear choice of two actions

3. **Log comprehensively**
   - Every step logs start and completion
   - Errors include context and details
   - Success cases log summary metrics

4. **Validate early**
   - Client-side validation prevents unnecessary API calls
   - Server-side validation provides additional safety

5. **Fail gracefully**
   - Rate limits auto-retry transparently
   - Partial failures show specific error messages
   - System always allows user to retry

---

## Recent Changes (December 2025)

### Deterministic Classification System (December 8, 2025)
**Problem**: Classification was using simple keyword matching which was unreliable for distinguishing between medical bills, EOBs, and invalid documents.

**Solution Implemented**: Complete rewrite of [app/api/classify/route.ts](app/api/classify/route.ts) with a 4-phase deterministic scoring system:

**Phase 1: Disqualification Check**
- Scans for strong negative indicators (construction, contractor, restaurant, etc.)
- If 2+ negative indicators found → immediate INVALID classification
- Prevents non-medical documents from proceeding

**Phase 2: Required Elements Check**
- Verifies presence of 4 required medical document categories:
  - `patient_info`: patient name, member id, dob, etc.
  - `provider_info`: provider, physician, hospital, npi, etc.
  - `medical_services`: service date, procedure, cpt, diagnosis, etc.
  - `financial_info`: charge, amount, total, payment, etc.
- Requires 3/4 categories minimum to proceed
- Each category adds 15-point bonus to bill score

**Phase 3: Type Scoring (Weighted Indicators)**
```
BILL_INDICATORS:
  Strong (10 pts): amount due, payment due, please remit, billing statement
  Medium (5 pts): statement, invoice, charges, balance forward
  Weak (2 pts): total, subtotal, amount, service date

EOB_INDICATORS:
  Strong (10 pts): explanation of benefits, this is not a bill, eob, claim summary
  Medium (5 pts): allowed amount, plan paid, insurance paid, member responsibility
  Weak (2 pts): claim, coverage, benefit, network

Special: "this is not a bill" phrase adds 15 bonus points
```

**Phase 4: Final Type Determination**
Decision matrix:
1. Strong EOB indicator OR "not a bill" phrase → EOB (90% confidence)
2. EOB score > Bill score AND EOB score >= 25 → EOB
3. Bill score >= 30 → MEDICAL_BILL
4. Required elements present → MEDICAL_BILL (70% confidence fallback)

**Console Logging**: Full classification matrix logged in dev mode showing:
- All indicator matches by category
- Scores for both BILL and EOB
- Required category verification
- Final reasoning for determination

**New Type Added**: `ClassificationDebugInfo` in [lib/types.ts](lib/types.ts) for optional `_debug` field in classification response.

---

### EOB Detection Enhancement (Earlier December 2025)
**Problem**: EOB documents were not being detected and proceeded to analysis as regular medical bills.

**Root Cause**: The extraction prompt focused only on extracting structured bill data without preserving document type indicators. EOB-specific text (like "Explanation of Benefits", "This is not a bill") in headers/footers was not being captured in the `extracted_text` used for classification.

**Solution Implemented**:
1. **Modified Extraction Prompt** ([lib/prompts.ts:13-59](lib/prompts.ts)):
   - Changed from "medical bill data extraction expert" to "medical document data extraction expert"
   - Added new field `document_header_text` to capture ALL header and footer text
   - Explicit instruction: "CRITICAL: Always extract the full document_header_text including page headers, notices, disclaimers, and document type identifiers"

2. **Updated Type Definition** ([lib/types.ts:40-46](lib/types.ts)):
   - Added `document_header_text?: string` to `ExtractedBill` interface

3. **Enhanced Classification Input** ([app/api/extract/route.ts:114-126](app/api/extract/route.ts)):
   - Combines `document_header_text` + full OCR text for classification
   - Logs header text length for debugging
   - Ensures EOB indicators are preserved in classification input

**Result**: Classification now has access to document headers containing EOB indicators like "Explanation of Benefits" and "This is not a bill", improving EOB detection accuracy.

---

### Future Date Validation Fix (December 8, 2025)
**Problem**: Service dates from earlier in 2025 (e.g., May 9, 2025) were being incorrectly flagged as "future dates" when the current date was December 8, 2025.

**Root Cause**: The analysis prompt was not providing clear enough guidance on date comparison, potentially comparing individual date components rather than full dates.

**Solution Implemented**: Enhanced DATE VALIDATION section in [lib/prompts.ts](lib/prompts.ts) with:
- Explicit warning not to flag dates unless clearly after today
- Step-by-step comparison process
- Concrete examples showing May/September 2025 are VALID past dates
- Numerical comparison logic (YYYYMMDD format: 20250509 vs 20251208)
- Critical reminders that months 01-11 of 2025 are in the PAST relative to December 2025

---

## Future Improvements

- Add error tracking/monitoring service (Sentry, LogRocket, etc.)
- Implement exponential backoff for all transient failures
- Add "Report Issue" button to error states
- Track error rates by error type
- Add retry button for specific failed steps (instead of full restart)
- Consider using AI-based classification instead of pure keyword matching for better accuracy