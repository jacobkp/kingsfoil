// Core data structures for medical bill analysis

export interface Provider {
  name: string;
  npi: string | null;
  address: string;
  phone: string | null;
}

export interface Patient {
  name: string;
  dob: string | null; // YYYY-MM-DD
  member_id: string | null;
}

export interface BillSummary {
  bill_number: string | null;
  service_date_start: string; // YYYY-MM-DD
  service_date_end: string; // YYYY-MM-DD
  bill_date: string; // YYYY-MM-DD
  total_charges: number;
  insurance_paid: number | null;
  patient_responsibility: number | null;
}

export interface LineItem {
  line_number: number;
  service_date: string; // YYYY-MM-DD
  cpt_code: string | null;
  hcpcs_code: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_charge: number;
  modifiers: string[] | null;
  place_of_service: string | null;
  plain_english_explanation?: string; // Added after explanation API call
}

export interface DocumentTypeHint {
  type: 'MEDICAL_BILL' | 'EOB' | 'INVALID';
  confidence: number; // 0-100
  reasoning: string;
  key_indicators: string[];
}

export interface ExtractedBill {
  document_type_hint?: DocumentTypeHint; // AI classification hint from Vision API
  document_header_text?: string; // Full header/footer text for classification
  provider: Provider;
  patient: Patient;
  bill_summary: BillSummary;
  line_items: LineItem[];
}

export type ErrorType =
  | 'duplicate_charge'
  | 'unbundling'
  | 'nsa_violation'
  | 'balance_billing'
  | 'math_error'
  | 'upcoding'
  | 'invalid_code'
  | 'modifier_error'
  | 'excessive_markup'
  | 'repeated_test'
  | 'facility_fee_abuse'
  | 'ambulance_overcharge';

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

export type DisputePriority = 'immediate' | 'high' | 'medium' | 'low';

export interface ErrorEvidence {
  rule_violated: string;
  expected_billing: string;
  actual_billing: string;
  comparison_data?: string;
}

export interface BillingError {
  error_id: string; // Unique ID like "line5_math_error" or "lab_unbundling_lines_15_22"
  type: ErrorType;
  severity: ErrorSeverity;

  // Short versions for inline display
  short_title: string; // 3-5 words, for badges
  one_line_explanation: string; // 15-20 words, for tooltips

  // Full versions for detail panels
  full_title: string; // 8-12 words, for error cards
  detailed_explanation: string; // 2-4 sentences, patient-friendly
  technical_details: string; // Full medical terminology, for dispute letters

  evidence?: ErrorEvidence; // Structured evidence
  potential_savings: number;
  confidence: number; // 0-100
  recommended_action: string;
  regulatory_citation?: string | null;
  dispute_priority?: DisputePriority;

  // For cross-line errors only
  affected_lines?: number[]; // Only used in cross_line_errors
}

export interface LineItemWithErrors {
  line_number: number;
  errors: BillingError[]; // Multiple errors possible per line
  total_line_savings: number; // Sum of all error savings on this line
  error_count: number; // Number of errors on this line
}

export interface ErrorSummary {
  total_line_items_checked: number;
  line_items_with_errors: number;
  total_errors_found: number;
  total_potential_savings: number;

  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };

  by_type: {
    [key in ErrorType]?: number;
  };

  confidence_score?: number;
  review_notes?: string;
}

export interface BillQualityAssessment {
  overall_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  positive_findings: string[];
  areas_of_concern: string[];
  requires_manual_review: boolean;
}

export interface AnalysisResult {
  line_items_with_errors: LineItemWithErrors[]; // Line-specific errors
  cross_line_errors: BillingError[]; // Errors affecting multiple lines
  all_errors: BillingError[]; // Flat list of all errors for easy filtering
  summary: ErrorSummary;
  bill_quality_assessment?: BillQualityAssessment;

  // DEPRECATED: Keep for backward compatibility with old UI
  errors?: BillingError[]; // Legacy flat structure
}

// Session state management
export interface BillData {
  file: File | null;
  fileUrl: string | null; // For preview
  extracted: ExtractedBill | null;
  analysis: AnalysisResult | null;
  userContext?: string | null; // User's description of visit
  classification?: DocumentClassification | null; // Document type classification
}

// API request/response types
export interface ExtractApiResponse {
  success: boolean;
  data?: ExtractedBill;
  error?: string;
}

export interface ExplainApiRequest {
  line_items: LineItem[];
}

export interface ExplainApiResponse {
  success: boolean;
  explanations?: string[];
  error?: string;
}

export interface AnalyzeApiRequest {
  extracted_bill: ExtractedBill;
  check_types?: ErrorType[];
  user_context?: string | null;
  classification?: DocumentClassification;
}

export interface AnalyzeApiResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}

// Document classification types
export type DocumentType = 'MEDICAL_BILL' | 'EOB' | 'INVALID';

export interface ClassificationDebugInfo {
  bill_score: number;
  eob_score: number;
  required_categories: number;
  reasoning: string;
}

export interface DocumentClassification {
  type: DocumentType;
  confidence: number;
  can_analyze: boolean;
  user_message: string;
  _debug?: ClassificationDebugInfo; // Optional debug info for development
}

export interface ClassifyApiResponse {
  success: boolean;
  data?: DocumentClassification;
  error?: string;
}

// Context validation types
export interface ContextScenario {
  title: string;
  description: string;
  potential_savings?: number;
  likelihood: 'Possible' | 'Likely' | 'Unlikely';
}

export interface ContextDiscrepancy {
  user_described: string;
  bill_shows: string;
  two_scenarios: {
    scenario_1: ContextScenario;
    scenario_2: ContextScenario;
  };
  requires_verification: boolean;
  recommended_action: string;
}

export interface ContextValidation {
  alignment: 'agrees' | 'contradicts' | 'neutral';
  discrepancies?: ContextDiscrepancy[];
}

// Processing step for animation
export interface ProcessingStep {
  id: number;
  title: string;
  description: string;
  estimatedTime: number; // in seconds
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}
