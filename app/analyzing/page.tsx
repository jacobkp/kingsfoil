'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBillData } from '@/lib/BillContext';
import ProcessingStep from '@/components/ProcessingStep';
import { ProcessingStep as ProcessingStepType, DocumentClassification } from '@/lib/types';

const STEPS: ProcessingStepType[] = [
  {
    id: 1,
    title: 'Reading Your Bill',
    description: 'Extracting text and data from your medical bill',
    estimatedTime: 8,
    status: 'pending',
  },
  {
    id: 2,
    title: 'Verifying Document Type',
    description: 'Checking if this is a medical bill or EOB',
    estimatedTime: 3,
    status: 'pending',
  },
  {
    id: 3,
    title: 'Understanding Line Items',
    description: 'Translating medical codes into plain English',
    estimatedTime: 10,
    status: 'pending',
  },
  {
    id: 4,
    title: 'Checking for Billing Errors',
    description: 'Analyzing charges for duplicates, unbundling, and violations',
    estimatedTime: 12,
    status: 'pending',
  },
  {
    id: 5,
    title: 'Finalizing Results',
    description: 'Preparing your personalized report',
    estimatedTime: 3,
    status: 'pending',
  },
];

export default function AnalyzingPage() {
  const router = useRouter();
  const { billData, updateBillData } = useBillData();
  const [steps, setSteps] = useState<ProcessingStepType[]>(STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showEOBWarning, setShowEOBWarning] = useState(false);
  const [eobClassification, setEobClassification] = useState<DocumentClassification | null>(null);

  useEffect(() => {
    // Redirect if no file
    if (!billData.file) {
      router.push('/');
      return;
    }

    // Start processing
    processBill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processBill = async () => {
    try {
      console.log('[Processing] Starting bill processing...');

      // Step 1: Extract bill data
      setSteps((prev) =>
        prev.map((s, idx) => (idx === 0 ? { ...s, status: 'in_progress' } : s))
      );
      setCurrentStepIndex(0);
      setProgress(10);

      console.log('[Step 1/5] Extracting bill data...');
      const { data: extractedData, extracted_text } = await extractBillData();
      console.log('[Step 1/5] Extraction complete. Line items found:', extractedData?.line_items?.length || 0);

      // Validate extraction results
      if (!extractedData || !extractedData.line_items || extractedData.line_items.length === 0) {
        console.error('[Step 1/5] ERROR: No line items found in extraction');
        throw new Error('We could not extract line items from this document. This may not be a valid medical bill. Please try a different document.');
      }

      setSteps((prev) =>
        prev.map((s, idx) => (idx === 0 ? { ...s, status: 'completed' } : s))
      );
      setProgress(20);

      // Step 2: Classify document
      setSteps((prev) =>
        prev.map((s, idx) => (idx === 1 ? { ...s, status: 'in_progress' } : s))
      );
      setCurrentStepIndex(1);

      console.log('[Step 2/5] Classifying document type...');
      const classification = await classifyDocument(extracted_text);
      console.log('[Step 2/5] Classification result:', classification.type, `(confidence: ${classification.confidence}%)`);

      // Check if document can be analyzed
      if (!classification.can_analyze) {
        console.error('[Step 2/5] ERROR: Document cannot be analyzed -', classification.user_message);
        throw new Error(classification.user_message);
      }

      // If EOB detected, show warning and pause
      if (classification.type === 'EOB') {
        console.warn('[Step 2/5] EOB detected - pausing for user decision');
        setEobClassification(classification);
        setShowEOBWarning(true);
        setSteps((prev) =>
          prev.map((s, idx) => (idx === 1 ? { ...s, status: 'completed' } : s))
        );
        return; // Stop here until user decides
      }

      // Store classification in context
      updateBillData({ classification });
      console.log('[Step 2/5] Document classified as:', classification.type);

      setSteps((prev) =>
        prev.map((s, idx) => (idx === 1 ? { ...s, status: 'completed' } : s))
      );
      setProgress(30);

      // Step 3: Explain line items
      setSteps((prev) =>
        prev.map((s, idx) => (idx === 2 ? { ...s, status: 'in_progress' } : s))
      );
      setCurrentStepIndex(2);

      console.log('[Step 3/5] Explaining', extractedData.line_items.length, 'line items...');
      const explanations = await explainLineItems(extractedData.line_items);
      console.log('[Step 3/5] Explanations complete. Received', explanations.length, 'explanations');

      // Add explanations to line items
      const enrichedBill = {
        ...extractedData,
        
        line_items: extractedData.line_items.map((item: any, idx: number) => ({
          ...item,
          plain_english_explanation: explanations[idx],
        })),
      };

      setSteps((prev) =>
        prev.map((s, idx) => (idx === 2 ? { ...s, status: 'completed' } : s))
      );
      setProgress(60);

      // Step 4: Analyze for errors
      setSteps((prev) =>
        prev.map((s, idx) => (idx === 3 ? { ...s, status: 'in_progress' } : s))
      );
      setCurrentStepIndex(3);

      console.log('[Step 4/5] Analyzing bill for errors...');
      const analysisResult = await analyzeBill(enrichedBill, billData.userContext, classification);
      console.log('[Step 4/5] Analysis complete. Errors found:', analysisResult?.all_errors?.length || 0);

      setSteps((prev) =>
        prev.map((s, idx) => (idx === 3 ? { ...s, status: 'completed' } : s))
      );
      setProgress(90);

      // Step 5: Finalize
      setSteps((prev) =>
        prev.map((s, idx) => (idx === 4 ? { ...s, status: 'in_progress' } : s))
      );
      setCurrentStepIndex(4);

      console.log('[Step 5/5] Finalizing results...');
      // Store results in context
      updateBillData({
        extracted: enrichedBill,
        analysis: analysisResult,
      });

      setSteps((prev) =>
        prev.map((s, idx) => (idx === 4 ? { ...s, status: 'completed' } : s))
      );
      setProgress(100);

      console.log('[Processing] Complete! Navigating to results page...');
      // Navigate to results
      setTimeout(() => {
        router.push('/results');
      }, 500);
    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
      setSteps((prev) =>
        prev.map((s, idx) =>
          idx === currentStepIndex ? { ...s, status: 'error' } : s
        )
      );
    }
  };

  const extractBillData = async () => {
    const formData = new FormData();
    formData.append('file', billData.file!);

    const response = await fetch('/api/extract', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to extract bill data');
    }

    return { data: result.data, extracted_text: result.extracted_text };
  };

  const classifyDocument = async (extractedText: string): Promise<DocumentClassification> => {
    const response = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extracted_text: extractedText }),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to classify document');
    }

    return result.data;
  };

  
  const explainLineItems = async (lineItems: any[]) => {
    const response = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line_items: lineItems }),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to explain line items');
    }

    return result.explanations;
  };

  
  const analyzeBill = async (
    billData: any,
    userContext: string | null | undefined,
    classification: DocumentClassification
  ) => {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        extracted_bill: billData,
        user_context: userContext || null,
        classification: classification,
      }),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to analyze bill');
    }

    return result.data;
  };

  const continueWithEOB = async () => {
    if (!eobClassification) return;

    setShowEOBWarning(false);
    setProgress(30);

    // Store classification in context
    updateBillData({ classification: eobClassification });

    // Continue with the rest of the processing
    try {
      const { data: extractedData, extracted_text } = await extractBillData();

      // Step 3: Explain line items
      setSteps((prev) =>
        prev.map((s, idx) => (idx === 2 ? { ...s, status: 'in_progress' } : s))
      );
      setCurrentStepIndex(2);

      const explanations = await explainLineItems(extractedData.line_items);

      const enrichedBill = {
        ...extractedData,
        
        line_items: extractedData.line_items.map((item: any, idx: number) => ({
          ...item,
          plain_english_explanation: explanations[idx],
        })),
      };

      setSteps((prev) =>
        prev.map((s, idx) => (idx === 2 ? { ...s, status: 'completed' } : s))
      );
      setProgress(60);

      // Step 4: Analyze for errors
      setSteps((prev) =>
        prev.map((s, idx) => (idx === 3 ? { ...s, status: 'in_progress' } : s))
      );
      setCurrentStepIndex(3);

      const analysisResult = await analyzeBill(enrichedBill, billData.userContext, eobClassification);

      setSteps((prev) =>
        prev.map((s, idx) => (idx === 3 ? { ...s, status: 'completed' } : s))
      );
      setProgress(90);

      // Step 5: Finalize
      setSteps((prev) =>
        prev.map((s, idx) => (idx === 4 ? { ...s, status: 'in_progress' } : s))
      );
      setCurrentStepIndex(4);

      updateBillData({
        extracted: enrichedBill,
        analysis: analysisResult,
      });

      setSteps((prev) =>
        prev.map((s, idx) => (idx === 4 ? { ...s, status: 'completed' } : s))
      );
      setProgress(100);

      setTimeout(() => {
        router.push('/results');
      }, 500);
    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
      setSteps((prev) =>
        prev.map((s, idx) =>
          idx === currentStepIndex ? { ...s, status: 'error' } : s
        )
      );
    }
  };

  const totalEstimatedTime = STEPS.reduce((sum, step) => sum + step.estimatedTime, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Analyzing Your {eobClassification?.type === 'EOB' ? 'EOB' : 'Bill'}
            </h1>
            <p className="text-gray-600">
              Usually takes {totalEstimatedTime}-{totalEstimatedTime + 10} seconds
            </p>
            {eobClassification?.type === 'EOB' && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-lg group relative">
                <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-xs font-medium text-amber-800">
                  Analyzing EOB - Results may be limited
                </span>
                <svg className="h-3.5 w-3.5 text-amber-600 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>

                {/* Tooltip */}
                <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                  <div className="space-y-2">
                    <p className="font-semibold">What&apos;s an EOB?</p>
                    <p>An <strong>Explanation of Benefits (EOB)</strong> is a document from your insurance company showing what they paid, not a bill from your doctor.</p>
                    <p className="text-amber-200">For best results, upload the actual medical bill from your healthcare provider instead.</p>
                  </div>
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1A6354] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center mt-2">{progress}% complete</p>
          </div>

          {/* Processing steps */}
          <div className="space-y-6">
            {steps.map((step) => (
              <ProcessingStep key={step.id} step={step} />
            ))}
          </div>

          {/* EOB Warning Modal */}
          {showEOBWarning && eobClassification && (
            <div className="mt-6 p-5 bg-amber-50 border-2 border-amber-300 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-amber-900 mb-2">
                    Explanation of Benefits (EOB) Detected
                  </h3>
                  <p className="text-sm text-amber-800 mb-4">
                    {eobClassification.user_message}
                  </p>
                  <div className="bg-white border border-amber-200 rounded-md p-3 mb-4">
                    <p className="text-xs text-gray-700">
                      <strong>What&apos;s the difference?</strong><br />
                      <strong>Medical Bill:</strong> From your doctor/hospital requesting payment<br />
                      <strong>EOB:</strong> From your insurance showing what they paid
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push('/')}
                      className="px-4 py-2 bg-white border border-amber-600 text-amber-700 rounded-lg hover:bg-amber-50 font-medium text-sm transition-colors"
                    >
                      Upload Medical Bill Instead
                    </button>
                    <button
                      onClick={continueWithEOB}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm transition-colors"
                    >
                      Continue with EOB Anyway
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium mb-2">Analysis Failed</p>
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="mt-3 text-sm text-[#1A6354] hover:text-[#0f4a3f] font-medium"
              >
                {'\u2190'} Try another bill
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
