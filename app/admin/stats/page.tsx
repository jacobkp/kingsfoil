'use client';

import { useState } from 'react';

interface PasscodeStats {
  total_logins: number;
  total_uploads: number;
  uploads_remaining: number;
  upload_limit: number;
  last_used: string | null;
  uploads_by_date: Record<string, number>;
  logins_by_date: Record<string, number>;
  days_active: number;
  avg_uploads_per_day: string | number;
}

export default function AdminStatsPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState<Record<string, PasscodeStats> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Authentication failed');
        return;
      }

      setIsAuthenticated(true);
      setStats(data.stats);
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A6354] focus:border-[#1A6354] outline-none transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A6354] text-white py-3 rounded-lg font-medium hover:bg-[#0f4a3f] transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Authenticating...' : 'Access Stats'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Passcode Usage Statistics</h1>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setPassword('');
              setStats(null);
            }}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Logout
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(stats).map(([passcode, data]) => (
              <div key={passcode} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{passcode}</h2>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      data.uploads_remaining > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {data.uploads_remaining > 0 ? 'Active' : 'Exhausted'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Logins:</span>
                    <span className="text-sm font-semibold text-gray-900">{data.total_logins}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Uploads:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {data.total_uploads} / {data.upload_limit}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Uploads Remaining:</span>
                    <span
                      className={`text-sm font-semibold ${
                        data.uploads_remaining > 3
                          ? 'text-green-600'
                          : data.uploads_remaining > 0
                          ? 'text-orange-600'
                          : 'text-red-600'
                      }`}
                    >
                      {data.uploads_remaining}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Days Active:</span>
                    <span className="text-sm font-semibold text-gray-900">{data.days_active}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Uploads/Day:</span>
                    <span className="text-sm font-semibold text-gray-900">{data.avg_uploads_per_day}</span>
                  </div>

                  {data.last_used && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Used:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(data.last_used).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Upload Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Upload Quota</span>
                    <span>
                      {data.total_uploads}/{data.upload_limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        data.uploads_remaining > 3
                          ? 'bg-green-500'
                          : data.uploads_remaining > 0
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${(data.total_uploads / data.upload_limit) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {stats && Object.keys(stats).length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <p>No passcode data available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}