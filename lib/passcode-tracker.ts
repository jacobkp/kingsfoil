import { kv } from '@vercel/kv';

const UPLOAD_LIMIT = 10; // Maximum uploads per passcode

export async function trackAndValidateUpload(passcode: string) {
  const totalKey = `passcode:${passcode}:total_uploads`;
  const dailyKey = `passcode:${passcode}:uploads_by_date`;
  const today = new Date().toISOString().split('T')[0];

  // Get current total
  const totalUploads = (await kv.get<number>(totalKey)) || 0;

  // Check total limit
  if (totalUploads >= UPLOAD_LIMIT) {
    return { allowed: false, total: totalUploads, limit: UPLOAD_LIMIT };
  }

  // Increment total counter
  await kv.incr(totalKey);

  // Track by date (for pattern analysis)
  await kv.hincrby(dailyKey, today, 1);

  return { allowed: true, total: totalUploads + 1, limit: UPLOAD_LIMIT };
}

export async function trackLogin(passcode: string) {
  const loginKey = `passcode:${passcode}:logins`;
  const lastUsedKey = `passcode:${passcode}:last_used`;
  const dailyLoginsKey = `passcode:${passcode}:logins_by_date`;
  const today = new Date().toISOString().split('T')[0];

  // Increment total logins
  await kv.incr(loginKey);

  // Update last used timestamp
  await kv.set(lastUsedKey, new Date().toISOString());

  // Track daily logins
  await kv.hincrby(dailyLoginsKey, today, 1);
}

export async function getUploadCount(passcode: string) {
  const totalKey = `passcode:${passcode}:total_uploads`;
  const totalUploads = (await kv.get<number>(totalKey)) || 0;

  return {
    used: totalUploads,
    remaining: Math.max(0, UPLOAD_LIMIT - totalUploads),
    limit: UPLOAD_LIMIT,
  };
}

export async function getAllStats() {
  const passcodes = (process.env.VALID_PASSCODES || '').split(',').map(p => p.trim()).filter(p => p.length > 0);
  const stats: Record<string, any> = {};

  for (const passcode of passcodes) {
    // Get all data for this passcode
    const totalLogins = (await kv.get<number>(`passcode:${passcode}:logins`)) || 0;
    const totalUploads = (await kv.get<number>(`passcode:${passcode}:total_uploads`)) || 0;
    const lastUsed = (await kv.get<string>(`passcode:${passcode}:last_used`)) || null;
    const uploadsByDate = (await kv.hgetall(`passcode:${passcode}:uploads_by_date`)) || {};
    const loginsByDate = (await kv.hgetall(`passcode:${passcode}:logins_by_date`)) || {};

    const uploadDays = Object.keys(uploadsByDate).length;
    const loginDays = Object.keys(loginsByDate).length;

    stats[passcode] = {
      total_logins: totalLogins,
      total_uploads: totalUploads,
      uploads_remaining: Math.max(0, UPLOAD_LIMIT - totalUploads),
      upload_limit: UPLOAD_LIMIT,
      last_used: lastUsed,
      uploads_by_date: uploadsByDate,
      logins_by_date: loginsByDate,
      days_active: loginDays,
      avg_uploads_per_day: uploadDays > 0 ? (totalUploads / uploadDays).toFixed(2) : 0,
    };
  }

  return stats;
}