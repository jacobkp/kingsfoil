import { NextRequest, NextResponse } from 'next/server';
import { trackAndValidateUpload } from '@/lib/passcode-tracker';

export async function POST(request: NextRequest) {
  try {
    const { passcode } = await request.json();

    if (!passcode) {
      return NextResponse.json({ error: 'Passcode required' }, { status: 400 });
    }

    const result = await trackAndValidateUpload(passcode);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Validate upload error:', error);
    return NextResponse.json({ error: 'Failed to validate upload' }, { status: 500 });
  }
}