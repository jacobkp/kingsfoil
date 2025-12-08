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

  useEffect(() => {
    // Read passcode from sessionStorage
    const passcode = sessionStorage.getItem('passcode_used') || '';
    setPasscodeUsed(passcode);
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

        {/* Right Side - Passcode Badge and Logout */}
        <div className="flex items-center gap-3">
          {passcodeUsed && (
            <div className="bg-gray-100 px-3 py-1.5 rounded-full text-sm text-gray-700 flex items-center gap-2">
              <span>🔑</span>
              <span className="font-medium">{passcodeUsed}</span>
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
