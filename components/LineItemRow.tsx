'use client';

import { useState } from 'react';
import { LineItem, LineItemWithErrors } from '@/lib/types';
import { ChevronDown, ChevronRight, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface LineItemRowProps {
  lineItem: LineItem;
  lineErrors: LineItemWithErrors | null;
  globalLineNumber: number; // Sequential number across all line items
}

const severityConfig = {
  critical: {
    badge: 'bg-red-100 text-red-800 border-red-300',
    icon: AlertCircle,
    iconColor: 'text-red-600',
    bar: 'bg-red-500',
  },
  high: {
    badge: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    bar: 'bg-orange-500',
  },
  medium: {
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    bar: 'bg-yellow-500',
  },
  low: {
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Info,
    iconColor: 'text-blue-600',
    bar: 'bg-blue-500',
  },
};

export default function LineItemRow({ lineItem, lineErrors, globalLineNumber }: LineItemRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasErrors = lineErrors && lineErrors.errors.length > 0;

  // Sort errors by severity (critical > high > medium > low)
  const sortedErrors = lineErrors?.errors.slice().sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  }) || [];

  return (
    <div className={`border rounded-lg ${hasErrors ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
      {/* Main Row */}
      <div
        className={`p-4 cursor-pointer hover:bg-gray-50 ${isExpanded ? 'border-b' : ''}`}
        onClick={() => hasErrors && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          {/* Expand Icon */}
          <div className="flex-shrink-0 pt-1">
            {hasErrors ? (
              isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )
            ) : (
              <div className="w-5 h-5" />
            )}
          </div>

          {/* Line Number */}
          <div className="flex-shrink-0 w-12 text-sm font-medium text-gray-600">
            #{globalLineNumber}
          </div>

          {/* Service Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{lineItem.description}</div>
                {lineItem.plain_english_explanation && (
                  <div className="text-sm text-gray-700 mt-2 italic">
                    "{lineItem.plain_english_explanation}"
                  </div>
                )}
                <div className="text-sm text-gray-500 mt-1 space-x-3">
                  <span>Date: {lineItem.service_date}</span>
                  {lineItem.cpt_code && <span>CPT: {lineItem.cpt_code}</span>}
                  {lineItem.hcpcs_code && <span>HCPCS: {lineItem.hcpcs_code}</span>}
                  <span>Qty: {lineItem.quantity}</span>
                </div>
              </div>

              {/* Charges */}
              <div className="text-right flex-shrink-0">
                <div className="font-semibold text-gray-900">
                  ${lineItem.total_charge.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  ${lineItem.unit_price.toFixed(2)} × {lineItem.quantity}
                </div>
              </div>
            </div>

            {/* Error Badges */}
            {hasErrors && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">
                  {lineErrors.error_count} {lineErrors.error_count === 1 ? 'Error' : 'Errors'} Found:
                </span>
                {sortedErrors.map((error, idx) => {
                  const config = severityConfig[error.severity];
                  const Icon = config.icon;
                  return (
                    <div
                      key={idx}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${config.badge}`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
                      {error.short_title}
                    </div>
                  );
                })}
                {lineErrors.total_line_savings > 0 && (
                  <div className="ml-auto text-sm font-semibold text-green-700">
                    Potential Savings: ${lineErrors.total_line_savings.toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Error Details */}
      {isExpanded && hasErrors && (
        <div className="p-4 bg-white space-y-4">
          {sortedErrors.map((error, idx) => {
            const config = severityConfig[error.severity];
            const Icon = config.icon;

            return (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                {/* Error Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${config.badge}`}>
                    <Icon className={`w-5 h-5 ${config.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="font-semibold text-gray-900">{error.full_title}</h4>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${config.badge}`}>
                          {error.severity}
                        </span>
                        <span className="text-sm font-semibold text-green-700">
                          Save ${error.potential_savings.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{error.one_line_explanation}</p>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Confidence Level</span>
                    <span className="font-medium">{error.confidence}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${config.bar} h-2 rounded-full transition-all`}
                      style={{ width: `${error.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Detailed Explanation */}
                <div className="space-y-3 text-sm">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Patient-Friendly Explanation</h5>
                    <p className="text-gray-700">{error.detailed_explanation}</p>
                  </div>

                  {error.evidence && (
                    <div className="bg-white border border-gray-200 rounded-md p-3">
                      <h5 className="font-medium text-gray-900 mb-2">Evidence</h5>
                      <dl className="space-y-1.5">
                        <div>
                          <dt className="text-gray-600">Rule Violated:</dt>
                          <dd className="font-medium text-gray-900">{error.evidence.rule_violated}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">Expected Billing:</dt>
                          <dd className="font-medium text-gray-900">{error.evidence.expected_billing}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">Actual Billing:</dt>
                          <dd className="font-medium text-gray-900">{error.evidence.actual_billing}</dd>
                        </div>
                        {error.evidence.comparison_data && (
                          <div>
                            <dt className="text-gray-600">Comparison Data:</dt>
                            <dd className="font-medium text-gray-900">{error.evidence.comparison_data}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Recommended Action</h5>
                    <p className="text-gray-700">{error.recommended_action}</p>
                  </div>

                  {error.regulatory_citation && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">Regulatory Citation</h5>
                      <p className="text-gray-700 font-mono text-xs">{error.regulatory_citation}</p>
                    </div>
                  )}

                  {error.dispute_priority && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-xs font-medium text-gray-600 uppercase">
                        Dispute Priority: {error.dispute_priority}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Technical Details (Collapsible) */}
          <details className="border border-gray-200 rounded-lg">
            <summary className="px-4 py-3 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
              View Technical Details (For Dispute Letter)
            </summary>
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-3">
              {sortedErrors.map((error, idx) => (
                <div key={idx} className="text-sm">
                  <div className="font-medium text-gray-900 mb-1">
                    {idx + 1}. {error.full_title}
                  </div>
                  <p className="text-gray-700 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                    {error.technical_details}
                  </p>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
