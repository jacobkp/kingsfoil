'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBillData } from '@/lib/BillContext';
import LineItemRow from '@/components/LineItemRow';
import Link from 'next/link';

export default function ResultsPage() {
  const router = useRouter();
  const { billData, clearBillData } = useBillData();

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
  const { provider, patient, bill_summary, line_items } = extracted;
  const { line_items_with_errors, cross_line_errors, all_errors, summary, errors } = analysis;

  // Use new structure if available, fallback to legacy errors array
  const errorsToDisplay = all_errors || errors || [];
  const hasSavings = summary.total_potential_savings > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (60% width on large screens) */}
          <div className="lg:col-span-2">
            {/* Header Section */}
            <div className="bg-gradient-to-br from-[#1A6354] to-[#0f4a3f] rounded-lg shadow-xl p-6 text-white mb-6">
              <h1 className="text-3xl font-bold mb-4">Bill Analysis Complete</h1>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-teal-100 text-sm">Provider</p>
                  <p className="font-bold text-lg">{provider.name}</p>
                </div>
                <div>
                  <p className="text-teal-100 text-sm">Patient</p>
                  <p className="font-bold text-lg">{patient.name}</p>
                </div>
                <div>
                  <p className="text-teal-100 text-sm">Date of Service</p>
                  <p className="font-bold">
                    {new Date(bill_summary.service_date_start).toLocaleDateString()} -{' '}
                    {new Date(bill_summary.service_date_end).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-teal-100 text-sm">Total Billed</p>
                  <p className="font-bold text-2xl">
                    ${bill_summary.total_charges.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Itemized Bill</h2>
                <p className="text-gray-600 text-sm mt-1">
                  {line_items.length} line item{line_items.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="space-y-4 p-4">
                {line_items.map((item, index) => {
                  // Find errors for this line item
                  const lineErrors = line_items_with_errors?.find(
                    (le) => le.line_number === item.line_number
                  ) || null;

                  return (
                    <LineItemRow
                      key={item.line_number}
                      lineItem={item}
                      lineErrors={lineErrors}
                      globalLineNumber={index + 1}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (40% width on large screens) - Sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Savings Card */}
              {hasSavings && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-xl p-6 border-2 border-green-200">
                  <div className="text-center">
                    <p className="text-green-700 font-medium text-sm mb-2">
                      Potential Savings
                    </p>
                    <p className="text-5xl font-bold text-green-600 mb-2">
                      ${summary.total_potential_savings.toFixed(2)}
                    </p>
                    <p className="text-green-700 text-sm">
                      Based on {summary.total_errors_found} error{summary.total_errors_found !== 1 ? 's' : ''} found
                    </p>
                  </div>
                </div>
              )}

              {/* No Errors Card */}
              {!hasSavings && summary.total_errors_found === 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-xl p-6 border-2 border-green-200">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-10 h-10 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-green-800 mb-2">
                      Great News!
                    </h3>
                    <p className="text-green-700">
                      We didn&apos;t find any billing errors. Your bill appears to be accurate.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Summary Card */}
              {summary.total_errors_found > 0 && (
                <div className="bg-white rounded-lg shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Error Summary</h3>

                  <div className="mb-4">
                    <p className="text-gray-700 text-sm mb-2">Total errors found</p>
                    <p className="text-3xl font-bold text-red-600">
                      {summary.total_errors_found || 0}
                    </p>
                  </div>

                  {/* Breakdown by severity */}
                  <div className="space-y-2 mb-6">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">
                      By Severity
                    </h4>
                    {summary.by_severity?.critical > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">🔴</span>
                          <span className="text-gray-700">Critical</span>
                        </span>
                        <span className="font-bold text-gray-900">
                          {summary.by_severity.critical}
                        </span>
                      </div>
                    )}
                    {summary.by_severity?.high > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">🟠</span>
                          <span className="text-gray-700">High</span>
                        </span>
                        <span className="font-bold text-gray-900">{summary.by_severity.high}</span>
                      </div>
                    )}
                    {summary.by_severity?.medium > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">🟡</span>
                          <span className="text-gray-700">Medium</span>
                        </span>
                        <span className="font-bold text-gray-900">
                          {summary.by_severity.medium}
                        </span>
                      </div>
                    )}
                    {summary.by_severity?.low > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">🔵</span>
                          <span className="text-gray-700">Low</span>
                        </span>
                        <span className="font-bold text-gray-900">{summary.by_severity.low}</span>
                      </div>
                    )}
                  </div>

                  {/* Error categories */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">
                      Error Categories
                    </h4>
                    <div className="space-y-1">
                      {summary.by_type && Object.entries(summary.by_type).map(([type, count]) => {
                        const label = type
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase());
                        return (
                          <div
                            key={type}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-gray-700">{label}</span>
                            <span className="text-gray-900 font-medium">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    <Link href="/errors">
                      <button className="w-full py-3 px-4 bg-[#1A6354] text-white rounded-lg font-medium hover:bg-[#0f4a3f] transition-colors">
                        View Detailed Error Report →
                      </button>
                    </Link>
                    <Link href="/dispute">
                      <button className="w-full py-3 px-4 border-2 border-[#1A6354] text-[#1A6354] rounded-lg font-medium hover:bg-teal-50 transition-colors">
                        Generate Dispute Letter
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Analyze Another Bill */}
              <div className="bg-white rounded-lg shadow-xl p-6">
                <button
                  onClick={() => {
                    clearBillData();
                    router.push('/');
                  }}
                  className="w-full text-[#1A6354] hover:text-[#0f4a3f] font-medium transition-colors"
                >
                  {'\u2190'} Analyze Another Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
