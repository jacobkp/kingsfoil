'use client';

import { LineItem as LineItemType, BillingError } from '@/lib/types';
import { useState } from 'react';

interface LineItemProps {
  item: LineItemType;
  errors: BillingError[];
}

export default function LineItem({ item, errors }: LineItemProps) {
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Find errors affecting this line
  const lineErrors = errors.filter(error =>
    error.affected_lines.includes(item.line_number)
  );

  const hasErrors = lineErrors.length > 0;

  return (
    <div className={`relative ${hasErrors ? 'bg-red-50' : ''}`}>
      {/* Error indicator border */}
      {hasErrors && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-200" />}

      <div
        className={`flex items-center gap-4 p-4 hover:bg-indigo-50 transition-colors ${
          hasErrors ? 'pl-6' : ''
        }`}
      >
        {/* Line number badge */}
        <div className="flex-shrink-0">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-500 text-white text-xs font-medium">
            {item.line_number}
          </span>
        </div>

        {/* Service date */}
        <div className="flex-shrink-0 w-24 text-sm text-gray-600">
          {new Date(item.service_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>

        {/* Service description */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base text-gray-900">{item.description}</div>
          {item.plain_english_explanation && (
            <div className="text-gray-600 italic text-sm mt-1">
              {item.plain_english_explanation}
            </div>
          )}
          {/* CPT/HCPCS codes */}
          <div className="flex gap-2 mt-2">
            {item.cpt_code && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-gray-200 text-gray-700">
                CPT: {item.cpt_code}
              </span>
            )}
            {item.hcpcs_code && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-gray-200 text-gray-700">
                HCPCS: {item.hcpcs_code}
              </span>
            )}
            {item.modifiers && item.modifiers.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-gray-200 text-gray-700">
                MOD: {item.modifiers.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Quantity */}
        {item.quantity > 1 && (
          <div className="flex-shrink-0 text-sm text-gray-600">
            Qty: {item.quantity}
          </div>
        )}

        {/* Unit price */}
        <div className="flex-shrink-0 w-24 text-sm text-gray-600 text-right">
          ${item.unit_price.toFixed(2)}
        </div>

        {/* Total charge */}
        <div className="flex-shrink-0 w-32 text-base font-bold text-gray-900 text-right">
          ${item.total_charge.toFixed(2)}
        </div>

        {/* Error badge */}
        {hasErrors && (
          <button
            onClick={() => setShowErrorDetails(!showErrorDetails)}
            className="flex-shrink-0"
          >
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-200 text-red-700 hover:bg-red-300 transition-colors">
              ⚠️ {lineErrors.length} issue{lineErrors.length > 1 ? 's' : ''}
            </span>
          </button>
        )}
      </div>

      {/* Error details popover */}
      {showErrorDetails && hasErrors && (
        <div className="border-t border-red-200 bg-white p-4 mx-4 mb-4 rounded shadow-lg">
          {lineErrors.map((error, idx) => (
            <div key={error.id} className={idx > 0 ? 'mt-4 pt-4 border-t' : ''}>
              <div className="flex items-start gap-2 mb-2">
                <span className="text-red-600 text-lg">⚠️</span>
                <div className="flex-1">
                  <h4 className="font-bold text-red-700 uppercase text-sm">
                    {error.title}
                  </h4>
                  <p className="text-gray-700 text-sm mt-2">{error.explanation}</p>

                  {error.potential_savings > 0 && (
                    <p className="text-green-700 font-bold text-sm mt-2">
                      Potential savings: ${error.potential_savings.toFixed(2)}
                    </p>
                  )}

                  {/* Confidence bar */}
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Confidence: {error.confidence}%</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-xs">
                        <div
                          className="h-full bg-indigo-600"
                          style={{ width: `${error.confidence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
