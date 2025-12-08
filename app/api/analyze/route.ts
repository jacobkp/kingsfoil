import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisClient, parseClaudeJSON, withRetry } from '@/lib/anthropic';
import { AnalyzeApiRequest, AnalysisResult } from '@/lib/types';
import { PROMPTS, formatPrompt, generateUserContextSection } from '@/lib/prompts';
import { MODELS, TOKEN_LIMITS } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    console.log('[API /analyze] Request received');
    const body: AnalyzeApiRequest = await request.json();
    const { extracted_bill, user_context, classification } = body;

    if (!extracted_bill) {
      console.error('[API /analyze] ERROR: No bill data provided');
      return NextResponse.json(
        { success: false, error: 'No bill data provided' },
        { status: 400 }
      );
    }

    console.log('[API /analyze] Analyzing bill with', extracted_bill.line_items?.length || 0, 'line items. Document type:', classification?.type || 'UNKNOWN');

    // Get current system date
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12

    console.log('[API /analyze] Current date for validation:', currentDate);
    console.log('[API /analyze] Line item dates:', extracted_bill.line_items?.map((item: any) => item.service_date));

    // Generate user context section
    const userContextSection = generateUserContextSection(user_context || null);

    console.log('[API /analyze] Calling Claude API for error detection...');
    // Call Claude to analyze for errors with retry logic
    const client = getAnalysisClient();
    const prompt = formatPrompt(PROMPTS.ANALYZE_ERRORS, {
      CURRENT_DATE: currentDate,
      CURRENT_YEAR: currentYear.toString(),
      CURRENT_MONTH: currentMonth.toString(),
      DOCUMENT_TYPE: classification?.type || 'MEDICAL_BILL',
      USER_CONTEXT_SECTION: userContextSection,
      BILL_DATA: JSON.stringify(extracted_bill, null, 2),
    });

    const response = await withRetry(() =>
      client.messages.create({
        model: MODELS.ANALYSIS,
        max_tokens: TOKEN_LIMITS.ANALYSIS,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      })
    );

    // Extract text from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    console.log('[API /analyze] Parsing analysis results...');
    // Parse JSON response
    let result: AnalysisResult;
    try {
      result = parseClaudeJSON<AnalysisResult>(textContent.text);
      console.log('[API /analyze] Analysis complete. Total errors found:', result?.all_errors?.length || 0);
    } catch (parseError) {
      console.error('[API /analyze] JSON parsing error:', parseError);
      console.error('[API /analyze] Raw response:', textContent.text.substring(0, 500)); // Log first 500 chars
      return NextResponse.json(
        {
          success: false,
          error: 'We encountered an issue analyzing your bill. Please try again.',
        },
        { status: 500 }
      );
    }

    // Validate we have the new structure
    if (!result.line_items_with_errors || !result.cross_line_errors || !result.all_errors || !result.summary) {
      console.error('[API /analyze] Invalid structure in analysis result');
      return NextResponse.json(
        {
          success: false,
          error: 'We encountered an issue analyzing your bill. Please try again.',
        },
        { status: 500 }
      );
    }

    // For backward compatibility, also populate the legacy errors array
    if (!result.errors) {
      result.errors = result.all_errors;
    }

    console.log('[API /analyze] Success - returning analysis data');
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'We encountered an issue analyzing your bill. Please try again.',
      },
      { status: 500 }
    );
  }
}
