import { NextRequest, NextResponse } from 'next/server';
import { DocumentType } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════
// INDICATOR DEFINITIONS WITH WEIGHTS
// ═══════════════════════════════════════════════════════════════════

interface IndicatorMatch {
  indicator: string;
  weight: number;
  category: string;
}

// BILL INDICATORS - Signs this is a direct patient bill
const BILL_INDICATORS = {
  strong: {
    weight: 10,
    terms: [
      'amount due',
      'payment due',
      'please remit',
      'billing statement',
      'patient statement',
      'account balance',
      'pay this amount',
      'minimum payment',
      'payment options',
      'make a payment',
    ],
  },
  medium: {
    weight: 5,
    terms: [
      'statement',
      'invoice',
      'charges',
      'balance forward',
      'account summary',
      'statement date',
      'due date',
      'total due',
      'current balance',
    ],
  },
  weak: {
    weight: 2,
    terms: ['total', 'subtotal', 'amount', 'date of service', 'service date'],
  },
};

// EOB INDICATORS - Signs this is an Explanation of Benefits
const EOB_INDICATORS = {
  strong: {
    weight: 10,
    terms: [
      'explanation of benefits',
      'this is not a bill',
      'not a bill',
      'eob',
      'claim summary',
      'claims processed',
      'insurance summary',
      'benefit explanation',
    ],
  },
  medium: {
    weight: 5,
    terms: [
      'allowed amount',
      'plan paid',
      'insurance paid',
      'member responsibility',
      'what you owe',
      'claim number',
      'processed date',
      'amount covered',
      'coinsurance',
      'copay applied',
      'deductible applied',
      'provider discount',
      'network discount',
    ],
  },
  weak: {
    weight: 2,
    terms: ['claim', 'coverage', 'benefit', 'network', 'in-network', 'out-of-network'],
  },
};

// STRONG NEGATIVE INDICATORS - Immediate disqualification if 2+ found
const STRONG_NEGATIVE_INDICATORS = [
  'construction',
  'contractor',
  'chapter',
  'isbn',
  'copyright',
  'restaurant',
  'menu',
  'mortgage',
  'lease agreement',
  'rental agreement',
  'plumbing',
  'electrical',
  'roofing',
  'automotive',
  'car repair',
  'home improvement',
  'landscaping',
  'real estate',
  'property tax',
  'utility bill',
  'phone bill',
  'internet bill',
  'cable bill',
];

// REQUIRED ELEMENTS - Medical document must have at least 3 of 4 categories
const REQUIRED_ELEMENTS = {
  patient_info: {
    bonus: 15,
    terms: [
      'patient name',
      'patient:',
      'member id',
      'account number',
      'medical record',
      'mrn',
      'dob',
      'date of birth',
      'subscriber',
      'dependent',
      'insured',
    ],
  },
  provider_info: {
    bonus: 15,
    terms: [
      'provider',
      'physician',
      'doctor',
      'clinic',
      'hospital',
      'npi',
      'tax id',
      'facility',
      'medical center',
      'healthcare',
      'health system',
    ],
  },
  medical_services: {
    bonus: 15,
    terms: [
      'service date',
      'date of service',
      'procedure',
      'diagnosis',
      'cpt',
      'icd',
      'office visit',
      'exam',
      'treatment',
      'lab',
      'x-ray',
      'radiology',
      'surgery',
    ],
  },
  financial_info: {
    bonus: 15,
    terms: [
      'charge',
      'amount',
      'total',
      'balance',
      'payment',
      'insurance',
      'copay',
      'deductible',
      'billed',
      'cost',
      'fee',
    ],
  },
};

// Classification thresholds
const THRESHOLDS = {
  medical_bill_min_score: 30,
  eob_min_score: 25,
  required_categories_min: 3,
  disqualification_negative_count: 2,
};

// ═══════════════════════════════════════════════════════════════════
// CLASSIFICATION LOGIC
// ═══════════════════════════════════════════════════════════════════

interface ClassificationMatrix {
  // Phase 1: Disqualification
  negative_indicators_found: string[];
  disqualified: boolean;

  // Phase 2: Required Elements
  required_categories: {
    patient_info: { found: boolean; matches: string[] };
    provider_info: { found: boolean; matches: string[] };
    medical_services: { found: boolean; matches: string[] };
    financial_info: { found: boolean; matches: string[] };
  };
  required_categories_score: number;
  has_minimum_required: boolean;

