import { NextRequest, NextResponse } from 'next/server';
import { getAllStats } from '@/lib/passcode-tracker';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const adminPassword = process.env.ADMIN_PANEL_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json({ error: 'Admin panel not configured' }, { status: 500 });
    }

    if (password !== adminPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const stats = await getAllStats();

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}