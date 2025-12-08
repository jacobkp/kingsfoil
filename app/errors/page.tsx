'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBillData } from '@/lib/BillContext';
import ErrorCard from '@/components/ErrorCard';
import Link from 'next/link';

export default function ErrorsPage() {
  const router = useRouter();
  const { billData } = useBillData();

  useEffect(() => {
    // Redirect if no data
    if (!billData.extracted || !billData.analysis) {
      router.push('/');
    }
  }, [billData, router]);

  if (!billData.extracted || !billData.analysis) {
    return null;
  }

  const { analysis } = billData;
  const { errors = [], summary } = analysis;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link
            href="/results"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            {'\u2190'} Back to Results
          </Link>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Detailed Error Analysis
          </h1>
          <p className="text-gray-600 text-lg">
            Found {summary.total_errors_found} issue{summary.total_errors_found !== 1 ? 's' : ''}{' '}
            {summary.total_potential_savings > 0 && (
              <span>
                totaling{' '}
                <span className="font-bold text-green-600">
                  ${summary.total_potential_savings.toFixed(2)}
                </span>{' '}
                in potential overcharges
              </span>
            )}
          </p>
        </div>

        {/* Error Cards */}
        {errors.length > 0 ? (
          <div className="space-y-4 mb-8">
            {errors.map((error) => (
              <ErrorCard key={error.error_id} error={error} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-xl p-12 text-center mb-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-12 h-12 text-white"
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Errors Found</h2>
            <p className="text-gray-600">
              Great news! We didn&apos;t find any billing errors. Your bill appears to be
              accurate.
            </p>
          </div>
        )}

        {/* Footer with Total Savings */}
        {summary.total_potential_savings > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-xl p-8 border-2 border-green-200 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 font-medium mb-1">
                  Total Potential Savings
                </p>
                <p className="text-5xl font-bold text-green-600">
                  ${summary.total_potential_savings.toFixed(2)}
                </p>
              </div>
              <Link href="/dispute">
                <button className="py-3 px-6 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl">
                  Generate Dispute Letter for All Errors →
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Link href="/results">
            <button className="py-3 px-6 border-2 border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors">
              {'\u2190'} Back to Bill View
            </button>
          </Link>
          {summary.total_errors_found > 0 && (
            <Link href="/dispute">
              <button className="py-3 px-6 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Generate Dispute Letter
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