  // Phase 3: Type Scoring
  bill_score: {
    strong_matches: IndicatorMatch[];
    medium_matches: IndicatorMatch[];
    weak_matches: IndicatorMatch[];
    total: number;
  };
  eob_score: {
    strong_matches: IndicatorMatch[];
    medium_matches: IndicatorMatch[];
    weak_matches: IndicatorMatch[];
    total: number;
    has_not_a_bill_phrase: boolean;
  };

  // Phase 4: Final Determination
  final_type: DocumentType;
  confidence: number;
  reasoning: string;
}

function findMatches(text: string, terms: string[]): string[] {
  return terms.filter((term) => text.includes(term.toLowerCase()));
}

function classifyDocument(extractedText: string): ClassificationMatrix {
  const text = extractedText.toLowerCase();

  // Initialize matrix
  const matrix: ClassificationMatrix = {
    negative_indicators_found: [],
    disqualified: false,
    required_categories: {
      patient_info: { found: false, matches: [] },
      provider_info: { found: false, matches: [] },
      medical_services: { found: false, matches: [] },
      financial_info: { found: false, matches: [] },
    },
    required_categories_score: 0,
    has_minimum_required: false,
    bill_score: {
      strong_matches: [],
      medium_matches: [],
      weak_matches: [],
      total: 0,
    },
    eob_score: {
      strong_matches: [],
      medium_matches: [],
      weak_matches: [],
      total: 0,
      has_not_a_bill_phrase: false,
    },
    final_type: 'INVALID',
    confidence: 0,
    reasoning: '',
  };

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 1: DISQUALIFICATION CHECK
  // ═══════════════════════════════════════════════════════════════════

  matrix.negative_indicators_found = findMatches(text, STRONG_NEGATIVE_INDICATORS);
  matrix.disqualified = matrix.negative_indicators_found.length >= THRESHOLDS.disqualification_negative_count;

  if (matrix.disqualified) {
    matrix.final_type = 'INVALID';
    matrix.confidence = 90;
    matrix.reasoning = `Disqualified: ${matrix.negative_indicators_found.length} strong negative indicators found (${matrix.negative_indicators_found.join(', ')})`;
    return matrix;
  }

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 2: REQUIRED ELEMENTS CHECK
  // ═══════════════════════════════════════════════════════════════════

  for (const [category, config] of Object.entries(REQUIRED_ELEMENTS)) {
    const matches = findMatches(text, config.terms);
    const categoryKey = category as keyof typeof matrix.required_categories;
    matrix.required_categories[categoryKey] = {
      found: matches.length > 0,
      matches,
    };
  }

  matrix.required_categories_score = Object.values(matrix.required_categories).filter((c) => c.found).length;
  matrix.has_minimum_required = matrix.required_categories_score >= THRESHOLDS.required_categories_min;

  if (!matrix.has_minimum_required) {
    matrix.final_type = 'INVALID';
    matrix.confidence = 80;
    matrix.reasoning = `Insufficient medical content: only ${matrix.required_categories_score}/4 required categories found`;
    return matrix;
  }

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 3: TYPE SCORING
  // ═══════════════════════════════════════════════════════════════════

  // Score BILL indicators
  for (const match of findMatches(text, BILL_INDICATORS.strong.terms)) {
    matrix.bill_score.strong_matches.push({
      indicator: match,
      weight: BILL_INDICATORS.strong.weight,
      category: 'strong',
    });
  }
  for (const match of findMatches(text, BILL_INDICATORS.medium.terms)) {
    matrix.bill_score.medium_matches.push({
      indicator: match,
      weight: BILL_INDICATORS.medium.weight,
      category: 'medium',
    });
  }
  for (const match of findMatches(text, BILL_INDICATORS.weak.terms)) {
    matrix.bill_score.weak_matches.push({
      indicator: match,
      weight: BILL_INDICATORS.weak.weight,
      category: 'weak',
    });
  }

  // Calculate bill total
  matrix.bill_score.total =
    matrix.bill_score.strong_matches.reduce((sum, m) => sum + m.weight, 0) +
    matrix.bill_score.medium_matches.reduce((sum, m) => sum + m.weight, 0) +
    matrix.bill_score.weak_matches.reduce((sum, m) => sum + m.weight, 0);

  // Add required category bonus to bill score
  for (const [category, data] of Object.entries(matrix.required_categories)) {
    if (data.found) {
      const bonus = REQUIRED_ELEMENTS[category as keyof typeof REQUIRED_ELEMENTS].bonus;
      matrix.bill_score.total += bonus;
    }
  }

  // Score EOB indicators
  for (const match of findMatches(text, EOB_INDICATORS.strong.terms)) {
    matrix.eob_score.strong_matches.push({
      indicator: match,
      weight: EOB_INDICATORS.strong.weight,
      category: 'strong',
    });
  }
  for (const match of findMatches(text, EOB_INDICATORS.medium.terms)) {
    matrix.eob_score.medium_matches.push({
      indicator: match,
      weight: EOB_INDICATORS.medium.weight,
      category: 'medium',
    });
  }
  for (const match of findMatches(text, EOB_INDICATORS.weak.terms)) {
    matrix.eob_score.weak_matches.push({
      indicator: match,
      weight: EOB_INDICATORS.weak.weight,
      category: 'weak',
    });
  }

  // Check for "this is not a bill" phrase - special handling
  matrix.eob_score.has_not_a_bill_phrase =
    text.includes('this is not a bill') || text.includes('not a bill');

  // Calculate EOB total
  matrix.eob_score.total =
    matrix.eob_score.strong_matches.reduce((sum, m) => sum + m.weight, 0) +
    matrix.eob_score.medium_matches.reduce((sum, m) => sum + m.weight, 0) +
    matrix.eob_score.weak_matches.reduce((sum, m) => sum + m.weight, 0);

  // Add "not a bill" bonus (15 points as per user framework)
  if (matrix.eob_score.has_not_a_bill_phrase) {
    matrix.eob_score.total += 15;
  }

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 4: FINAL TYPE DETERMINATION
  // ═══════════════════════════════════════════════════════════════════

  const billScore = matrix.bill_score.total;
  const eobScore = matrix.eob_score.total;

  // Decision matrix based on user's framework:
  // 1. If EOB has strong indicator OR "not a bill" phrase → EOB (high confidence)
  // 2. If EOB score > bill score AND EOB score >= threshold → EOB
  // 3. If bill score >= threshold → MEDICAL_BILL
  // 4. Otherwise → INVALID (insufficient indicators)

  if (matrix.eob_score.has_not_a_bill_phrase || matrix.eob_score.strong_matches.length > 0) {
    // Strong EOB signal
    matrix.final_type = 'EOB';
    matrix.confidence = 90;
    matrix.reasoning = matrix.eob_score.has_not_a_bill_phrase
      ? `Document explicitly states "this is not a bill"`
      : `Strong EOB indicator found: ${matrix.eob_score.strong_matches[0]?.indicator}`;
  } else if (eobScore > billScore && eobScore >= THRESHOLDS.eob_min_score) {
    // EOB wins on score
    matrix.final_type = 'EOB';
    matrix.confidence = Math.min(85, 60 + Math.floor((eobScore - billScore) / 2));
    matrix.reasoning = `EOB score (${eobScore}) > Bill score (${billScore})`;
  } else if (billScore >= THRESHOLDS.medical_bill_min_score) {
    // Bill wins
    matrix.final_type = 'MEDICAL_BILL';
    matrix.confidence = Math.min(95, 70 + Math.floor(billScore / 10));
    matrix.reasoning = `Bill score (${billScore}) meets threshold (${THRESHOLDS.medical_bill_min_score})`;
  } else {
    // Neither meets threshold - still classify as bill if required elements present
    // (user indicated required elements are a baseline)
    matrix.final_type = 'MEDICAL_BILL';
    matrix.confidence = 70;
    matrix.reasoning = `Required medical elements present (${matrix.required_categories_score}/4), defaulting to medical bill`;
  }

  return matrix;
}

