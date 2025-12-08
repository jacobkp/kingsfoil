'use client';

import { useState, useEffect } from 'react';

export default function BreakpointWarning() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setShowWarning(window.innerWidth < 1024);
    };

    // Check on mount
    checkWidth();

    // Check on resize
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white px-4 py-3 text-center z-50">
      <p className="text-sm font-medium">
        This application works best on larger screens. Please use a desktop or tablet.
      </p>
    </div>
  );
}
