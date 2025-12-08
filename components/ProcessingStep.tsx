'use client';

import { ProcessingStep as ProcessingStepType } from '@/lib/types';

interface ProcessingStepProps {
  step: ProcessingStepType;
}

export default function ProcessingStep({ step }: ProcessingStepProps) {
  return (
    <div className="flex items-start gap-4">
      {/* Circle indicator */}
      <div className="flex-shrink-0 mt-1">
        {step.status === 'completed' ? (
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
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
        ) : step.status === 'in_progress' ? (
          <div className="w-8 h-8 rounded-full bg-[#1A6354] flex items-center justify-center animate-pulse">
            <div className="w-3 h-3 rounded-full bg-white"></div>
          </div>
        ) : step.status === 'error' ? (
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-white font-bold">!</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3
          className={`font-bold text-lg ${
            step.status === 'completed'
              ? 'text-green-700'
              : step.status === 'in_progress'
              ? 'text-[#1A6354]'
              : step.status === 'error'
              ? 'text-red-700'
              : 'text-gray-500'
          }`}
        >
          {step.title}
        </h3>
        <p className="text-gray-600 text-sm mt-1">{step.description}</p>
        {step.status === 'in_progress' && (
          <p className="text-[#1A6354] text-xs mt-2 italic">
            Estimated time: {step.estimatedTime} seconds
          </p>
        )}
      </div>
    </div>
  );
}