// ═══════════════════════════════════════════════════════════════════
// API ROUTE
// ═══════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    console.log('[API /classify] Request received');
    const body = await request.json();
    const { extracted_text } = body;

    if (!extracted_text) {
      console.error('[API /classify] ERROR: No extracted text provided');
      return NextResponse.json({ success: false, error: 'No extracted text provided' }, { status: 400 });
    }

    console.log('[API /classify] Classifying document (text length:', extracted_text.length, 'chars)');

    // Run deterministic classification
    const matrix = classifyDocument(extracted_text);

    // Log classification matrix (dev mode logging)
    console.log('\n[API /classify] ═══════════════════════════════════════════════════════');
    console.log('[API /classify] CLASSIFICATION MATRIX');
    console.log('[API /classify] ═══════════════════════════════════════════════════════');

    console.log('[API /classify] PHASE 1 - Disqualification Check:');
    console.log('[API /classify]   Negative indicators found:', matrix.negative_indicators_found.length > 0 ? matrix.negative_indicators_found.join(', ') : 'none');
    console.log('[API /classify]   Disqualified:', matrix.disqualified);

    console.log('[API /classify] PHASE 2 - Required Elements:');
    for (const [category, data] of Object.entries(matrix.required_categories)) {
      console.log(`[API /classify]   ${category}: ${data.found ? '✓' : '✗'} (${data.matches.length > 0 ? data.matches.slice(0, 3).join(', ') : 'no matches'})`);
    }
    console.log('[API /classify]   Score:', matrix.required_categories_score, '/4');
    console.log('[API /classify]   Has minimum required:', matrix.has_minimum_required);

    console.log('[API /classify] PHASE 3 - Type Scoring:');
    console.log('[API /classify]   BILL Score:', matrix.bill_score.total);
    console.log('[API /classify]     Strong matches:', matrix.bill_score.strong_matches.length, matrix.bill_score.strong_matches.length > 0 ? `(${matrix.bill_score.strong_matches.map((m) => m.indicator).join(', ')})` : '');
    console.log('[API /classify]     Medium matches:', matrix.bill_score.medium_matches.length);
    console.log('[API /classify]     Weak matches:', matrix.bill_score.weak_matches.length);
    console.log('[API /classify]   EOB Score:', matrix.eob_score.total);
    console.log('[API /classify]     Strong matches:', matrix.eob_score.strong_matches.length, matrix.eob_score.strong_matches.length > 0 ? `(${matrix.eob_score.strong_matches.map((m) => m.indicator).join(', ')})` : '');
    console.log('[API /classify]     Medium matches:', matrix.eob_score.medium_matches.length);
    console.log('[API /classify]     Weak matches:', matrix.eob_score.weak_matches.length);
    console.log('[API /classify]     "Not a bill" phrase:', matrix.eob_score.has_not_a_bill_phrase);

    console.log('[API /classify] PHASE 4 - Final Determination:');
    console.log('[API /classify]   Type:', matrix.final_type);
    console.log('[API /classify]   Confidence:', matrix.confidence + '%');
    console.log('[API /classify]   Reasoning:', matrix.reasoning);
    console.log('[API /classify] ═══════════════════════════════════════════════════════\n');

    // Generate user message based on type
    let userMessage: string;
    let canAnalyze: boolean;

    switch (matrix.final_type) {
      case 'INVALID':
        canAnalyze = false;
        userMessage = matrix.disqualified
          ? 'This does not appear to be a medical document. Please upload a medical bill or statement from your healthcare provider.'
          : 'This document does not contain enough medical billing information. Please upload a complete medical bill or statement.';
        break;

      case 'EOB':
        canAnalyze = true;
        userMessage =
          'This appears to be an Explanation of Benefits (EOB) from your insurance company. For best results, upload the actual medical bill from your provider. You can continue with this EOB, but analysis may be less accurate.';
        break;

      case 'MEDICAL_BILL':
      default:
        canAnalyze = true;
        userMessage = 'Medical bill detected. Proceeding with analysis...';
        break;
    }

    console.log('[API /classify] Result:', matrix.final_type, `(confidence: ${matrix.confidence}%)`);

    return NextResponse.json({
      success: true,
      data: {
        type: matrix.final_type,
        confidence: matrix.confidence,
        can_analyze: canAnalyze,
        user_message: userMessage,
        // Include matrix details for debugging (can be stripped in production)
        _debug: {
          bill_score: matrix.bill_score.total,
          eob_score: matrix.eob_score.total,
          required_categories: matrix.required_categories_score,
          reasoning: matrix.reasoning,
        },
      },
    });
  } catch (error) {
    console.error('Classification API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'We encountered an issue classifying your document. Please try again.',
      },
      { status: 500 }
    );
  }
}