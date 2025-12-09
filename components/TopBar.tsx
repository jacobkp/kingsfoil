'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';

interface TopBarProps {
  onLogout: () => void;
}

export default function TopBar({ onLogout }: TopBarProps) {
  const [passcodeUsed, setPasscodeUsed] = useState<string>('');
  const [uploadQuota, setUploadQuota] = useState<{ used: number; remaining: number; limit: number } | null>(null);

  useEffect(() => {
    // Read passcode from sessionStorage
    const passcode = sessionStorage.getItem('passcode_used') || '';
    setPasscodeUsed(passcode);

    // Fetch upload quota
    if (passcode) {
      fetch('/api/passcode/get-upload-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      })
        .then((res) => res.json())
        .then((data) => setUploadQuota(data))
        .catch((err) => console.error('Failed to fetch upload quota:', err));
    }
  }, []);

  const handleLogout = () => {
    // Clear sessionStorage
    sessionStorage.clear();
    // Call logout callback
    onLogout();
  };

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="h-16 px-6 flex items-center justify-between">
        {/* Left Side - Logo */}
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Image
            src="/images/kingsfoil_logo.png"
            alt="Kingsfoil"
            width={140}
            height={45}
            className="object-contain h-10"
            priority
          />
        </Link>

        {/* Right Side - Passcode Badge, Upload Quota, and Logout */}
        <div className="flex items-center gap-3">
          {passcodeUsed && (
            <div className="bg-gray-100 px-3 py-1.5 rounded-full text-sm text-gray-700 flex items-center gap-2">
              <span>🔑</span>
              <span className="font-medium">{passcodeUsed}</span>
            </div>
          )}

          {uploadQuota && (
            <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              uploadQuota.remaining > 3
                ? 'bg-green-100 text-green-800'
                : uploadQuota.remaining > 0
                ? 'bg-orange-100 text-orange-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {uploadQuota.used}/{uploadQuota.limit} uploads
            </div>
          )}

          <button
            onClick={handleLogout}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Logout"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
