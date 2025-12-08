'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';

const VALID_PASSCODES = [
  'athelas',
  'miruvor',
  'lembas',
  'mithrandir',
  'earendil',
  'elendil',
  'telperion',
  'laurelin',
  'silmaril',
  'anduril',
];

interface PasscodeGateProps {
  onSuccess: () => void;
}

export default function PasscodeGate({ onSuccess }: PasscodeGateProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const normalizedPasscode = passcode.trim().toLowerCase();

    if (VALID_PASSCODES.includes(normalizedPasscode)) {
      // Store authorization in sessionStorage
      sessionStorage.setItem('authorized', 'true');
      sessionStorage.setItem('passcode_used', passcode.trim());

      // Clear error and input
      setError('');
      setPasscode('');

      // Call success callback
      onSuccess();
    } else {
      // Show error and clear input
      setError('Invalid access code');
      setPasscode('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/kingsfoil_logo.png"
            alt="Kingsfoil Logo"
            width={224}
            height={72}
            priority
            className="object-contain"
          />
        </div>

        {/* Description */}
        <div className="text-center mb-8">
          <p className="text-gray-700 mb-3">
            AI-powered medical bill analysis that catches billing errors, detects overcharges, and helps you save money.
          </p>
          <p className="text-sm text-gray-500">
            Beta Access • Private Invite Only
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password Input */}
          <div>
            <input
              type="password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError(''); // Clear error when typing
              }}
              placeholder="Enter access code"
              autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A6354] focus:border-[#1A6354] outline-none transition-colors text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#1A6354] text-white py-3 rounded-lg font-medium hover:bg-[#0f4a3f] transition-colors focus:ring-2 focus:ring-[#1A6354] focus:ring-offset-2"
          >
            Access App
          </button>
        </form>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Private beta • Contact support for access
        </p>
      </div>
    </div>
  );
}
