import { NextRequest, NextResponse } from 'next/server';
import { getVisionClient, getMediaType, parseClaudeJSON, withRetry } from '@/lib/anthropic';
import { ExtractedBill } from '@/lib/types';
import { PROMPTS } from '@/lib/prompts';
import { MODELS, TOKEN_LIMITS } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    console.log('[API /extract] Request received');
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('[API /extract] ERROR: No file provided');
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('[API /extract] File received:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB, ${file.type})`);

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      console.error('[API /extract] ERROR: File too large -', (file.size / 1024 / 1024).toFixed(2), 'MB');
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      console.error('[API /extract] ERROR: Invalid file type -', file.type);
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload a JPEG, PNG, or PDF file.' },
        { status: 400 }
      );
    }

    // Convert file to base64
    console.log('[API /extract] Converting file to base64...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');

    // Get media type
    const mediaType = getMediaType(file);
    const isPDF = file.type === 'application/pdf';
    console.log('[API /extract] Calling Claude Vision API...');

    // Call Claude Vision API
    const client = getVisionClient();
    const prompt = PROMPTS.EXTRACT_BILL;

    const contentBlock = isPDF
      ? {
          type: 'document' as const,
          source: {
            type: 'base64' as const,
            media_type: 'application/pdf' as const,
            data: base64Data,
          },
        }
      : {
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: mediaType,
            data: base64Data,
          },
        };

    const response = await withRetry(() =>
      client.messages.create({
        model: MODELS.VISION,
        max_tokens: TOKEN_LIMITS.VISION,
        messages: [
          {
            role: 'user',
            content: [
              contentBlock,
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      })
    );

    // Extract text from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    // Parse JSON response
    console.log('[API /extract] Parsing Claude response...');
    let extractedData: ExtractedBill;
    try {
      extractedData = parseClaudeJSON<ExtractedBill>(textContent.text);
      console.log('[API /extract] Successfully extracted bill data. Line items:', extractedData?.line_items?.length || 0);
    } catch (parseError) {
      console.error('[API /extract] JSON parsing error:', parseError);
      console.error('[API /extract] Raw response:', textContent.text.substring(0, 500)); // Log first 500 chars
      return NextResponse.json(
        {
          success: false,
          error: 'We encountered an issue reading your bill. Please try again or try a different image.',
        },
        { status: 500 }
      );
    }

    console.log('[API /extract] Success - returning extracted data');

    // Combine document header text with full extracted text for classification
    const fullTextForClassification = extractedData.document_header_text
      ? `${extractedData.document_header_text}\n\n${textContent.text}`
      : textContent.text;

    console.log('[API /extract] Document header text length:', extractedData.document_header_text?.length || 0, 'chars');

    return NextResponse.json({
      success: true,
      data: extractedData,
      extracted_text: fullTextForClassification, // Include header + full text for classification
    });
  } catch (error) {
    console.error('Extract API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'We encountered an issue reading your bill. Please try again or try a different image.',
      },
      { status: 500 }
    );
  }
}
