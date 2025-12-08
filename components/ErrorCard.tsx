'use client';

import { BillingError } from '@/lib/types';
import { useState } from 'react';

interface ErrorCardProps {
  error: BillingError;
}

const severityColors = {
  critical: 'border-red-600 bg-red-50',
  high: 'border-orange-500 bg-orange-50',
  medium: 'border-yellow-500 bg-yellow-50',
  low: 'border-blue-500 bg-blue-50',
};

const severityIcons = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵',
};

const errorTypeLabels: Record<string, string> = {
  duplicate_charge: 'Duplicate Charge',
  unbundling: 'Unbundling Violation',
  nsa_violation: 'No Surprises Act Violation',
  balance_billing: 'Balance Billing',
  math_error: 'Math Error',
  upcoding: 'Upcoding',
  invalid_code: 'Invalid Code',
};

export default function ErrorCard({ error }: ErrorCardProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    technical: false,
    action: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div
      className={`border-l-4 rounded-lg p-6 shadow-md mb-4 ${severityColors[error.severity]}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{severityIcons[error.severity]}</span>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-gray-900">{error.full_title}</h3>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700">
                {errorTypeLabels[error.type] || error.type}
              </span>
            </div>
            {error.affected_lines && error.affected_lines.length > 0 && (
              <p className="text-sm text-gray-600">
                Affects lines: {error.affected_lines.join(', ')}
              </p>
            )}
          </div>
        </div>
        {error.potential_savings > 0 && (
          <div className="text-right">
            <p className="text-sm text-gray-600">Potential Savings</p>
            <p className="text-2xl font-bold text-green-600">
              ${error.potential_savings.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* What this means (always visible) */}
      <div className="mb-4">
        <h4 className="font-bold text-sm text-gray-700 mb-2">What this means:</h4>
        <p className="text-gray-700">{error.detailed_explanation}</p>
      </div>

      {/* Confidence score */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Confidence:</span>
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden max-w-xs">
            <div
              className="h-full bg-indigo-600"
              style={{ width: `${error.confidence}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">{error.confidence}%</span>
        </div>
      </div>

      {/* What to do about it (expandable) */}
      <div className="mb-3">
        <button
          onClick={() => toggleSection('action')}
          className="flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${
              expandedSections.action ? 'rotate-90' : ''
            }`}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M9 5l7 7-7 7"></path>
          </svg>
          What to do about it
        </button>
        {expandedSections.action && (
          <div className="mt-2 pl-6 text-gray-700">{error.recommended_action}</div>
        )}
      </div>

      {/* Technical details (expandable) */}
      {error.technical_details && (
        <div className="mb-3">
          <button
            onClick={() => toggleSection('technical')}
            className="flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${
                expandedSections.technical ? 'rotate-90' : ''
              }`}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 5l7 7-7 7"></path>
            </svg>
            Technical details
          </button>
          {expandedSections.technical && (
            <div className="mt-2 pl-6 text-sm text-gray-600 bg-gray-100 p-3 rounded">
              {error.technical_details}
            </div>
          )}
        </div>
      )}

      {/* Regulatory citation */}
      {error.regulatory_citation && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Legal basis:</span> {error.regulatory_citation}
          </p>
        </div>
      )}
    </div>
  );
}
