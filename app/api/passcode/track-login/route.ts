import { NextRequest, NextResponse } from 'next/server';
import { trackLogin } from '@/lib/passcode-tracker';

export async function POST(request: NextRequest) {
  try {
    const { passcode } = await request.json();

    if (!passcode) {
      return NextResponse.json({ error: 'Passcode required' }, { status: 400 });
    }

    await trackLogin(passcode);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track login error:', error);
    return NextResponse.json({ error: 'Failed to track login' }, { status: 500 });
  }
}