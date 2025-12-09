import { NextRequest, NextResponse } from 'next/server';
import { getUploadCount } from '@/lib/passcode-tracker';

export async function POST(request: NextRequest) {
  try {
    const { passcode } = await request.json();

    if (!passcode) {
      return NextResponse.json({ error: 'Passcode required' }, { status: 400 });
    }

    const count = await getUploadCount(passcode);

    return NextResponse.json(count);
  } catch (error) {
    console.error('Get upload count error:', error);
    return NextResponse.json({ error: 'Failed to get upload count' }, { status: 500 });
  }
}