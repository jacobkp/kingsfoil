'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBillData } from '@/lib/BillContext';
import Link from 'next/link';

export default function DisputePage() {
  const router = useRouter();
  const { billData } = useBillData();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Redirect if no data
    if (!billData.extracted || !billData.analysis) {
      router.push('/');
    }
  }, [billData, router]);

  if (!billData.extracted || !billData.analysis) {
    return null;
  }

  const { extracted, analysis } = billData;
  const { provider, patient, bill_summary } = extracted;
  const { line_items_with_errors, cross_line_errors, all_errors, summary } = analysis;

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Use new structure if available, fallback to legacy
  const errorsToUse = all_errors || [];
  const hasNSAViolation = errorsToUse.some((e) => e.type === 'nsa_violation');

  // Build error list for letter
  let errorNumber = 1;
  const errorDescriptions: string[] = [];

  // Line-specific errors (grouped by line)
  if (line_items_with_errors && line_items_with_errors.length > 0) {
    line_items_with_errors.forEach((lineWithErrors) => {
      lineWithErrors.errors.forEach((error) => {
        const lineRef = `Line ${lineWithErrors.line_number}`;
        errorDescriptions.push(
          `${errorNumber}. ${error.full_title} (${lineRef}): ${error.technical_details}\n   Amount in question: $${error.potential_savings.toFixed(2)}`
        );
        errorNumber++;
      });
    });
  }

  // Cross-line errors
  if (cross_line_errors && cross_line_errors.length > 0) {
    cross_line_errors.forEach((error) => {
      const lineRef = error.affected_lines
        ? `Lines ${error.affected_lines.join(', ')}`
        : 'Multiple lines';
      errorDescriptions.push(
        `${errorNumber}. ${error.full_title} (${lineRef}): ${error.technical_details}\n   Amount in question: $${error.potential_savings.toFixed(2)}`
      );
      errorNumber++;
    });
  }

  const letterContent = `${today}

${provider.name}
${provider.address}
Attention: Billing Department

RE: Billing Dispute - Patient: ${patient.name}, Date of Service: ${new Date(
    bill_summary.service_date_start
  ).toLocaleDateString()}, Bill #: ${bill_summary.bill_number || 'N/A'}

Dear Billing Department,

I am writing to dispute charges on the above-referenced bill. Upon careful review, I have identified the following discrepancies:

${errorDescriptions.join('\n\n')}
${
  hasNSAViolation
    ? `\nAdditionally, this bill appears to violate the No Surprises Act (42 USC §300gg-111), which prohibits balance billing for emergency services and out-of-network ancillary services at in-network facilities.`
    : ''
}

I request the following:
- Immediate correction of the above errors
- Revised bill reflecting accurate charges
- Removal of any amounts sent to collections related to disputed charges

I am prepared to pay the corrected amount promptly upon receipt of a revised statement.

Please respond within 30 days as required by law. I can be reached at [YOUR CONTACT INFO].

Sincerely,
${patient.name}

Enclosures: Original bill, itemized statement (requested)`;

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(letterContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const blob = new Blob([letterContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dispute-letter-${patient.name.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(
      `Billing Dispute - ${patient.name} - ${bill_summary.bill_number || 'N/A'}`
    );
    const body = encodeURIComponent(letterContent);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header (hide on print) */}
        <div className="mb-8 print:hidden">
          <nav className="mb-4">
            <Link
              href="/errors"
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              {'\u2190'} Back to Error Report
            </Link>
          </nav>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dispute Letter</h1>
          <p className="text-gray-600">
            Professional dispute letter ready to send to {provider.name}
          </p>
        </div>

        {/* Action Buttons (hide on print) */}
        <div className="mb-6 flex flex-wrap gap-3 print:hidden">
          <button
            onClick={handleCopyToClipboard}
            className="py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>

          <button
            onClick={handlePrint}
            className="py-2 px-4 border-2 border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
            </svg>
            Print / Save as PDF
          </button>

          <button
            onClick={handleDownloadText}
            className="py-2 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Download as Text
          </button>

          <button
            onClick={handleEmail}
            className="py-2 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            Send via Email
          </button>
        </div>

        {/* Letter Preview */}
        <div className="bg-white rounded-lg shadow-2xl p-12 print:shadow-none print:p-0">
          <div className="max-w-3xl mx-auto">
            <div className="whitespace-pre-wrap font-serif text-base leading-relaxed text-gray-900">
              {letterContent}
            </div>
          </div>
        </div>

        {/* Info Box (hide on print) */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 print:hidden">
          <h3 className="font-bold text-blue-900 mb-2">Next Steps:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>Review the letter and add your contact information where indicated</li>
            <li>
              Keep a copy of this letter and all supporting documents for your records
            </li>
            <li>
              Send via certified mail with return receipt requested for proof of delivery
            </li>
            <li>
              Follow up if you don&apos;t receive a response within 30 days
            </li>
            <li>
              Consider filing a complaint with your state&apos;s insurance commissioner if the
              issue isn&apos;t resolved
            </li>
          </ol>
        </div>

        {/* Summary Card (hide on print) */}
        <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-xl p-6 border-2 border-green-200 print:hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 font-medium mb-1">
                Total Amount You&apos;re Disputing
              </p>
              <p className="text-4xl font-bold text-green-600">
                ${summary.total_potential_savings.toFixed(2)}
              </p>
              <p className="text-green-700 text-sm mt-1">
                Based on {summary.total_errors_found} error{summary.total_errors_found !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
