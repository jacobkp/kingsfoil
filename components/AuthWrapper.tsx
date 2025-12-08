'use client';

import { useState, useEffect, ReactNode } from 'react';
import PasscodeGate from './PasscodeGate';
import TopBar from './TopBar';

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check sessionStorage on mount
    const authorized = sessionStorage.getItem('authorized') === 'true';
    setIsAuthorized(authorized);
    setIsLoading(false);
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthorized(true);
  };

  const handleLogout = () => {
    setIsAuthorized(false);
  };

  // Show loading state briefly while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Show passcode gate if not authorized
  if (!isAuthorized) {
    return <PasscodeGate onSuccess={handleAuthSuccess} />;
  }

  // Show app with top bar if authorized
  return (
    <>
      <TopBar onLogout={handleLogout} />
      <main className="pt-0">{children}</main>
    </>
  );
}
